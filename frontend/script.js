var serviceGrid = document.getElementById("sv");
var apiBaseUrl = (window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl || "").replace(/\/+$/, "");
var serviceTabs = Array.from(document.querySelectorAll("#tabs button"));
var activeServiceFilter = "all";
var serviceData = [];

function prefillContact(service, message) {
    var form = document.getElementById("consultation-form");
    if (!form) return;
    var select = form.elements.service;
    if (service && !Array.from(select.options).some(function (option) { return option.value === service; })) {
        var option = document.createElement("option");
        option.value = service;
        option.textContent = service;
        select.appendChild(option);
    }
    if (service) select.value = service;
    if (message) form.elements.message.value = message;
    document.getElementById("contact-status").textContent = "";
}

function renderServices() {
    serviceGrid.replaceChildren();
    var visibleServices = serviceData.filter(function (service) {
        return activeServiceFilter === "all" || service.category === activeServiceFilter;
    });
    visibleServices.forEach(function (service) {
        var card = document.createElement("article");
        card.className = "card";
        var category = document.createElement("small");
        category.textContent = service.label;
        var title = document.createElement("h3");
        title.textContent = service.name;
        var description = document.createElement("p");
        description.textContent = service.description;
        var action = document.createElement("a");
        action.className = "service-cta";
        action.href = "#consultation-form";
        action.textContent = "Discuss this service";
        action.dataset.prefillService = service.label;
        card.append(category, title, description, action);
        serviceGrid.appendChild(card);
    });
}

async function loadServices() {
    try {
        var response = await fetch(apiBaseUrl + "/api/services");
        var result = await response.json();
        if (!response.ok || !Array.isArray(result.services) || !Array.isArray(result.categories)) {
            throw new Error(result.error || "Services are temporarily unavailable.");
        }
        serviceData = result.services;
        var select = document.getElementById("consultation-form").elements.service;
        var selected = select.value;
        select.replaceChildren(new Option("Choose a service", ""));
        result.categories.forEach(function (category) {
            select.add(new Option(category, category));
        });
        if (result.categories.includes(selected)) select.value = selected;
        renderServices();
    } catch (error) {
        console.error("Unable to load services:", error);
        serviceGrid.textContent = "Services are temporarily unavailable. Please try again later.";
        serviceGrid.setAttribute("role", "status");
    }
}

serviceTabs.forEach(function (button) {
    button.addEventListener("click", function () {
        activeServiceFilter = button.dataset.f;
        serviceTabs.forEach(function (tab) {
            var selected = tab === button;
            tab.classList.toggle("on", selected);
            tab.setAttribute("aria-pressed", String(selected));
        });
        renderServices();
    });
});
loadServices();

document.addEventListener("click", function (event) {
    var action = event.target.closest("[data-prefill-service]");
    if (!action) return;
    prefillContact(action.dataset.prefillService, action.dataset.prefillMessage);
});

document.querySelectorAll("[data-service-filter]").forEach(function (link) {
    link.addEventListener("click", function () {
        var filter = link.dataset.serviceFilter;
        var tab = serviceTabs.find(function (button) { return button.dataset.f === filter; });
        if (tab) tab.click();
    });
});

var menuButton = document.querySelector(".burger");
var mainNav = document.getElementById("nav");
menuButton.addEventListener("click", function () {
    var expanded = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(expanded));
    menuButton.setAttribute("aria-label", expanded ? "Close menu" : "Open menu");
    mainNav.classList.toggle("open", expanded);
});
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mainNav.classList.contains("open")) {
        mainNav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open menu");
        menuButton.focus();
    }
});
document.querySelectorAll("#blog [data-blog-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
        var target = document.getElementById(button.dataset.blogToggle);
        var expanded = target.hidden;
        target.hidden = !expanded;
        document.querySelectorAll('[data-blog-toggle="' + button.dataset.blogToggle + '"]').forEach(function (control) {
            control.setAttribute("aria-expanded", String(expanded));
            if (control.classList.contains("blog-read-more")) {
                control.textContent = expanded ? "Read Less" : "Read More";
            }
        });
    });
});
var contactForm = document.getElementById("consultation-form");
contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    var status = document.getElementById("contact-status");
    var submitButton = contactForm.querySelector('button[type="submit"]');
    status.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    try {
        var response = await fetch(apiBaseUrl + "/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
        });
        var result = await response.json();
        if (!response.ok) throw new Error(result.error || "Your request could not be sent.");
        status.textContent = result.message;
        contactForm.reset();
    } catch (error) {
        console.error("Contact form submission failed:", error);
        status.textContent = error instanceof Error
            ? error.message
            : "Unable to send your request. Please try again.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send consultation request";
    }
});
var slides = Array.from(document.querySelectorAll(".slide"));
var slideButtons = Array.from(document.querySelectorAll(".dots button"));
var slideIndex = 0;
var slideTimer;
var reduceMotion = matchMedia("(prefers-reduced-motion:reduce)");
var hero = document.querySelector(".hero");

