"use strict";

const MAX_BODY_BYTES = 10_000;

class JsonBodyError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

async function parseJsonBody(request) {
    if (request.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") {
        throw new JsonBodyError(415, "Submit the request as JSON.");
    }

    const chunks = [];
    let size = 0;
    let tooLarge = false;
    for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
            tooLarge = true;
            chunks.length = 0;
            continue;
        }
        if (!tooLarge) chunks.push(chunk);
    }

    if (tooLarge) {
        throw new JsonBodyError(413, "Your request is too large. Please shorten your message.");
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        throw new JsonBodyError(400, "Submit a valid JSON request.");
    }
}

module.exports = { JsonBodyError, parseJsonBody };
