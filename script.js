/* =========================================================
   AQUAGUARD AI — DASHBOARD APPLICATION
   Vanilla JavaScript frontend
   ========================================================= */

const appState = {
    currentPage: "dashboard",
    currentDma: "DMA-01",
    chartRange: "1H",
    alertSoundEnabled:
        localStorage.getItem("aquaguardAlertSound") === "enabled",
    audioContext: null,
    valveStates: {
        valve1: false,
        valve2: false,
        relay1: false,
        relay2: false
    },
    dmaData: {
        "DMA-01": {
            name: "DMA-01",
            zone: "Residential Zone",
            input: 28.4,
            output: 26.9,
            difference: 1.5,
            tank: 72,
            valve1: "OPEN",
            valve2: "OPEN",
            status: "NORMAL",
            risk: "LOW",
            analysis: "Flow is within the expected range for this zone.",
            action: "Continue monitoring."
        },
        "DMA-02": {
            name: "DMA-02",
            zone: "Commercial Zone",
            input: 31.2,
            output: 27.8,
            difference: 3.4,
            tank: 61,
            valve1: "OPEN",
            valve2: "OPEN",
            status: "WARNING",
            risk: "MEDIUM",
            analysis: "A moderate flow imbalance is above the historical baseline.",
            action: "Inspect the flow trend and monitored pipeline."
        },
        "DMA-03": {
            name: "DMA-03",
            zone: "Industrial Zone",
            input: 29.7,
            output: 19.1,
            difference: 10.6,
            tank: 48,
            valve1: "OPEN",
            valve2: "OPEN",
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
        subtitle: "Monitor flow balance, tank levels and network conditions",
        section: "NETWORK MONITORING"
    },
    prototype: {
        title: "Physical Prototype",
        subtitle: "Live hardware view for the AquaGuard prototype",
        section: "HARDWARE CONTROL"
    },
    alerts: {
        title: "Alerts & Events",
        subtitle: "Active abnormal conditions, warnings and resolved events",
        section: "EVENT CENTER"
    },
    ai: {
        title: "AI Prediction",
        subtitle: "Experimental anomaly detection and historical-pattern analysis",
        section: "INTELLIGENT ANALYSIS"
    },
    accounting: {
        title: "Water Accounting",
        subtitle: "Supplied water, accounted water and unaccounted flow trend",
        section: "WATER BALANCE"
    },
    "dma-details": {
        title: "DMA Details",
        subtitle: "Detailed information for the selected monitoring area",
        section: "ZONE DETAILS"
    },
    settings: {
        title: "Settings",
        subtitle: "Detection thresholds, alert preferences and prototype configuration",
        section: "SYSTEM CONFIGURATION"
    }
};

const flowChartData = {
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
        input: [1.04, 1.12, 1.18, 1.25, 1.33, 1.29, 1.37, 1.33],
        output: [0.92, 0.98, 1.01, 1.05, 1.09, 1.02, 1.04, 1.0]
    },
    "6H": {
        labels: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"],
        input: [1.02, 1.17, 1.09, 1.28, 1.24, 1.33],
        output: [0.92, 0.99, 0.97, 1.08, 1.01, 1.0]
    },
    "24H": {
        labels: ["00", "03", "06", "09", "12", "15", "18", "21"],
        input: [0.84, 0.91, 1.04, 1.16, 1.33, 1.27, 1.1, 0.96],
        output: [0.78, 0.83, 0.91, 0.97, 1.0, 1.05, 0.97, 0.89]
    },
    "7D": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        input: [1.02, 1.08, 1.2, 1.17, 1.31, 1.28, 1.33],
        output: [0.93, 0.96, 1.01, 1.0, 1.06, 1.04, 1.0]
    }
};

/* =========================================================
   INITIALIZATION + AUTH GUARD
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!requireLogin()) return;
    initAquaGuard();
});

window.addEventListener("pageshow", () => {
    if (
        !hasValidSession() &&
        !window.location.pathname.endsWith("login.html")
    ) {
        window.location.replace("login.html");
    }
});

function hasValidSession() {
    const current = readJson("aquaguardSession", sessionStorage);
    return current?.authenticated === true;
}

function requireLogin() {
    const session = getAuthSession();

    if (!session?.authenticated) {
        window.location.replace("login.html");
        return false;
    }

    populateProfile(session);
    return true;
}

function getAuthSession() {
    // Authentication is session-only. Never restore a login from localStorage.
    const current = readJson("aquaguardSession", sessionStorage);

    return current?.authenticated === true ? current : null;
}

function readJson(key, storage) {
    const raw = storage.getItem(key);

    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        storage.removeItem(key);
        return null;
    }
}

function initAquaGuard() {
    initNavigation();
    initMobileSidebar();
    initProfileMenu();
    initCharts();
    initDmaInteractions();
    initAlertInteractions();
    initPrototypeControls();
    initSettings();
    initRefreshButton();

    updateLastUpdateTime();

    setInterval(updateLastUpdateTime, 10000);

    syncSoundUI();
    createToastContainer();
}

/* =========================================================
   PROFILE / SIGN OUT
   ========================================================= */

