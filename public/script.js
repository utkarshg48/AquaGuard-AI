/* =========================================================
   AQUAGUARD AI
   Final dashboard script
   ========================================================= */

const appState = {
    currentPage: "dashboard",
    currentDma: "DMA-01",
    chartRange: "1H",

    alertSoundEnabled:
        localStorage.getItem("aquaguardAlertSound") === "enabled",

    audioContext: null,

    valveStates: {
        relay1: false,
        valve1: false,
        relay2: false,
        valve2: false
    },

    dmaData: {
        "DMA-01": {
            zone: "Residential Zone",
            input: 28.4,
            output: 26.9,
            difference: 1.5,
            tank: 72,
            status: "NORMAL",
            risk: "LOW",
            analysis: "Flow is currently within the expected demonstration range.",
            action: "Continue monitoring."
        },

        "DMA-02": {
            zone: "Commercial Zone",
            input: 31.2,
            output: 27.8,
            difference: 3.4,
            tank: 61,
            status: "WARNING",
            risk: "MEDIUM",
            analysis: "Flow difference is above the current demonstration baseline.",
            action: "Inspect the trend and monitored pipeline."
        },

        "DMA-03": {
            zone: "Industrial Zone",
            input: 29.7,
            output: 19.1,
            difference: 10.6,
            tank: 48,
            status: "ALERT",
            risk: "HIGH",
            analysis: "Significant persistent flow imbalance detected.",
            action: "Inspect the monitored pipeline and verify the physical flow path."
        }
    }
};

const pageInfo = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Real-time overview of the monitored water network",
        section: "OVERVIEW"
    },

    monitoring: {
        title: "DMA Monitoring",
        subtitle: "Review monitored districts and flow balance",
        section: "NETWORK MONITORING"
    },

    prototype: {
        title: "Physical Prototype",
        subtitle: "Live hardware view for the AquaGuard prototype",
        section: "HARDWARE CONTROL"
    },

    alerts: {
        title: "Alerts & Events",
        subtitle: "Review active water-loss signals and system events",
        section: "EVENT CENTER"
    },

    ai: {
        title: "AI Prediction",
        subtitle: "Experimental anomaly detection and historical-pattern analysis",
        section: "INTELLIGENT ANALYSIS"
    },

    accounting: {
        title: "Water Accounting",
        subtitle: "Supplied water, accounted water and unaccounted flow",
        section: "WATER BALANCE"
    },

    "dma-details": {
        title: "DMA Details",
        subtitle: "Detailed information for the selected monitoring area",
        section: "ZONE DETAILS"
    },

    settings: {
        title: "Settings",
        subtitle: "Detection thresholds, alerts and prototype configuration",
        section: "SYSTEM CONFIGURATION"
    }
};

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeAquaGuard() {
    if (window.__aquaGuardInitialized) return;

    window.__aquaGuardInitialized = true;

    initNavigation();
    initMobileSidebar();
    initProfileMenu();
    initCharts();
    initDmaInteractions();
    initAlertInteractions();
    initPrototypeControls();
    initSettings();
    initRefreshButton();
    initHeaderActions();

    updateHeaderTime();
    setInterval(updateHeaderTime, 10000);

    updateNextRefresh();
    setInterval(updateNextRefresh, 1000);

    syncSoundUI();
    updateHardwareSummary();

    window.AquaGuard = {
        signOut
    };
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAquaGuard,
        { once: true }
    );
} else {
    initializeAquaGuard();
}

/* =========================================================
   AUTH / LOGOUT
   ========================================================= */

function getSession() {
    try {
        const raw = sessionStorage.getItem("aquaguardSession");

        if (!raw) return null;

        const session = JSON.parse(raw);

        return session?.authenticated ? session : null;
    } catch {
        sessionStorage.removeItem("aquaguardSession");
        return null;
    }
}

