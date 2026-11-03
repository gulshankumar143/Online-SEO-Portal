"use strict";

const { sendJson } = require("../utils/http");

function createCorsMiddleware(origins) {
    const allowedOrigins = new Set(origins);

    return function applyCors(request, response) {
        const origin = request.headers.origin;
        response.setHeader("Vary", "Origin");
        if (!origin) return true;
        if (!allowedOrigins.has(origin)) {
            sendJson(response, 403, { error: "This origin is not allowed." });
            return false;
        }

        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Access-Control-Max-Age", "600");
        if (request.method === "OPTIONS") {
            response.writeHead(204);
            response.end();
            return false;
        }
        return true;
    };
}

module.exports = { createCorsMiddleware };