function populateProfile(session) {
    const displayName =
        session.displayName ||
        session.username ||
        "User";

    const role =
        session.role ||
        "System User";

    const initials = getInitials(displayName);

    setText("profile-name", displayName);
    setText("profile-role", role);

    document.querySelectorAll(
        ".profile, .profile-avatar, .profile-name-mini, .profile-dropdown-avatar, .profile-large"
    ).forEach((element) => {
        element.textContent = initials;
    });
}

function getInitials(name) {
    const clean = String(name).trim();

    if (!clean) return "U";

    const parts = clean
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

function initProfileMenu() {
    const profileButton =
        document.getElementById("profile-button");

    const dropdown =
        document.getElementById("profile-dropdown");

    const signoutButton =
        document.getElementById("signout-button");

    const accountSettings =
        document.getElementById("account-settings-button") ||
        document.getElementById("profile-settings");

    if (profileButton && dropdown) {
        profileButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const open = dropdown.hidden === true;

            dropdown.hidden = !open;

            profileButton.setAttribute(
                "aria-expanded",
                String(open)
            );
        });

        document.addEventListener("click", (event) => {
            if (
                !dropdown.contains(event.target) &&
                !profileButton.contains(event.target)
            ) {
                dropdown.hidden = true;

                profileButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    }

    signoutButton?.addEventListener(
        "click",
        (event) => {
            event.preventDefault();
            event.stopPropagation();

            signOut();
        }
    );

    /*
       Backup delegated handler.
       This makes Sign Out work even if the menu is
       re-rendered or the direct listener is unavailable.
    */
    document.addEventListener("click", (event) => {
        const target =
            event.target.closest?.("#signout-button");

        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        signOut();
    });

    accountSettings?.addEventListener(
        "click",
        () => {
            if (dropdown) {
                dropdown.hidden = true;
            }

            if (profileButton) {
                profileButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }

            showPage("settings");
        }
    );
}

function signOut() {
    /*
       Remove the current session.
    */
    sessionStorage.removeItem("aquaguardSession");

    /*
       Remove old session keys too.
       These are included to eliminate any stale
       authentication left by previous versions.
    */
    sessionStorage.removeItem(
        "aquaguardPersistentSession"
    );

    sessionStorage.removeItem(
        "aquaguardAuth"
    );

    localStorage.removeItem(
        "aquaguardSession"
    );

    localStorage.removeItem(
        "aquaguardPersistentSession"
    );

    localStorage.removeItem(
        "aquaguardAuth"
    );

    /*
       Username memory is not authentication.
       We intentionally do not delete
       aquaguardRememberedUser.
    */
    localStorage.setItem(
        "aquaguardLoggedOut",
        new Date().toISOString()
    );

    /*
       Replace browser history so the dashboard
       is not reopened using Back.
    */
    window.location.replace(
        "login.html?logout=1"
    );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function initNavigation() {
    document
        .querySelectorAll(".nav-item")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    if (button.dataset.page) {
                        showPage(
                            button.dataset.page
                        );
                    }
                }
            );
        });

    document
        .querySelectorAll("[data-page-link]")
        .forEach((element) => {
            element.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();

                    const page =
                        element.dataset.pageLink;

                    if (page) {
                        showPage(page);
                    }
                }
            );
        });
}

function showPage(pageId) {
    const target =
        document.getElementById(pageId);

    if (!target) return;

    document
        .querySelectorAll(".page")
        .forEach((page) => {
            page.classList.remove(
                "active-page"
            );
        });

    target.classList.add(
        "active-page"
    );

    document
        .querySelectorAll(".nav-item")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.page === pageId
            );
        });

    const info =
        pageInfo[pageId];

    if (info) {
        setText(
            "page-title",
            info.title
        );

        setText(
            "page-subtitle",
            info.subtitle
        );

        setText(
            "header-section",
            info.section
        );
    }

    appState.currentPage = pageId;

    closeMobileSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function initMobileSidebar() {
    const menuButton =
        document.getElementById("mobile-menu");

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebar-overlay");

    if (!menuButton || !sidebar) return;

    menuButton.addEventListener(
        "click",
        () => {
            const open =
                sidebar.classList.toggle(
                    "mobile-open"
                );

            overlay?.classList.toggle(
                "visible",
                open
            );
        }
    );

    overlay?.addEventListener(
        "click",
        closeMobileSidebar
    );
}

function closeMobileSidebar() {
    document
        .getElementById("sidebar")
        ?.classList.remove(
            "mobile-open"
        );

    document
        .getElementById(
            "sidebar-overlay"
        )
        ?.classList.remove(
            "visible"
        );
}

/* =========================================================
   HEADER TIME
   ========================================================= */

function updateLastUpdateTime() {
    const time =
        new Date().toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    /*
       Support both possible IDs.
    */
    setText("last-update", time);
    setText("last-updated", `Updated ${time}`);
}

/* =========================================================
   CHART INITIALIZATION
   ========================================================= */