function showSlide(index) {
    slideIndex = (index + slides.length) % slides.length;
    slides.forEach(function (slide, position) {
        slide.classList.toggle("on", position === slideIndex);
    });
    slideButtons.forEach(function (button, position) {
        var selected = position === slideIndex;
        button.classList.toggle("on", selected);
        if (selected) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
    });
    document.getElementById("ct").textContent =
        String(slideIndex + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
}

function stopSlideShow() {
    clearInterval(slideTimer);
    slideTimer = null;
}

function startSlideShow() {
    stopSlideShow();
    if (!reduceMotion.matches && !document.hidden &&
        !hero.matches(":hover") && !hero.contains(document.activeElement)) {
        slideTimer = setInterval(function () { showSlide(slideIndex + 1); }, 6000);
    }
}

slideButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
        showSlide(index);
        startSlideShow();
    });
});
hero.addEventListener("pointerenter", stopSlideShow);
hero.addEventListener("pointerleave", startSlideShow);
hero.addEventListener("focusin", stopSlideShow);
hero.addEventListener("focusout", function (event) {
    if (!hero.contains(event.relatedTarget)) startSlideShow();
});
document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopSlideShow();
    else startSlideShow();
});
reduceMotion.addEventListener("change", startSlideShow);
showSlide(0);
startSlideShow();
var logoWindow = document.getElementById("company-logos"), logoButtons = document.querySelectorAll(".logos-controls button");
function updateLogoControls() {
    var maxScroll = logoWindow.scrollWidth - logoWindow.clientWidth;
    logoButtons.forEach(function (b) {
        var direction = Number(b.dataset.logoStep);
        b.disabled = direction < 0 ? logoWindow.scrollLeft <= 1 : logoWindow.scrollLeft >= maxScroll - 1;
    });
}
logoButtons.forEach(function (b) {
    b.onclick = function () {
        logoWindow.scrollBy({
            left: logoWindow.clientWidth * Number(b.dataset.logoStep) * .8,
            behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth"
        });
    };
});
logoWindow.addEventListener("scroll", updateLogoControls, { passive: true });
window.addEventListener("resize", updateLogoControls);
updateLogoControls();
var logoMotionPreference = matchMedia("(prefers-reduced-motion:reduce)"), logoTimer;
function stopLogoAutoSlide() {
    clearInterval(logoTimer);
    logoTimer = null;
}
function startLogoAutoSlide() {
    stopLogoAutoSlide();
    if (logoMotionPreference.matches || document.hidden) return;
    logoTimer = setInterval(function () {
        var maxScroll = logoWindow.scrollWidth - logoWindow.clientWidth;
        if (maxScroll <= 1) return;
        if (logoWindow.scrollLeft >= maxScroll - 2) {
            logoWindow.scrollTo({ left: 0, behavior: "smooth" });
        } else {
            logoWindow.scrollBy({ left: logoWindow.clientWidth * .8, behavior: "smooth" });
        }
    }, 3000);
}
document.querySelectorAll(".logos-heading, .logos-window").forEach(function (el) {
    el.addEventListener("pointerenter", stopLogoAutoSlide);
    el.addEventListener("pointerleave", startLogoAutoSlide);
    el.addEventListener("focusin", stopLogoAutoSlide);
    el.addEventListener("focusout", function (event) {
        if (!el.contains(event.relatedTarget)) startLogoAutoSlide();
    });
});
document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopLogoAutoSlide();
    else startLogoAutoSlide();
});
logoMotionPreference.addEventListener("change", function () {
    if (logoMotionPreference.matches) stopLogoAutoSlide();
    else startLogoAutoSlide();
});
startLogoAutoSlide();