function signOut() {
    sessionStorage.removeItem("aquaguardSession");
    sessionStorage.removeItem("aquaguardPersistentSession");
    sessionStorage.removeItem("aquaguardAuth");

    localStorage.removeItem("aquaguardSession");
    localStorage.removeItem("aquaguardPersistentSession");
    localStorage.removeItem("aquaguardAuth");

    const logoutUrl = "login.html?logout=1";

    if (window.top !== window.self) {
        window.top.location.replace(logoutUrl);
    } else {
        window.location.replace(logoutUrl);
    }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function initNavigation() {
    if (window.__aquaGuardNavigationInitialized) return;

    window.__aquaGuardNavigationInitialized = true;

    document.addEventListener("click", (event) => {
        const navButton = event.target.closest(".nav-item[data-page]");

        if (navButton) {
            event.preventDefault();

            const pageId = navButton.dataset.page;

            if (pageId) {
                showPage(pageId);
            }

            return;
        }

        const pageLink = event.target.closest("[data-page-link]");

        if (pageLink) {
            event.preventDefault();

            const pageId = pageLink.dataset.pageLink;

            if (pageId) {
                showPage(pageId);
            }
        }
    });

    /* Chart range buttons */
    document.addEventListener("click", (event) => {
        const rangeButton = event.target.closest("[data-range]");

        if (!rangeButton) return;

        const control = rangeButton.closest(".segmented-control");

        if (!control) return;

        control.querySelectorAll("[data-range]").forEach((button) => {
            button.classList.remove("active");
        });

        rangeButton.classList.add("active");

        appState.chartRange =
            rangeButton.dataset.range || "1H";

        renderFlowChart(appState.chartRange);
    });
}

function showPage(pageId) {
    const target = document.getElementById(pageId);

    if (!target) return;

    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active-page");
    });

    target.classList.add("active-page");

    document.querySelectorAll(".nav-item").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    const info = pageInfo[pageId];

    if (info) {
        setText("page-title", info.title);
        setText("page-subtitle", info.subtitle);
        setText("header-section", info.section);
    }

    appState.currentPage = pageId;

    closeMobileSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageId === "prototype") {
        updateHardwareSummary();
    }

    if (pageId === "monitoring") {
        renderTankChart();
    }

    if (pageId === "accounting") {
        renderWaterUsageChart();
        renderWaterLossChart();
    }

    if (pageId === "dma-details") {
        renderDmaDetail(appState.currentDma);
    }
}

/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function initMobileSidebar() {
    const menu = document.getElementById("mobile-menu");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (!menu || !sidebar) return;

    menu.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-open");
        overlay?.classList.toggle(
            "visible",
            sidebar.classList.contains("mobile-open")
        );
    });

    overlay?.addEventListener(
        "click",
        closeMobileSidebar
    );
}

function closeMobileSidebar() {
    document
        .getElementById("sidebar")
        ?.classList.remove("mobile-open");

    document
        .getElementById("sidebar-overlay")
        ?.classList.remove("visible");
}

/* =========================================================
   PROFILE
   ========================================================= */

