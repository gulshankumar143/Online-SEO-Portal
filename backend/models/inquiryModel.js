"use strict";

const { MongoClient } = require("mongodb");

const SERVICES = new Set([
    "SEO & Marketing",
    "Content & Links",
    "Web & App",
    "Free SEO submission list",
    "Other"
]);

class InquiryValidationError extends Error {}

function validateInquiry(payload) {
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
        throw new InquiryValidationError("Please submit a valid consultation request.");
    }

    const fields = ["name", "email", "phone", "service", "message"];
    if (fields.some((field) => payload[field] !== undefined && typeof payload[field] !== "string")) {
        throw new InquiryValidationError("Please check your entries and try again.");
    }

    const inquiry = {
        name: (payload.name || "").trim(),
        email: (payload.email || "").trim(),
        phone: (payload.phone || "").trim(),
        service: (payload.service || "").trim(),
        message: (payload.message || "").trim()
    };

    if (!inquiry.name || inquiry.name.length > 100) {
        throw new InquiryValidationError("Please enter your name (up to 100 characters).");
    }
    if (
        inquiry.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)
    ) {
        throw new InquiryValidationError("Please enter a valid email address.");
    }
    if (
        inquiry.phone.length > 30 ||
        (inquiry.phone && !/^[+()\d.\-\s]+$/.test(inquiry.phone))
    ) {
        throw new InquiryValidationError("Please enter a valid phone number.");
    }
    if (!SERVICES.has(inquiry.service)) {
        throw new InquiryValidationError("Please choose a service from the list.");
    }
    if (!inquiry.message || inquiry.message.length > 2000) {
        throw new InquiryValidationError("Please enter a message (up to 2,000 characters).");
    }

    return inquiry;
}

class InquiryModel {
    constructor({ uri, client } = {}) {
        const connectionString = uri || "mongodb://127.0.0.1:27017/online_seo_portal";
        this.client = client || new MongoClient(connectionString);
        this.ready = this.client.connect();
        this.inquiries = this.client.db().collection("inquiries");
    }

    async create(payload) {
        const inquiry = validateInquiry(payload);
        await this.ready;
        const inserted = await this.inquiries.insertOne({
            ...inquiry,
            createdAt: new Date()
        });
        return { id: inserted.insertedId.toString(), inquiry };
    }

    async ping() {
        await this.ready;
        await this.client.db().command({ ping: 1 });
    }

    close() {
        return this.client.close();
    }
}

module.exports = { InquiryModel, InquiryValidationError };
