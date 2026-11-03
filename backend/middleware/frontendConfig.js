"use strict";

function serveFrontendConfig(response, apiBaseUrl = "") {
    response.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-store"
    });
    response.end(`window.APP_CONFIG = { apiBaseUrl: ${JSON.stringify(apiBaseUrl)} };`);
}

module.exports = { serveFrontendConfig };
