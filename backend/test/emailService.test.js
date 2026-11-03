"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createInquiryEmail } = require("../services/emailService");

test("formats consultation notifications as styled, escaped HTML with a text fallback", () => {
    const email = createInquiryEmail({
        name: "Avery <Customer>",
        email: "avery@example.com",
        phone: "",
        service: "Content & Links",
        message: "Please review <script>alert('x')</script>.\nSecond line.",
        createdAt: new Date("2026-11-03T05:30:00.000Z")
    });

    assert.equal(email.subject, "New consultation request: Content & Links");
    assert.match(email.text, /Name: Avery <Customer>/);
    assert.match(email.text, /Phone: Not provided/);
    assert.match(email.text, /Second line\./);
    assert.match(email.html, /<!doctype html>/i);
    assert.match(email.html, /background-color:#123b82/);
    assert.match(email.html, /Avery &lt;Customer&gt;/);
    assert.match(email.html, /Content &amp; Links/);
    assert.match(email.html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
    assert.doesNotMatch(email.html, /<script>/i);
});
