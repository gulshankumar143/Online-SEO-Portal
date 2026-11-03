"use strict";

const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const { createServer } = require("../server");

test("serves the frontend and stores valid consultation requests", async (t) => {
    const documents = [];
    const sentEmails = [];
    let nextId = 1;
    let failEmail = false;
    const mongoClient = {
        async connect() {},
        db() {
            return {
                async command() {
                    return { ok: 1 };
                },
                collection() {
                    return {
                        async insertOne(document) {
                            const insertedId = String(nextId++);
                            documents.push({ ...document, _id: insertedId });
                            return { insertedId };
                        }
                    };
                }
            };
        },
        async close() {}
    };
    const emailService = {
        async sendInquiry(inquiry) {
            if (failEmail) throw new Error("SMTP unavailable");
            sentEmails.push(inquiry);
        },
        close() {}
    };
    const application = createServer({
        mongoClient,
        emailService,
        allowedOrigins: ["http://localhost:5173"]
    });
    application.server.listen(0, "127.0.0.1");
    await once(application.server, "listening");
    await application.ready;
    const address = application.server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    t.after(async () => {
        await new Promise((resolve, reject) => {
            application.close((error) => error ? reject(error) : resolve());
        });
    });

    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /id="consultation-form"/);

    const frontendConfig = await fetch(`${baseUrl}/config.js`);
    assert.equal(frontendConfig.status, 200);
    assert.match(await frontendConfig.text(), /apiBaseUrl: ""/);

    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok", database: "connected" });

    const preflight = await fetch(`${baseUrl}/api/contact`, {
        method: "OPTIONS",
        headers: {
            Origin: "http://localhost:5173",
            "Access-Control-Request-Method": "POST"
        }
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:5173");

    const rejectedOrigin = await fetch(`${baseUrl}/api/services`, {
        headers: { Origin: "http://not-allowed.example" }
    });
    assert.equal(rejectedOrigin.status, 403);

    const servicesResponse = await fetch(`${baseUrl}/api/services`);
    assert.equal(servicesResponse.status, 200);
    const services = await servicesResponse.json();
    assert.equal(services.services.length, 12);
    assert.deepEqual(services.categories, [
        "SEO & Marketing",
        "Content & Links",
        "Web & App",
        "Free SEO submission list",
        "Other"
    ]);
    assert.ok(services.services.every((service) => service.label));

    const unsupportedMethod = await fetch(`${baseUrl}/api/services`, { method: "POST" });
    assert.equal(unsupportedMethod.status, 405);
    assert.equal(unsupportedMethod.headers.get("allow"), "GET");

    const privateFile = await fetch(`${baseUrl}/backend/server.js`);
    assert.equal(privateFile.status, 404);

    const stylesheet = await fetch(`${baseUrl}/style.css`);
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers.get("content-type"), /text\/css/);

    const invalidRequest = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", email: "not-an-email" })
    });
    assert.equal(invalidRequest.status, 400);

    const unsupportedBody = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "hello"
    });
    assert.equal(unsupportedBody.status, 415);

    const malformedRequest = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid"
    });
    assert.equal(malformedRequest.status, 400);

    const oversizedRequest = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "x".repeat(10_001) })
    });
    assert.equal(oversizedRequest.status, 413);

    const wrongMethod = await fetch(`${baseUrl}/api/contact`);
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get("allow"), "POST");

    const response = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Avery Customer",
            email: "avery@example.com",
            phone: "+1 555 123 4567",
            service: "SEO & Marketing",
            message: "I would like to discuss SEO for my business."
        })
    });
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.match(result.message, /request has been received/);
    assert.equal(result.id, "1");
    assert.equal(result.emailSent, true);
    assert.equal(documents.length, 1);
    assert.equal(sentEmails.length, 1);
    assert.equal(sentEmails[0].email, "avery@example.com");
    assert.deepEqual(
        Object.fromEntries(["name", "email", "service", "message"].map(
            (field) => [field, documents[0][field]]
        )),
        {
            name: "Avery Customer",
            email: "avery@example.com",
            service: "SEO & Marketing",
            message: "I would like to discuss SEO for my business."
        }
    );
    assert.ok(documents[0].createdAt instanceof Date);

    failEmail = true;
    const savedWithoutEmail = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Jordan Customer",
            email: "jordan@example.com",
            service: "Other",
            message: "Please call me about a different project."
        })
    });
    assert.equal(savedWithoutEmail.status, 201);
    const savedWithoutEmailResult = await savedWithoutEmail.json();
    assert.equal(savedWithoutEmailResult.emailSent, false);
    assert.match(savedWithoutEmailResult.message, /request was saved/);
    assert.equal(documents.length, 2);
});