function initCharts() {
    renderFlowChart(
        appState.chartRange
    );

    renderTankChart();
    renderWaterUsageChart();
    renderWaterLossChart();
    renderDmaDetailChart(
        appState.currentDma
    );

    /*
       Support both:
       .chart-range
       and current HTML .seg-btn
    */
    document
        .querySelectorAll(
            ".chart-range, .seg-btn"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const range =
                        button.dataset.range;

                    if (!range) return;

                    document
                        .querySelectorAll(
                            ".chart-range, .seg-btn"
                        )
                        .forEach((item) => {
                            item.classList.toggle(
                                "active",
                                item === button
                            );
                        });

                    appState.chartRange =
                        range;

                    renderFlowChart(
                        range
                    );
                }
            );
        });
}

function renderLineChart(
    containerId,
    config
) {
    const container =
        document.getElementById(
            containerId
        );

    if (!container) return;

    const {
        series = [],
        labels = [],
        min = 0,
        max = 10,
        height = 280,
        formatter = (value) =>
            String(value)
    } = config;

    if (!series.length) return;

    const width = 900;

    const chartTop = 24;

    const chartBottom =
        height - 34;

    const chartLeft = 54;

    const chartRight =
        width - 18;

    const plotWidth =
        chartRight - chartLeft;

    const plotHeight =
        chartBottom - chartTop;

    const safeRange =
        max - min || 1;

    const xPosition = (index) => {
        if (labels.length <= 1) {
            return chartLeft;
        }

        return (
            chartLeft +
            (
                index /
                (labels.length - 1)
            ) *
            plotWidth
        );
    };

    const yPosition = (value) => {
        const clamped =
            Math.max(
                min,
                Math.min(max, value)
            );

        return (
            chartBottom -
            (
                (clamped - min) /
                safeRange
            ) *
            plotHeight
        );
    };

    const makePath = (values) =>
        values
            .map(
                (value, index) => {
                    const x =
                        xPosition(index);

                    const y =
                        yPosition(value);

                    return `${
                        index === 0
                            ? "M"
                            : "L"
                    } ${x.toFixed(
                        2
                    )} ${y.toFixed(
                        2
                    )}`;
                }
            )
            .join(" ");

    const rootStyle =
        getComputedStyle(
            document.documentElement
        );

    const colors = {
        blue:
            rootStyle
                .getPropertyValue(
                    "--blue"
                )
                .trim() ||
            "#2187c9",

        green:
            rootStyle
                .getPropertyValue(
                    "--green"
                )
                .trim() ||
            "#2e8b64",

        orange:
            rootStyle
                .getPropertyValue(
                    "--orange"
                )
                .trim() ||
            "#c9851f",

        line:
            rootStyle
                .getPropertyValue(
                    "--line"
                )
                .trim() ||
            "#dce6ec",

        muted:
            rootStyle
                .getPropertyValue(
                    "--muted"
                )
                .trim() ||
            "#6d8090"
    };

    let svg = `
        <svg
            class="chart-svg"
            viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient
                    id="flowBlueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop
                        offset="0%"
                        stop-color="${colors.blue}"
                        stop-opacity="0.16"
                    ></stop>

                    <stop
                        offset="100%"
                        stop-color="${colors.blue}"
                        stop-opacity="0"
                    ></stop>
                </linearGradient>
            </defs>
    `;

    const gridCount = 5;

    for (
        let i = 0;
        i <= gridCount;
        i++
    ) {
        const ratio =
            i / gridCount;

        const y =
            chartTop +
            ratio * plotHeight;

        const value =
            max -
            ratio * safeRange;

        svg += `
            <line
                x1="${chartLeft}"
                y1="${y}"
                x2="${chartRight}"
                y2="${y}"
                stroke="${colors.line}"
                stroke-width="1"
            ></line>

            <text
                x="${chartLeft - 9}"
                y="${y + 3}"
                text-anchor="end"
                font-size="9"
                fill="${colors.muted}"
            >
                ${formatter(value)}
            </text>
        `;
    }

    labels.forEach(
        (label, index) => {
            if (
                labels.length > 8 &&
                index %
                    Math.ceil(
                        labels.length /
                            8
                    ) !== 0
            ) {
                return;
            }

            svg += `
                <text
                    x="${xPosition(index)}"
                    y="${height - 9}"
                    text-anchor="middle"
                    font-size="8"
                    fill="${colors.muted}"
                >
                    ${escapeHtml(label)}
                </text>
            `;
        }
    );

    if (
        series[0]?.values?.length
    ) {
        const firstPath =
            makePath(
                series[0].values
            );

        const areaPath =
            `${firstPath} L ${
                chartRight
            } ${chartBottom} L ${
                chartLeft
            } ${chartBottom} Z`;

        svg += `
            <path
                d="${areaPath}"
                fill="url(#flowBlueFill)"
                stroke="none"
            ></path>
        `;
    }

    series.forEach(
        (line) => {
            if (
                !line.values?.length
            ) {
                return;
            }

            const path =
                makePath(
                    line.values
                );

            svg += `
                <path
                    d="${path}"
                    fill="none"
                    stroke="${line.color}"
                    stroke-width="${
                        line.width || 3
                    }"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                ></path>
            `;

            const lastIndex =
                line.values.length -
                1;

            svg += `
                <circle
                    cx="${xPosition(
                        lastIndex
                    )}"
                    cy="${yPosition(
                        line.values[
                            lastIndex
                        ]
                    )}"
                    r="4"
                    fill="#ffffff"
                    stroke="${line.color}"
                    stroke-width="2"
                ></circle>
            `;
        }
    );

    svg += "</svg>";

    container.innerHTML = svg;
}

