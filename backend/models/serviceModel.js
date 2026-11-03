"use strict";

const REQUEST_TYPES = [
    "SEO & Marketing",
    "Content & Links",
    "Web & App",
    "Free SEO submission list",
    "Other"
];

const SERVICES = [
    {
        name: "Bookmarking",
        category: "content",
        description: "Save web pages for quick access later. Organize important links and revisit favorite resources with one click."
    },
    {
        name: "Directory",
        category: "seo",
        description: "An organized listing of names, contacts and information that helps users find relevant services."
    },
    {
        name: "Article",
        category: "content",
        description: "Written pieces that inform and engage on a specific topic, featured in blogs, journals and websites."
    },
    {
        name: "Press Release",
        category: "seo",
        description: "Boost visibility and elevate your rankings on search results pages to attract potential customers."
    },
    {
        name: "Classified",
        category: "seo",
        description: "Post ads to buy, sell or rent across real estate, cars, electronics and jobs, and reach thousands of buyers."
    },
    {
        name: "Business Listing",
        category: "seo",
        description: "An online profile showing your name, address, contact details, services and reviews."
    },
    {
        name: "Search Engine Optimization",
        category: "seo",
        description: "Get more visibility with SEO designed to put you on top of search results and grow your audience."
    },
    {
        name: "Pay Per Click",
        category: "seo",
        description: "PPC campaigns crafted to drive traffic, get conversions and fuel efficient growth."
    },
    {
        name: "Social Media Marketing",
        category: "seo",
        description: "Organic strategies that build your online presence and engage your target market."
    },
    {
        name: "Website Design & Dev",
        category: "web",
        description: "Responsive web design for a smooth user experience that reflects your brand."
    },
    {
        name: "Guest Blogging Service",
        category: "content",
        description: "Build brand authority and rankings with backlinks and new leads."
    },
    {
        name: "Mobile App Marketing",
        category: "web",
        description: "Reach your audience directly and build stronger brand and customer engagement."
    }
];

const CATEGORY_LABELS = {
    seo: "SEO & Marketing",
    content: "Content & Links",
    web: "Web & App"
};

class ServiceModel {
    list() {
        return SERVICES.map((service) => ({ ...service }));
    }

    listRequestTypes() {
        return [...REQUEST_TYPES];
    }

    getCategoryLabel(category) {
        return CATEGORY_LABELS[category];
    }
}

module.exports = { ServiceModel };