/* ===== Section-to-section navigation ===== */
(function () {
    var sections = [
        ["hero", "Home"], ["about", "About"], ["services", "Services"], ["work", "Our Work"],
        ["why", "Why Us"], ["contact", "Contact"], ["blog", "Blog"],
        ["expertise", "Expertise"], ["testimonials", "Testimonials"]
    ].map(function (s) {
        return { id: s[0], label: s[1], el: document.getElementById(s[0]) };
    }).filter(function (s) { return s.el; });
    if (!sections.length) return;

    var root = document.documentElement;
    var header = document.querySelector("header");
    var reduceMotion = matchMedia("(prefers-reduced-motion:reduce)");
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("#nav > ul > li > a"));
    var current = -1, ticking = false;

    function behavior() { return reduceMotion.matches ? "auto" : "smooth"; }

    function goTo(index) {
        var s = sections[Math.max(0, Math.min(sections.length - 1, index))];
        if (s.id === "hero") window.scrollTo({ top: 0, behavior: behavior() });
        else s.el.scrollIntoView({ behavior: behavior(), block: "start" });
    }

    /* Scroll progress bar */
    var progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    /* Side dots */
    var dotNav = document.createElement("nav");
    dotNav.className = "section-dots";
    dotNav.setAttribute("aria-label", "Page sections");
    var dots = sections.map(function (s, k) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", s.label);
        b.dataset.label = s.label;
        b.addEventListener("click", function () { goTo(k); });
        dotNav.appendChild(b);
        return b;
    });
    document.body.appendChild(dotNav);

    /* Previous / next section buttons */
    var pager = document.createElement("div");
    pager.className = "section-pager";
    function pagerButton(text, label, step) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = text;
        b.setAttribute("aria-label", label);
        b.addEventListener("click", function () { goTo(Math.max(current, 0) + step); });
        pager.appendChild(b);
        return b;
    }
    var prevBtn = pagerButton("↑", "Previous section", -1);
    var nextBtn = pagerButton("↓", "Next section", 1);
    document.body.appendChild(pager);

    /* Keep the active section in sync with scrolling */
    function update() {
        ticking = false;
        var maxScroll = root.scrollHeight - window.innerHeight;
        var y = window.scrollY;
        progress.style.transform = "scaleX(" + (maxScroll > 0 ? Math.min(1, y / maxScroll) : 0) + ")";

        var probe = (header ? header.offsetHeight : 68) + window.innerHeight * 0.3;
        var index = 0;
        sections.forEach(function (s, k) {
            if (s.el.getBoundingClientRect().top <= probe) index = k;
        });
        if (maxScroll > 0 && y >= maxScroll - 4) index = sections.length - 1;
        if (index === current) return;
        current = index;

        dots.forEach(function (d, k) {
            d.classList.toggle("on", k === index);
            if (k === index) d.setAttribute("aria-current", "true");
            else d.removeAttribute("aria-current");
        });
        navLinks.forEach(function (a) {
            var hash = (a.getAttribute("href") || "").replace("#", "") || "hero";
            a.classList.toggle("active", hash === sections[index].id);
        });
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === sections.length - 1;
    }
    function requestUpdate() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();

    /* Close the mobile menu after choosing a link */
    if (mainNav) {
        mainNav.addEventListener("click", function (event) {
            if (!event.target.closest("a")) return;
            mainNav.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open menu");
        });
    }

    /* Reveal content as each section scrolls into view */
    if ("IntersectionObserver" in window && !reduceMotion.matches) {
        root.classList.add("js-reveal");
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("in");
                observer.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -8% 0px" });
        sections.forEach(function (s) {
            if (s.id === "hero") return;
            var container = s.el.querySelector(":scope > .w") || s.el;
            Array.prototype.forEach.call(container.children, function (child, k) {
                child.classList.add("reveal");
                child.style.transitionDelay = Math.min(k, 4) * 70 + "ms";
                observer.observe(child);
            });
        });
    }
})();