function renderFlowChart(range) {
    const data =
        flowChartData[range] ||
        flowChartData["1H"];

    const difference =
        data.input.map(
            (value, index) =>
                Number(
                    (
                        value -
                        data.output[
                            index
                        ]
                    ).toFixed(2)
                )
        );

    const allValues = [
        ...data.input,
        ...data.output,
        ...difference
    ];

    const min =
        Math.max(
            0,
            Math.floor(
                Math.min(
                    ...allValues
                ) * 10
            ) /
                10 -
                0.1
        );

    const max =
        Math.ceil(
            Math.max(
                ...data.input
            ) * 10
        ) /
            10 +
        0.2;

    const rootStyle =
        getComputedStyle(
            document.documentElement
        );

    const blue =
        rootStyle
            .getPropertyValue(
                "--blue"
            )
            .trim() ||
        "#2187c9";

    const green =
        rootStyle
            .getPropertyValue(
                "--green"
            )
            .trim() ||
        "#2e8b64";

    const orange =
        rootStyle
            .getPropertyValue(
                "--orange"
            )
            .trim() ||
        "#c9851f";

    renderLineChart(
        "flow-chart",
        {
            labels: data.labels,
            min,
            max,
            series: [
                {
                    values:
                        data.input,
                    color: blue,
                    width: 3
                },
                {
                    values:
                        data.output,
                    color: green,
                    width: 3
                },
                {
                    values:
                        difference,
                    color: orange,
                    width: 2
                }
            ],
            formatter: (value) =>
                Number(value).toFixed(1)
        }
    );
}

function renderTankChart() {
    const rootStyle =
        getComputedStyle(
            document.documentElement
        );

    const teal =
        rootStyle
            .getPropertyValue(
                "--teal"
            )
            .trim() ||
        "#159a98";

    renderLineChart(
        "tank-level-chart",
        {
            labels: [
                "06:00",
                "07:00",
                "08:00",
                "09:00",
                "10:00",
                "11:00",
                "12:00",
                "13:00"
            ],

            min: 40,
            max: 100,

            series: [
                {
                    values: [
                        82,
                        79,
                        76,
                        73,
                        69,
                        66,
                        64,
                        61
                    ],
                    color: teal,
                    width: 3
                }
            ],

            formatter: (value) =>
                `${Math.round(
                    value
                )}%`
        }
    );
}

function renderWaterUsageChart() {
    const rootStyle =
        getComputedStyle(
            document.documentElement
        );

    const blue =
        rootStyle
            .getPropertyValue(
                "--blue"
            )
            .trim() ||
        "#2187c9";

    const green =
        rootStyle
            .getPropertyValue(
                "--green"
            )
            .trim() ||
        "#2e8b64";

    renderLineChart(
        "water-usage-chart",
        {
            labels: [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ],

            min: 19000,
            max: 25500,

            series: [
                {
                    values: [
                        21800,
                        22400,
                        23100,
                        23900,
                        24680,
                        23800,
                        24200
                    ],
                    color: blue,
                    width: 3
                },
                {
                    values: [
                        20500,
                        21400,
                        21900,
                        22500,
                        22940,
                        22400,
                        22800
                    ],
                    color: green,
                    width: 3
                }
            ],

            formatter: (value) =>
                `${Math.round(
                    value / 1000
                )}k`
        }
    );
}

function renderWaterLossChart() {
    const rootStyle =
        getComputedStyle(
            document.documentElement
        );

    const orange =
        rootStyle
            .getPropertyValue(
                "--orange"
            )
            .trim() ||
        "#c9851f";

    renderLineChart(
        "water-loss-chart",
        {
            labels: [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ],

            min: 0,
            max: 2000,

            series: [
                {
                    values: [
                        1300,
                        1000,
                        1200,
                        1400,
                        1740,
                        1400,
                        1400
                    ],
                    color: orange,
                    width: 3
                }
            ],

            formatter: (value) =>
                `${Math.round(
                    value
                )}L`
        }
    );
}

/* =========================================================
   DMA
   ========================================================= */

