"use strict";

const { InquiryValidationError } = require("../models/inquiryModel");
const { EmailConfigurationError } = require("../services/emailService");
const { sendJson } = require("../utils/http");

async function createContact(payload, response, inquiryModel, emailService) {
    try {
        const { id, inquiry } = await inquiryModel.create(payload);
        let emailSent = true;
        try {
            await emailService.sendInquiry(inquiry);
        } catch (error) {
            emailSent = false;
            if (error instanceof EmailConfigurationError) {
                console.error("Consultation was saved, but email is not configured.");
            } else {
                console.error("Consultation was saved, but its email notification failed:", error);
            }
        }
        sendJson(response, 201, {
            message: emailSent
                ? "Thanks! Your request has been received. We’ll be in touch soon."
                : "Your request was saved, but we couldn’t send the email notification. Please contact us directly.",
            id,
            emailSent
        });
    } catch (error) {
        if (error instanceof InquiryValidationError) {
            sendJson(response, 400, { error: error.message });
            return;
        }
        console.error("Unable to save a contact request:", error);
        sendJson(response, 500, { error: "We couldn’t save your request. Please try again later." });
    }
}

module.exports = { createContact };
