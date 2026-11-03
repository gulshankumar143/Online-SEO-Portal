"use strict";

function sendJson(response, status, payload) {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(payload));
}

module.exports = { sendJson };