function initDmaInteractions() {
    document
        .querySelectorAll(".dma-card")
        .forEach((card) => {
            const dmaName =
                card.dataset.dma;

            card.addEventListener(
                "click",
                () =>
                    openDmaDetails(
                        dmaName
                    )
            );

            card.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key ===
                            "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        openDmaDetails(
                            dmaName
                        );
                    }
                }
            );
        }
    );

    document
        .querySelectorAll(
            "[data-dma-detail]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () =>
                    openDmaDetails(
                        button.dataset
                            .dmaDetail
                    )
            );
        });

    document
        .querySelectorAll(".view-alert")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () =>
                    openDmaDetails(
                        button.dataset.dma
                    )
            );
        });

    document
        .querySelectorAll(
            ".table-action"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    const dma =
                        button.dataset.dma;

                    if (dma) {
                        openDmaDetails(
                            dma
                        );
                    }
                }
            );
        });
}

function openDmaDetails(dmaName) {
    const dma =
        appState.dmaData[
            dmaName
        ];

    if (!dma) return;

    appState.currentDma =
        dmaName;

    setText(
        "dma-detail-title",
        `${dma.name} Details`
    );

    setText(
        "dma-detail-subtitle",
        `${dma.zone} • Detailed monitoring information`
    );

    const status =
        document.getElementById(
            "dma-detail-status"
        );

    if (status) {
        status.textContent =
            dma.status;

        status.className =
            `status-badge ${getStatusClass(
                dma.status
            )}`;
    }

    setText(
        "detail-input-flow",
        `${dma.input} L/min`
    );

    setText(
        "detail-output-flow",
        `${dma.output} L/min`
    );

    setText(
        "detail-difference",
        `${dma.difference} L/min`
    );

    setText(
        "detail-tank-level",
        `${dma.tank}%`
    );

    setText(
        "detail-tank-percent",
        `${dma.tank}%`
    );

    setText(
        "tank-meter-value",
        `${dma.tank}%`
    );

    setText(
        "detail-dma-name",
        dma.name
    );

    setText(
        "detail-zone",
        dma.zone
    );

    setText(
        "detail-valve-1",
        dma.valve1
    );

    setText(
        "detail-valve-2",
        dma.valve2
    );

    setText(
        "detail-system-status",
        dma.status
    );

    setText(
        "detail-analysis",
        dma.analysis
    );

    setText(
        "detail-risk",
        dma.risk
    );

    setText(
        "detail-action",
        dma.action
    );

    const progress =
        document.getElementById(
            "dma-tank-progress"
        );

    if (progress) {
        progress.style.width =
            `${dma.tank}%`;
    }

    renderDmaDetailChart(
        dmaName
    );

    showPage(
        "dma-details"
    );
}

function getStatusClass(status) {
    if (status === "NORMAL") {
        return "normal";
    }

    if (status === "WARNING") {
        return "warning";
    }

    return "danger";
}

function renderDmaDetailChart(
    dmaName
) {
    const dma =
        appState.dmaData[
            dmaName
        ];

    const container =
        document.getElementById(
            "dma-detail-chart"
        );

    if (!container || !dma) {
        return;
    }

    const width = 760;
    const height = 260;

    const max =
        Math.max(
            dma.input,
            dma.output
        ) * 1.2;

    const inputHeight =
        175 *
        (
            dma.input /
            max
        );

    const outputHeight =
        175 *
        (
            dma.output /
            max
        );

    const inputX = 205;
    const outputX = 430;
    const baseY = 215;

    const rootStyle =
        getComputedStyle(
            document.documentElement
        );

    const blue =
        rootStyle
            .getPropertyValue(
                "--blue"
            )
            .trim() ||
        "#2187c9";

    const green =
        rootStyle
            .getPropertyValue(
                "--green"
            )
            .trim() ||
        "#2e8b64";

    container.innerHTML = `
        <svg
            class="chart-svg"
            viewBox="0 0 ${width} ${height}"
            aria-label="DMA flow comparison"
        >
            <line
                x1="100"
                y1="${baseY}"
                x2="660"
                y2="${baseY}"
                stroke="#dce6ec"
                stroke-width="1"
            ></line>

            <rect
                x="${inputX}"
                y="${baseY - inputHeight}"
                width="120"
                height="${inputHeight}"
                rx="8"
                fill="${blue}"
                opacity="0.92"
            ></rect>

            <rect
                x="${outputX}"
                y="${baseY - outputHeight}"
                width="120"
                height="${outputHeight}"
                rx="8"
                fill="${green}"
                opacity="0.92"
            ></rect>

            <text
                x="${inputX + 60}"
                y="${baseY - inputHeight - 12}"
                text-anchor="middle"
                font-size="13"
                font-weight="800"
                fill="#153044"
            >
                ${dma.input} L/min
            </text>

            <text
                x="${outputX + 60}"
                y="${baseY - outputHeight - 12}"
                text-anchor="middle"
                font-size="13"
                font-weight="800"
                fill="#153044"
            >
                ${dma.output} L/min
            </text>

            <text
                x="${inputX + 60}"
                y="${baseY + 25}"
                text-anchor="middle"
                font-size="10"
                fill="#6d8090"
            >
                INPUT FLOW
            </text>

            <text
                x="${outputX + 60}"
                y="${baseY + 25}"
                text-anchor="middle"
                font-size="10"
                fill="#6d8090"
            >
                OUTPUT FLOW
            </text>

            <text
                x="380"
                y="42"
                text-anchor="middle"
                font-size="11"
                font-weight="800"
                fill="#8b9aa5"
            >
                ${dma.name} FLOW BALANCE
            </text>
        </svg>
    `;
}

