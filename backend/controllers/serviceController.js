"use strict";

const { sendJson } = require("../utils/http");

function getServices(response, serviceModel) {
    sendJson(response, 200, {
        categories: serviceModel.listRequestTypes(),
        services: serviceModel.list().map((service) => ({
            ...service,
            label: serviceModel.getCategoryLabel(service.category)
        }))
    });
}

module.exports = { getServices };
