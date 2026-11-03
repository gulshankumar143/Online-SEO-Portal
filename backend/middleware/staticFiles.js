"use strict";

const { readFile } = require("node:fs/promises");
const path = require("node:path");

const MIME_TYPES = new Map([
    [".html", "text/html; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
    [".svg", "image/svg+xml"],
    [".ico", "image/x-icon"]
]);

function sendError(response, status, message) {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: message }));
}

function isAllowedStaticPath(relativePath) {
    const normalized = relativePath.split(path.sep);
    return (
        ["index.html", "script.js", "style.css"].includes(relativePath) ||
        ["assets", "img"].includes(normalized[0])
    );
}

async function serveStaticFile(request, response, pathname, frontendRoot) {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        sendError(response, 400, "Invalid URL path.");
        return;
    }

    const requestedPath = path.resolve(
        frontendRoot,
        decodedPath === "/" ? "index.html" : decodedPath.slice(1)
    );
    const relativePath = path.relative(frontendRoot, requestedPath);
    if (
        relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath) ||
        !isAllowedStaticPath(relativePath)
    ) {
        sendError(response, 404, "Not found.");
        return;
    }

    const contentType = MIME_TYPES.get(path.extname(requestedPath).toLowerCase());
    if (!contentType) {
        sendError(response, 404, "Not found.");
        return;
    }

    let content;
    try {
        content = await readFile(requestedPath);
    } catch (error) {
        if (error && error.code === "ENOENT") {
            sendError(response, 404, "Not found.");
            return;
        }
        console.error("Unable to read a static file:", error);
        sendError(response, 500, "Unable to load this page.");
        return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(request.method === "HEAD" ? undefined : content);
}

module.exports = { serveStaticFile };