/* =========================================================
   ALERTS
   ========================================================= */

function initAlertInteractions() {
    document
        .getElementById(
            "test-alert-button"
        )
        ?.addEventListener(
            "click",
            () => {
                showAlertNotification({
                    title:
                        "TEST WATER LOSS ALERT",

                    dma: "DMA-03",

                    message:
                        "This is a dashboard alert test. No real hardware action is performed.",

                    value:
                        "10.6 L/min",

                    level:
                        "critical",

                    playSound:
                        true
                });
            }
        );

    document
        .getElementById(
            "notification-button"
        )
        ?.addEventListener(
            "click",
            () => {
                showPage("alerts");
            }
        );

    document
        .querySelectorAll(
            ".acknowledge-alert"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        const alertCard =
                            button.closest(
                                ".event-alert"
                            );

                        if (
                            alertCard
                        ) {
                            alertCard.classList.add(
                                "acknowledged"
                            );

                            button.textContent =
                                "Acknowledged";

                            button.disabled =
                                true;
                        }

                        showToastMessage(
                            "Alert acknowledged."
                        );
                    }
                );
            }
        );
}

function createToastContainer() {
    if (
        document.querySelector(
            ".aquaguard-toast-container"
        )
    ) {
        return;
    }

    const container =
        document.createElement(
            "div"
        );

    container.className =
        "aquaguard-toast-container";

    document.body.appendChild(
        container
    );
}

function showAlertNotification(
    options = {}
) {
    const {
        title =
            "ACTIVE WATER LOSS ALERT",

        dma = "DMA-03",

        message =
            "An abnormal flow condition has been detected.",

        value =
            "10.6 L/min",

        level = "critical",

        playSound = true
    } = options;

    const container =
        document.querySelector(
            ".aquaguard-toast-container"
        );

    if (!container) return;

    if (
        playSound &&
        appState.alertSoundEnabled
    ) {
        playAlertSound();
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `aquaguard-toast ${
            level === "warning"
                ? "warning-toast"
                : ""
        }`;

    toast.innerHTML = `
        <div class="aquaguard-toast-head">
            <strong>
                ${escapeHtml(title)}
            </strong>

            <button
                class="aquaguard-toast-close"
                aria-label="Close alert"
            >
                ×
            </button>
        </div>

        <p>
            <strong>
                ${escapeHtml(dma)}
            </strong>
            •
            ${escapeHtml(message)}
        </p>

        <div class="aquaguard-toast-meta">
            Flow difference:
            ${escapeHtml(value)}
        </div>

        <div class="aquaguard-toast-actions">
            <button
                class="aquaguard-toast-primary toast-view"
            >
                View Details →
            </button>

            <button
                class="aquaguard-toast-secondary toast-sound"
            >
                ${
                    appState.alertSoundEnabled
                        ? "🔊 Sound On"
                        : "🔈 Enable Sound"
                }
            </button>
        </div>
    `;

    container.prepend(toast);

    toast
        .querySelector(
            ".aquaguard-toast-close"
        )
        ?.addEventListener(
            "click",
            () => removeToast(toast)
        );

    toast
        .querySelector(".toast-view")
        ?.addEventListener(
            "click",
            () => {
                openDmaDetails(
                    dma
                );

                removeToast(
                    toast
                );
            }
        );

    toast
        .querySelector(".toast-sound")
        ?.addEventListener(
            "click",
            () => {
                enableAlertSound();
            }
        );

    setTimeout(() => {
        if (toast.isConnected) {
            removeToast(toast);
        }
    }, 12000);
}

function removeToast(toast) {
    if (!toast) return;

    toast.classList.add(
        "toast-hide"
    );

    setTimeout(
        () => toast.remove(),
        180
    );
}

/* =========================================================
   AUDIO
   ========================================================= */

function getAudioContext() {
    if (appState.audioContext) {
        return appState.audioContext;
    }

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) {
        return null;
    }

    appState.audioContext =
        new AudioContext();

    return appState.audioContext;
}

function enableAlertSound() {
    const context =
        getAudioContext();

    if (!context) {
        showToastMessage(
            "Browser audio is not supported.",
            "warning"
        );

        return;
    }

    context.resume().then(() => {
        appState.alertSoundEnabled =
            true;

        localStorage.setItem(
            "aquaguardAlertSound",
            "enabled"
        );

        syncSoundUI();

        playTone(
            660,
            0.13,
            "sine",
            0.06
        );

        setTimeout(
            () =>
                playTone(
                    880,
                    0.16,
                    "sine",
                    0.06
                ),
            160
        );
    });
}

function disableAlertSound() {
    appState.alertSoundEnabled =
        false;

    localStorage.removeItem(
        "aquaguardAlertSound"
    );

    syncSoundUI();
}

