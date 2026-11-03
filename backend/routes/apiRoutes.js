"use strict";

const { createContact } = require("../controllers/contactController");
const { getHealth } = require("../controllers/healthController");
const { getServices } = require("../controllers/serviceController");
const { JsonBodyError, parseJsonBody } = require("../middleware/jsonBody");
const { sendJson } = require("../utils/http");

async function handleApiRequest(request, response, { inquiryModel, serviceModel, emailService }) {
    const url = new URL(request.url, "http://localhost");

    if (url.pathname === "/api/health") {
        if (request.method !== "GET") {
            response.setHeader("Allow", "GET");
            sendJson(response, 405, { error: "Method not allowed." });
            return true;
        }
        await getHealth(response, inquiryModel);
        return true;
    }

    if (url.pathname === "/api/services") {
        if (request.method !== "GET") {
            response.setHeader("Allow", "GET");
            sendJson(response, 405, { error: "Method not allowed." });
            return true;
        }
        getServices(response, serviceModel);
        return true;
    }

    if (url.pathname === "/api/contact") {
        if (request.method !== "POST") {
            response.setHeader("Allow", "POST");
            sendJson(response, 405, { error: "Method not allowed." });
            return true;
        }
        try {
            const payload = await parseJsonBody(request);
            await createContact(payload, response, inquiryModel, emailService);
        } catch (error) {
            if (error instanceof JsonBodyError) {
                sendJson(response, error.status, { error: error.message });
                return true;
            }
            console.error("Unable to process a contact request:", error);
            sendJson(response, 400, { error: "Unable to read your request. Please try again." });
        }
        return true;
    }

    return url.pathname.startsWith("/api/");
}

module.exports = { handleApiRequest };
