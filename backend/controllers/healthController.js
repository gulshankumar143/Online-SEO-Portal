"use strict";

const { sendJson } = require("../utils/http");

async function getHealth(response, inquiryModel) {
    try {
        await inquiryModel.ping();
        sendJson(response, 200, { status: "ok", database: "connected" });
    } catch (error) {
        console.error("Health check could not reach MongoDB:", error);
        sendJson(response, 503, { status: "unavailable", database: "disconnected" });
    }
}

module.exports = { getHealth };