function syncSoundUI() {
    const status =
        document.getElementById(
            "alert-sound-status"
        );

    if (status) {
        status.textContent =
            appState.alertSoundEnabled
                ? "ON"
                : "OFF";

        status.style.color =
            appState.alertSoundEnabled
                ? "var(--green)"
                : "var(--muted)";
    }

    const toggle =
        document.getElementById(
            "sound-setting-toggle"
        ) ||
        document.getElementById(
            "sound-setting"
        );

    if (toggle) {
        toggle.checked =
            appState.alertSoundEnabled;
    }

    const headerToggle =
        document.getElementById(
            "sound-toggle"
        );

    if (headerToggle) {
        headerToggle.textContent =
            appState.alertSoundEnabled
                ? "🔊"
                : "🔈";
    }
}

function playTone(
    frequency = 800,
    duration = 0.2,
    type = "sine",
    volume = 0.05
) {
    const context =
        getAudioContext();

    if (!context) return;

    const oscillator =
        context.createOscillator();

    const gain =
        context.createGain();

    oscillator.type =
        type;

    oscillator.frequency.value =
        frequency;

    gain.gain.setValueAtTime(
        0,
        context.currentTime
    );

    gain.gain.linearRampToValueAtTime(
        volume,
        context.currentTime +
            0.015
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime +
            duration
    );

    oscillator.connect(
        gain
    );

    gain.connect(
        context.destination
    );

    oscillator.start();

    oscillator.stop(
        context.currentTime +
            duration
    );
}

function playAlertSound() {
    const context =
        getAudioContext();

    if (!context) return;

    context.resume().then(() => {
        playTone(
            880,
            0.18,
            "square",
            0.055
        );

        setTimeout(
            () =>
                playTone(
                    660,
                    0.18,
                    "square",
                    0.05
                ),
            230
        );

        setTimeout(
            () =>
                playTone(
                    880,
                    0.22,
                    "square",
                    0.055
                ),
            470
        );
    });
}

function showToastMessage(
    message,
    type = "normal"
) {
    const container =
        document.querySelector(
            ".aquaguard-toast-container"
        );

    if (!container) return;

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `aquaguard-toast ${
            type === "warning"
                ? "warning-toast"
                : ""
        }`;

    toast.innerHTML = `
        <div class="aquaguard-toast-head">
            <strong>AQUAGUARD</strong>

            <button
                class="aquaguard-toast-close"
            >
                ×
            </button>
        </div>

        <p>
            ${escapeHtml(message)}
        </p>
    `;

    container.prepend(
        toast
    );

    toast
        .querySelector(
            ".aquaguard-toast-close"
        )
        ?.addEventListener(
            "click",
            () =>
                removeToast(
                    toast
                )
        );

    setTimeout(() => {
        if (toast.isConnected) {
            removeToast(
                toast
            );
        }
    }, 5000);
}

/* =========================================================
   PROTOTYPE CONTROLS
   ========================================================= */

function initPrototypeControls() {
    document
        .querySelectorAll(
            ".control-toggle"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    const device =
                        button.dataset.device;

                    if (!device) return;

                    appState.valveStates[
                        device
                    ] =
                        !appState
                            .valveStates[
                            device
                        ];

                    updateControlButton(
                        button,
                        device
                    );

                    showToastMessage(
                        `${formatDeviceName(
                            device
                        )} ${
                            appState
                                .valveStates[
                                device
                            ]
                                ? "activated"
                                : "deactivated"
                        }. Demo control only.`
                    );
                }
            );
        });
}

function updateControlButton(
    button,
    device
) {
    const active =
        appState.valveStates[
            device
        ];

    const valve =
        device.includes(
            "valve"
        );

    button.classList.toggle(
        "active",
        active
    );

    button.textContent =
        active
            ? (
                valve
                    ? "OPEN"
                    : "ON"
            )
            : (
                valve
                    ? "CLOSED"
                    : "OFF"
            );
}

function formatDeviceName(
    device
) {
    return {
        relay1:
            "Relay 1",
        relay2:
            "Relay 2",
        valve1:
            "Valve 1",
        valve2:
            "Valve 2"
    }[device] || device;
}

/* =========================================================
   SETTINGS
   ========================================================= */

