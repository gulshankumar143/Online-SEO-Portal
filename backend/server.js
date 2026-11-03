"use strict";

const { createServer: createHttpServer } = require("node:http");
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { InquiryModel } = require("./models/inquiryModel");
const { ServiceModel } = require("./models/serviceModel");
const { EmailService } = require("./services/emailService");
const { createCorsMiddleware } = require("./middleware/cors");
const { serveFrontendConfig } = require("./middleware/frontendConfig");
const { handleApiRequest } = require("./routes/apiRoutes");
const { sendJson } = require("./utils/http");
const { setSecurityHeaders } = require("./middleware/securityHeaders");
const { serveStaticFile } = require("./middleware/staticFiles");

function createServer(options = {}) {
    const frontendRoot = path.resolve(options.frontendRoot || path.join(__dirname, "..", "frontend"));
    const inquiryModel = new InquiryModel({
        uri: options.mongoUri,
        client: options.mongoClient
    });
    const serviceModel = new ServiceModel();
    const emailService = options.emailService || new EmailService(options.emailConfig);
    const allowedOrigins = options.allowedOrigins || (process.env.CORS_ORIGINS || "")
        .split(",").map((origin) => origin.trim()).filter(Boolean);
    const applyCors = createCorsMiddleware(allowedOrigins);

    const server = createHttpServer(async (request, response) => {
        try {
            setSecurityHeaders(response);
            if (!applyCors(request, response)) return;
            const url = new URL(request.url, "http://localhost");

            if (url.pathname === "/config.js") {
                serveFrontendConfig(response);
                return;
            }

            if (await handleApiRequest(request, response, { inquiryModel, serviceModel, emailService })) {
                if (!response.writableEnded && url.pathname.startsWith("/api/")) {
                    sendJson(response, 404, { error: "Not found." });
                }
                return;
            }

            if (request.method !== "GET" && request.method !== "HEAD") {
                response.setHeader("Allow", "GET, HEAD");
                sendJson(response, 405, { error: "Method not allowed." });
                return;
            }
            await serveStaticFile(request, response, url.pathname, frontendRoot);
        } catch (error) {
            console.error("Unhandled request error:", error);
            if (!response.headersSent) {
                sendJson(response, 500, { error: "An unexpected server error occurred." });
            } else {
                response.destroy(error);
            }
        }
    });

    return {
        server,
        ready: inquiryModel.ready,
        close(callback) {
            const closeServer = server.listening
                ? new Promise((resolve, reject) => {
                    server.close((error) => error ? reject(error) : resolve());
                })
                : Promise.resolve();
            const closing = closeServer.then(async () => {
                try {
                    await inquiryModel.close();
                } finally {
                    emailService.close();
                }
            });
            if (callback) {
                closing.then(() => callback(), (error) => callback(error));
            }
            return closing;
        }
    };
}

if (require.main === module) {
    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || "127.0.0.1";
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        throw new Error("PORT must be a valid port number.");
    }

    const application = createServer({
        mongoUri: process.env.MONGODB_URI,
        allowedOrigins: (process.env.CORS_ORIGINS || "")
            .split(",").map((origin) => origin.trim()).filter(Boolean)
    });
    application.ready.then(() => {
        application.server.listen(port, host, () => {
            const address = application.server.address();
            console.log(`Online SEO Portal is available at http://${host}:${address.port}`);
        });
    }, (error) => {
        console.error("Unable to connect to MongoDB:", error);
        application.close((closeError) => {
            if (closeError) console.error("Unable to close MongoDB cleanly:", closeError);
            process.exitCode = 1;
        });
    });

    let shuttingDown = false;
    function shutdown() {
        if (shuttingDown) return;
        shuttingDown = true;
        application.close((error) => {
            if (error) {
                console.error("Unable to close the server cleanly:", error);
                process.exitCode = 1;
            }
        });
    }
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}

module.exports = { createServer };
