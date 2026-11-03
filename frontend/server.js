"use strict";

const { createServer } = require("node:http");
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { serveFrontendConfig } = require("../backend/middleware/frontendConfig");
const { setSecurityHeaders } = require("../backend/middleware/securityHeaders");
const { serveStaticFile } = require("../backend/middleware/staticFiles");

const frontendRoot = __dirname;
const port = Number(process.env.FRONTEND_PORT || 5173);
const host = process.env.FRONTEND_HOST || "127.0.0.1";
if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("FRONTEND_PORT must be a valid port number.");
}

const server = createServer(async (request, response) => {
    setSecurityHeaders(response);
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/config.js") {
        serveFrontendConfig(response, process.env.API_BASE_URL || "http://127.0.0.1:3000");
        return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.setHeader("Allow", "GET, HEAD");
        response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "Method not allowed." }));
        return;
    }
    await serveStaticFile(request, response, url.pathname, frontendRoot);
});

server.listen(port, host, () => {
    console.log(`Frontend is available at http://${host}:${server.address().port}`);
});

function shutdown() {
    server.close((error) => {
        if (error) {
            console.error("Unable to close the frontend server cleanly:", error);
            process.exitCode = 1;
        }
    });
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