function initProfileMenu() {
    const button = document.getElementById("profile-button");
    const dropdown = document.getElementById("profile-dropdown");
    const signOutButton = document.getElementById("signout-button");
    const settingsButton =
        document.getElementById("account-settings-button");

    const session = getSession();

    if (session) {
        const name =
            session.displayName ||
            session.username ||
            "Utkarsh Gupta";

        const role =
            session.role ||
            "System Administrator";

        setText("profile-name", name);
        setText("profile-role", role);

        const initials = getInitials(name);

        document
            .querySelectorAll(
                ".profile-avatar, .profile-name-mini, .profile-dropdown-avatar"
            )
            .forEach((element) => {
                element.textContent = initials;
            });
    }

    if (button && dropdown) {
        button.addEventListener("click", (event) => {
            event.stopPropagation();

            const isOpen = !dropdown.hidden;

            dropdown.hidden = isOpen;

            button.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );
        });

        document.addEventListener("click", (event) => {
            if (
                !dropdown.contains(event.target) &&
                !button.contains(event.target)
            ) {
                dropdown.hidden = true;
                button.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    }

    signOutButton?.addEventListener("click", (event) => {
        event.preventDefault();
        signOut();
    });

    settingsButton?.addEventListener("click", () => {
        if (dropdown) dropdown.hidden = true;
        showPage("settings");
    });
}

function getInitials(name) {
    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) return "UG";

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

/* =========================================================
   HEADER
   ========================================================= */

function initHeaderActions() {
    const soundButton =
        document.getElementById("sound-toggle");

    const notificationButton =
        document.getElementById("notification-button");

    soundButton?.addEventListener("click", () => {
        appState.alertSoundEnabled =
            !appState.alertSoundEnabled;

        localStorage.setItem(
            "aquaguardAlertSound",
            appState.alertSoundEnabled
                ? "enabled"
                : "disabled"
        );

        syncSoundUI();

        if (appState.alertSoundEnabled) {
            playTone();
        }
    });

    notificationButton?.addEventListener(
        "click",
        () => {
            showToastMessage(
                "DMA-03 has an active flow imbalance alert.",
                "warning"
            );
        }
    );
}

function syncSoundUI() {
    const button =
        document.getElementById("sound-toggle");

    if (!button) return;

    button.textContent =
        appState.alertSoundEnabled
            ? "🔊"
            : "🔇";
}

function updateHeaderTime() {
    const text =
        new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    setText("last-updated", `Updated ${text}`);
    setText("chart-updated", "just now");
}

function updateNextRefresh() {
    const element =
        document.getElementById("next-refresh");

    if (!element) return;

    const seconds =
        5 - (Math.floor(Date.now() / 1000) % 5);

    element.textContent =
        `${String(seconds).padStart(2, "0")}s`;
}

/* =========================================================
   CHART DATA
   ========================================================= */

const chartData = {
    "1H": {
        labels: [
            "11:00",
            "11:05",
            "11:10",
            "11:15",
            "11:20",
            "11:25",
            "11:30",
            "11:35"
        ],
        input: [
            1.04,
            1.12,
            1.18,
            1.25,
            1.33,
            1.29,
            1.37,
            1.33
        ],
        output: [
            0.92,
            0.98,
            1.01,
            1.05,
            1.09,
            1.02,
            1.04,
            1.00
        ]
    },

    "6H": {
        labels: [
            "06:00",
            "07:00",
            "08:00",
            "09:00",
            "10:00",
            "11:00"
        ],
        input: [
            1.02,
            1.17,
            1.09,
            1.28,
            1.24,
            1.33
        ],
        output: [
            0.92,
            0.99,
            0.97,
            1.08,
            1.01,
            1.00
        ]
    },

    "24H": {
        labels: [
            "00",
            "03",
            "06",
            "09",
            "12",
            "15",
            "18",
            "21"
        ],
        input: [
            0.84,
            0.91,
            1.04,
            1.16,
            1.33,
            1.27,
            1.10,
            0.96
        ],
        output: [
            0.78,
            0.83,
            0.91,
            0.97,
            1.00,
            1.05,
            0.97,
            0.89
        ]
    },

    "7D": {
        labels: [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun"
        ],
        input: [
            1.02,
            1.08,
            1.20,
            1.17,
            1.31,
            1.28,
            1.33
        ],
        output: [
            0.93,
            0.96,
            1.01,
            1.00,
            1.06,
            1.04,
            1.00
        ]
    }
};

/* =========================================================
   CHARTS
   ========================================================= */

function initCharts() {
    renderFlowChart("1H");
    renderTankChart();
    renderWaterUsageChart();
    renderWaterLossChart();
}

function renderFlowChart(range) {
    const container =
        document.getElementById("flow-chart");

    if (!container) return;

    const data =
        chartData[range] ||
        chartData["1H"];

    container.innerHTML =
        createSvgChart(
            data.labels,
            [
                {
                    values: data.input,
                    color: "#2387c8"
                },
                {
                    values: data.output,
                    color: "#2a9c92"
                }
            ]
        );
}

function renderTankChart() {
    const container =
        document.getElementById("tank-level-chart");

    if (!container) return;

    container.innerHTML =
        createSvgChart(
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            [
                {
                    values: [72, 68, 66, 63, 59, 54, 48],
                    color: "#2387c8"
                }
            ]
        );
}

function renderWaterUsageChart() {
    const container =
        document.getElementById("water-usage-chart");

    if (!container) return;

    container.innerHTML =
        createSvgChart(
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            [
                {
                    values: [22, 24, 25, 23, 27, 26, 29],
                    color: "#2387c8"
                },
                {
                    values: [20, 22, 23, 22, 25, 24, 27],
                    color: "#2a9c92"
                }
            ]
        );
}

function renderWaterLossChart() {
    const container =
        document.getElementById("water-loss-chart");

    if (!container) return;

    container.innerHTML =
        createSvgChart(
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            [
                {
                    values: [4.1, 4.8, 5.2, 5.0, 5.8, 6.3, 7.0],
                    color: "#d28718"
                }
            ]
        );
}

function renderDmaDetail(dmaName) {
    const data =
        appState.dmaData[dmaName];

    if (!data) return;

    setText(
        "dma-detail-title",
        `${dmaName} Details`
    );

    setText(
        "dma-detail-subtitle",
        `${data.zone} • Detailed operational view`
    );

    const status =
        document.getElementById("dma-detail-status");

    if (status) {
        status.textContent = data.status;

        status.className =
            `status-badge ${statusClass(data.status)}`;
    }

    renderDmaDetailChart(dmaName);
}

function renderDmaDetailChart(dmaName) {
    const container =
        document.getElementById("dma-detail-chart");

    const data =
        appState.dmaData[dmaName];

    if (!container || !data) return;

    container.innerHTML =
        createSvgChart(
            [
                "T1",
                "T2",
                "T3",
                "T4",
                "T5",
                "T6"
            ],
            [
                {
                    values: [
                        data.input - 1.2,
                        data.input - 0.8,
                        data.input - 0.5,
                        data.input,
                        data.input + 0.2,
                        data.input
                    ],
                    color: "#2387c8"
                },
                {
                    values: [
                        data.output - 0.6,
                        data.output - 0.3,
                        data.output,
                        data.output + 0.1,
                        data.output - 0.2,
                        data.output
                    ],
                    color: "#2a9c92"
                }
            ]
        );
}

function createSvgChart(labels, series) {
    const width = 900;
    const height = 280;

    let allValues = [];

    series.forEach((item) => {
        allValues =
            allValues.concat(item.values);
    });

    let min =
        Math.min(...allValues);

    let max =
        Math.max(...allValues);

    if (min === max) {
        min -= 1;
        max += 1;
    }

    const padding = (max - min) * 0.15;

    min -= padding;
    max += padding;

    const left = 55;
    const right = 20;
    const top = 20;
    const bottom = 40;

    const chartWidth =
        width - left - right;

    const chartHeight =
        height - top - bottom;

    const x = (index) => {
        if (labels.length <= 1) return left;

        return (
            left +
            (index / (labels.length - 1)) *
                chartWidth
        );
    };

    const y = (value) => {
        return (
            top +
            ((max - value) /
                (max - min)) *
                chartHeight
        );
    };

    let svg = `
        <svg
            viewBox="0 0 ${width} ${height}"
            class="chart-svg"
            preserveAspectRatio="none"
        >
    `;

    for (let i = 0; i <= 5; i++) {
        const yy =
            top +
            (i / 5) * chartHeight;

        svg += `
            <line
                x1="${left}"
                y1="${yy}"
                x2="${width - right}"
                y2="${yy}"
                stroke="#dce6ec"
                stroke-width="1"
            />
        `;
    }

    series.forEach((item) => {
        let path = "";

        item.values.forEach(
            (value, index) => {
                path +=
                    `${index === 0 ? "M" : "L"} ` +
                    `${x(index)} ${y(value)} `;
            }
        );

        svg += `
            <path
                d="${path}"
                fill="none"
                stroke="${item.color}"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        `;

        item.values.forEach(
            (value, index) => {
                svg += `
                    <circle
                        cx="${x(index)}"
                        cy="${y(value)}"
                        r="4"
                        fill="#ffffff"
                        stroke="${item.color}"
                        stroke-width="2"
                    />
                `;
            }
        );
    });

    labels.forEach(
        (label, index) => {
            svg += `
                <text
                    x="${x(index)}"
                    y="${height - 12}"
                    text-anchor="middle"
                    font-size="10"
                    fill="#718391"
                >
                    ${escapeHtml(label)}
                </text>
            `;
        }
    );

    svg += "</svg>";

    return svg;
}

/* =========================================================
   DMA INTERACTIONS
   ========================================================= */

function initDmaInteractions() {
    document.addEventListener("click", (event) => {
        const dmaButton =
            event.target.closest(
                "[data-dma]"
            );

        if (!dmaButton) return;

        const dma =
            dmaButton.dataset.dma;

        if (!appState.dmaData[dma]) return;

        appState.currentDma = dma;

        renderDmaDetail(dma);

        showPage("dma-details");
    });
}

/* =========================================================
   ALERTS
   ========================================================= */

function initAlertInteractions() {
    document.addEventListener(
        "click",
        (event) => {
            const acknowledge =
                event.target.closest(
                    ".acknowledge-alert"
                );

            if (acknowledge) {
                const alertCard =
                    acknowledge.closest(
                        ".event-alert"
                    );

                alertCard?.remove();

                showToastMessage(
                    "Alert acknowledged.",
                    "normal"
                );

                updateAlertCounters();

                return;
            }

            const viewAlert =
                event.target.closest(
                    ".view-alert"
                );

            if (viewAlert) {
                const dma =
                    viewAlert.dataset.dma;

                if (dma) {
                    appState.currentDma = dma;
                    renderDmaDetail(dma);
                    showPage("dma-details");
                }
            }
        }
    );

    const testButton =
        document.getElementById("test-alert");

    testButton?.addEventListener(
        "click",
        () => {
            playAlertSound();

            showToastMessage(
                "Test alert triggered successfully.",
                "warning"
            );
        }
    );
}

function updateAlertCounters() {
    const alerts =
        document.querySelectorAll(
            ".event-alert"
        ).length;

    setText(
        "kpi-alerts",
        String(alerts).padStart(2, "0")
    );

    setText(
        "notification-count",
        String(alerts)
    );
}

/* =========================================================
   TOAST
   ========================================================= */

function createToastContainer() {
    if (document.getElementById("toast-container")) {
        return;
    }

    const container =
        document.createElement("div");

    container.id =
        "toast-container";

    container.className =
        "toast-container";

    document.body.appendChild(container);
}

function showToastMessage(
    message,
    type = "normal"
) {
    createToastContainer();

    const container =
        document.getElementById(
            "toast-container"
        );

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.innerHTML = `
        <div class="toast-content">
            ${escapeHtml(message)}
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

/* =========================================================
   AUDIO
   ========================================================= */

function playAlertSound() {
    if (!appState.alertSoundEnabled) {
        return;
    }

    playTone(700, 0.16);
    setTimeout(() => {
        playTone(500, 0.18);
    }, 180);
}

function playTone(
    frequency = 800,
    duration = 0.2
) {
    try {
        if (!appState.audioContext) {
            appState.audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }

        const context =
            appState.audioContext;

        const oscillator =
            context.createOscillator();

        const gain =
            context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value =
            frequency;

        gain.gain.setValueAtTime(
            0.04,
            context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();

        oscillator.stop(
            context.currentTime +
                duration
        );
    } catch {
        /* Audio is optional. */
    }
}

/* =========================================================
   PHYSICAL PROTOTYPE
   ========================================================= */

function initPrototypeControls() {
    document.addEventListener(
        "click",
        (event) => {
            const switchButton =
                event.target.closest(
                    ".switch[data-control]"
                );

            if (!switchButton) return;

            const control =
                switchButton.dataset.control;

            if (!(control in appState.valveStates)) {
                return;
            }

            appState.valveStates[control] =
                !appState.valveStates[control];

            updatePrototypeControl(
                control,
                switchButton
            );
        }
    );

    updatePrototypeControls();
}

function updatePrototypeControls() {
    document
        .querySelectorAll(
            ".switch[data-control]"
        )
        .forEach((button) => {
            const control =
                button.dataset.control;

            updatePrototypeControl(
                control,
                button
            );
        });
}

function updatePrototypeControl(
    control,
    button
) {
    const state =
        appState.valveStates[control];

    button.classList.toggle(
        "active",
        state
    );

    const label =
        document.getElementById(
            `${control}-state`
        );

    if (!label) return;

    label.textContent =
        control.startsWith("valve")
            ? state
                ? "OPEN"
                : "CLOSED"
            : state
                ? "ON"
                : "OFF";
}

/* =========================================================
   HARDWARE SUMMARY
   ========================================================= */

function updateHardwareSummary() {
    const flow1 =
        document.querySelector(
            ".hardware-live-values"
        );

    if (!flow1) return;

    /* Keep the actual prototype observations visible. */
    setText(
        "relay1-state",
        getControlText("relay1")
    );

    setText(
        "valve1-state",
        getControlText("valve1")
    );

    setText(
        "relay2-state",
        getControlText("relay2")
    );

    setText(
        "valve2-state",
        getControlText("valve2")
    );
}

function getControlText(control) {
    const active =
        appState.valveStates[control];

    if (control.startsWith("valve")) {
        return active
            ? "OPEN"
            : "CLOSED";
    }

    return active
        ? "ON"
        : "OFF";
}

/* =========================================================
   SETTINGS
   ========================================================= */

function initSettings() {
    const soundSetting =
        document.getElementById(
            "settings-sound"
        );

    if (soundSetting) {
        soundSetting.checked =
            appState.alertSoundEnabled;

        soundSetting.addEventListener(
            "change",
            () => {
                appState.alertSoundEnabled =
                    soundSetting.checked;

                localStorage.setItem(
                    "aquaguardAlertSound",
                    appState.alertSoundEnabled
                        ? "enabled"
                        : "disabled"
                );

                syncSoundUI();
            }
        );
    }
}

/* =========================================================
   REFRESH
   ========================================================= */

function initRefreshButton() {
    const dashboardRefresh =
        document.getElementById(
            "refresh-dashboard"
        );

    const monitoringRefresh =
        document.getElementById(
            "monitoring-refresh"
        );

    const refresh = () => {
        renderFlowChart(
            appState.chartRange
        );

        renderTankChart();
        renderWaterUsageChart();
        renderWaterLossChart();

        updateHeaderTime();

        showToastMessage(
            "Dashboard data refreshed.",
            "normal"
        );
    };

    dashboardRefresh?.addEventListener(
        "click",
        refresh
    );

    monitoringRefresh?.addEventListener(
        "click",
        refresh
    );
}

/* =========================================================
   UTILITIES
   ========================================================= */

function statusClass(status) {
    switch (
        String(status).toUpperCase()
    ) {
        case "NORMAL":
        case "INFO":
        case "HEALTHY":
            return "normal";

        case "WARNING":
            return "warning";

        case "ALERT":
        case "CRITICAL":
            return "danger";

        default:
            return "";
    }
}

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            String(value);
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}