function initSettings() {
    const soundToggle =
        document.getElementById(
            "sound-setting-toggle"
        ) ||
        document.getElementById(
            "sound-setting"
        );

    if (soundToggle) {
        soundToggle.checked =
            appState.alertSoundEnabled;

        soundToggle.addEventListener(
            "change",
            () => {
                if (
                    soundToggle.checked
                ) {
                    enableAlertSound();
                } else {
                    disableAlertSound();
                }
            }
        );
    }

    /*
       Current HTML uses simple checkbox inputs
       without the old IDs, so handle them safely.
    */
    const notificationCheckboxes =
        document.querySelectorAll(
            '.setting-toggle-row input[type="checkbox"]'
        );

    if (notificationCheckboxes.length) {
        const criticalToggle =
            notificationCheckboxes[0];

        const aiToggle =
            notificationCheckboxes[1];

        const soundSetting =
            soundToggle ||
            notificationCheckboxes[2];

        initCheckboxStorage(
            criticalToggle,
            "aquaguardCriticalAlerts",
            true
        );

        initCheckboxStorage(
            aiToggle,
            "aquaguardAiAlerts",
            true
        );

        if (
            soundSetting &&
            soundSetting !== soundToggle
        ) {
            soundSetting.checked =
                appState.alertSoundEnabled;

            soundSetting.addEventListener(
                "change",
                () => {
                    if (
                        soundSetting.checked
                    ) {
                        enableAlertSound();
                    } else {
                        disableAlertSound();
                    }
                }
            );
        }
    }

    const thresholdInput =
        document.getElementById(
            "flow-threshold"
        ) ||
        document.getElementById(
            "threshold-input"
        );

    if (thresholdInput) {
        const saved =
            localStorage.getItem(
                "aquaguardFlowThreshold"
            );

        if (
            saved !== null
        ) {
            thresholdInput.value =
                saved;
        }

        thresholdInput.addEventListener(
            "change",
            () => {
                localStorage.setItem(
                    "aquaguardFlowThreshold",
                    thresholdInput.value
                );

                showToastMessage(
                    "Flow detection threshold saved."
                );
            }
        );
    }

    const persistence =
        document.getElementById(
            "persistence-duration"
        ) ||
        document.getElementById(
            "persistence-select"
        );

    if (persistence) {
        const saved =
            localStorage.getItem(
                "aquaguardPersistence"
            );

        if (saved) {
            persistence.value =
                saved;
        }

        persistence.addEventListener(
            "change",
            () => {
                localStorage.setItem(
                    "aquaguardPersistence",
                    persistence.value
                );

                showToastMessage(
                    "Persistence duration saved."
                );
            }
        );
    }
}

function initCheckboxStorage(
    toggle,
    storageKey,
    defaultValue
) {
    if (!toggle) return;

    const saved =
        localStorage.getItem(
            storageKey
        );

    if (saved !== null) {
        toggle.checked =
            saved === "enabled";
    } else {
        toggle.checked =
            defaultValue;
    }

    toggle.addEventListener(
        "change",
        () => {
            localStorage.setItem(
                storageKey,
                toggle.checked
                    ? "enabled"
                    : "disabled"
            );
        }
    );
}

function initStoredCheckbox(
    id,
    storageKey
) {
    const toggle =
        document.getElementById(id);

    if (!toggle) return;

    const saved =
        localStorage.getItem(
            storageKey
        );

    if (
        saved !== null
    ) {
        toggle.checked =
            saved === "enabled";
    }

    toggle.addEventListener(
        "change",
        () => {
            localStorage.setItem(
                storageKey,
                toggle.checked
                    ? "enabled"
                    : "disabled"
            );
        }
    );
}

/* =========================================================
   HEADER SOUND BUTTON
   ========================================================= */

function initHeaderSoundButton() {
    const button =
        document.getElementById(
            "sound-toggle"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        () => {
            if (
                appState.alertSoundEnabled
            ) {
                disableAlertSound();
            } else {
                enableAlertSound();
            }
        }
    );
}

/* =========================================================
   REFRESH
   ========================================================= */

function initRefreshButton() {
    const button =
        document.getElementById(
            "refresh-dashboard"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        () => {
            button.disabled =
                true;

            button.textContent =
                "↻ Updating...";

            renderFlowChart(
                appState.chartRange
            );

            renderTankChart();

            renderWaterUsageChart();

            renderWaterLossChart();

            renderDmaDetailChart(
                appState.currentDma
            );

            updateLastUpdateTime();

            setTimeout(
                () => {
                    button.disabled =
                        false;

                    button.textContent =
                        "↻ Refresh";

                    showToastMessage(
                        "Dashboard data refreshed."
                    );
                },
                600
            );
        }
    );
}

/* =========================================================
   UTILITIES
   ========================================================= */

function setText(
    elementId,
    value
) {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.textContent =
            value;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

/* =========================================================
   GLOBAL API
   ========================================================= */

window.AquaGuard = {
    showPage,
    openDmaDetails,
    showAlertNotification,
    enableAlertSound,
    disableAlertSound,
    playAlertSound,
    signOut,
    appState
};

/* =========================================================
   EVENTS
   ========================================================= */

window.addEventListener(
    "resize",
    debounce(
        () => {
            renderFlowChart(
                appState.chartRange
            );

            renderTankChart();

            renderWaterUsageChart();

            renderWaterLossChart();

            renderDmaDetailChart(
                appState.currentDma
            );
        },
        180
    )
);

window.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key ===
            "Escape"
        ) {
            closeMobileSidebar();
        }
    }
);

/* =========================================================
   INITIALIZE HEADER SOUND
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initHeaderSoundButton();
    }
);

/* =========================================================
   DEBOUNCE
   ========================================================= */

function debounce(
    callback,
    delay = 150
) {
    let timer;

    return (...args) => {
        clearTimeout(timer);

        timer = setTimeout(
            () => callback(...args),
            delay
        );
    };
}