/* =========================================================
   AQUAGUARD AI
   Professional Water Control Center
   Vanilla JavaScript Frontend
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initAquaGuard();
});


/* =========================================================
   APPLICATION STATE
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

            analysis:
                "Flow is within the expected range for this zone.",

            action:
                "Continue monitoring."
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

            analysis:
                "A moderate flow imbalance is above the historical baseline.",

            action:
                "Inspect the flow trend and monitored pipeline."
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

            analysis:
                "Significant persistent flow imbalance detected.",

            action:
                "Inspect the monitored pipeline and verify the physical flow path."
        }
    }
};


/* =========================================================
   PAGE INFORMATION
   ========================================================= */

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


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initAquaGuard() {

    initNavigation();

    initMobileSidebar();

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

    /*
     * Demo alert is intentionally delayed so the dashboard
     * has time to load first.
     */
    setTimeout(() => {

        showAlertNotification({
            title: "ACTIVE WATER LOSS ALERT",
            dma: "DMA-03",
            message:
                "Significant flow imbalance detected. Possible leakage or unauthorized diversion should be investigated.",
            value: "10.6 L/min",
            level: "critical",
            playSound: true
        });

    }, 1800);

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initNavigation() {

    document.querySelectorAll(".nav-item").forEach((button) => {

        button.addEventListener("click", () => {

            const page = button.dataset.page;

            if (!page) {
                return;
            }

            showPage(page);

        });

    });


    document.querySelectorAll("[data-page-link]").forEach((element) => {

        element.addEventListener("click", (event) => {

            event.preventDefault();

            const page = element.dataset.pageLink;

            if (!page) {
                return;
            }

            showPage(page);

        });

    });

}


/* =========================================================
   SHOW PAGE
   ========================================================= */

function showPage(pageId) {

    const targetPage = document.getElementById(pageId);

    if (!targetPage) {
        return;
    }

    document.querySelectorAll(".page").forEach((page) => {

        page.classList.remove("active-page");

    });


    targetPage.classList.add("active-page");


    document.querySelectorAll(".nav-item").forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );

    });


    const info = pageInfo[pageId];

    if (info) {

        const pageTitle =
            document.getElementById("page-title");

        const pageSubtitle =
            document.getElementById("page-subtitle");

        const headerSection =
            document.getElementById("header-section");


        if (pageTitle) {
            pageTitle.textContent = info.title;
        }

        if (pageSubtitle) {
            pageSubtitle.textContent = info.subtitle;
        }

        if (headerSection) {
            headerSection.textContent = info.section;
        }

    }


    appState.currentPage = pageId;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    closeMobileSidebar();

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


    if (!menuButton || !sidebar) {
        return;
    }


    menuButton.addEventListener("click", () => {

        sidebar.classList.toggle("mobile-open");

        if (overlay) {
            overlay.classList.toggle(
                "visible",
                sidebar.classList.contains("mobile-open")
            );
        }

    });


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileSidebar
        );

    }

}


function closeMobileSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebar-overlay");


    sidebar?.classList.remove("mobile-open");

    overlay?.classList.remove("visible");

}


/* =========================================================
   LAST UPDATE TIME
   ========================================================= */

function updateLastUpdateTime() {

    const element =
        document.getElementById("last-update");

    if (!element) {
        return;
    }


    const now = new Date();

    element.textContent =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

}


/* =========================================================
   CHART INITIALIZATION
   ========================================================= */

function initCharts() {

    renderFlowChart(appState.chartRange);

    renderTankChart();

    renderWaterUsageChart();

    renderWaterLossChart();

    renderDmaDetailChart(appState.currentDma);


    document
        .querySelectorAll(".chart-range")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const range =
                    button.dataset.range;

                if (!range) {
                    return;
                }


                document
                    .querySelectorAll(".chart-range")
                    .forEach((item) => {

                        item.classList.toggle(
                            "active",
                            item === button
                        );

                    });


                appState.chartRange = range;

                renderFlowChart(range);

            });

        });

}


/* =========================================================
   GENERIC SVG LINE CHART
   ========================================================= */

function renderLineChart(containerId, config) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }


    const {

        series = [],

        labels = [],

        min = 0,

        max = 10,

        height = 280,

        formatter = (value) =>
            String(value)

    } = config;


    if (!series.length) {
        return;
    }


    const width = 900;

    const chartTop = 24;
    const chartBottom = height - 34;

    const chartLeft = 54;
    const chartRight = width - 18;

    const plotWidth =
        chartRight - chartLeft;

    const plotHeight =
        chartBottom - chartTop;


    const safeRange =
        max - min || 1;


    function xPosition(index) {

        if (labels.length <= 1) {
            return chartLeft;
        }

        return chartLeft +
            (index / (labels.length - 1)) *
            plotWidth;

    }


    function yPosition(value) {

        const clamped =
            Math.max(
                min,
                Math.min(max, value)
            );

        return chartBottom -
            ((clamped - min) / safeRange) *
            plotHeight;

    }


    function makePath(values) {

        return values
            .map((value, index) => {

                const x = xPosition(index);
                const y = yPosition(value);

                return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;

            })
            .join(" ");

    }


    const rootStyle =
        getComputedStyle(document.documentElement);


    const colors = {

        blue:
            rootStyle.getPropertyValue("--blue").trim() ||
            "#2187c9",

        green:
            rootStyle.getPropertyValue("--green").trim() ||
            "#2e8b64",

        orange:
            rootStyle.getPropertyValue("--orange").trim() ||
            "#c9851f",

        line:
            rootStyle.getPropertyValue("--line").trim() ||
            "#dce6ec",

        muted:
            rootStyle.getPropertyValue("--muted").trim() ||
            "#6d8090"

    };


    let svg = `

        <svg
            class="chart-svg"
            viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="none"
            role="img"
            aria-label="Sensor trend chart"
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
                    />

                    <stop
                        offset="100%"
                        stop-color="${colors.blue}"
                        stop-opacity="0"
                    />

                </linearGradient>

            </defs>
    `;


    /*
     * Horizontal grid
     */

    const gridCount = 5;


    for (let i = 0; i <= gridCount; i++) {

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
            />

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


    /*
     * Vertical labels
     */

    labels.forEach((label, index) => {

        if (
            labels.length > 8 &&
            index % Math.ceil(labels.length / 8) !== 0
        ) {
            return;
        }


        const x = xPosition(index);


        svg += `

            <text
                x="${x}"
                y="${height - 9}"
                text-anchor="middle"
                font-size="8"
                fill="${colors.muted}"
            >
                ${label}
            </text>

        `;

    });


    /*
     * Area for first series
     */

    if (series[0]?.values?.length) {

        const firstPath =
            makePath(series[0].values);


        const areaPath =
            `${firstPath} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;


        svg += `

            <path
                d="${areaPath}"
                fill="url(#flowBlueFill)"
                stroke="none"
            />

        `;

    }


    /*
     * Lines
     */

    series.forEach((line) => {

        if (!line.values?.length) {
            return;
        }


        const path =
            makePath(line.values);


        svg += `

            <path
                d="${path}"
                fill="none"
                stroke="${line.color}"
                stroke-width="${line.width || 3}"
                stroke-linejoin="round"
                stroke-linecap="round"
            />

        `;


        /*
         * Last point
         */

        const lastIndex =
            line.values.length - 1;


        const cx =
            xPosition(lastIndex);

        const cy =
            yPosition(line.values[lastIndex]);


        svg += `

            <circle
                cx="${cx}"
                cy="${cy}"
                r="4"
                fill="#ffffff"
                stroke="${line.color}"
                stroke-width="2"
            />

        `;

    });


    svg += `</svg>`;


    container.innerHTML = svg;

}


/* =========================================================
   FLOW CHART DATA
   ========================================================= */

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
   RENDER FLOW CHART
   ========================================================= */

function renderFlowChart(range) {

    const data =
        flowChartData[range] ||
        flowChartData["1H"];


    const difference =
        data.input.map(
            (value, index) =>
                Number(
                    (value - data.output[index]).toFixed(2)
                )
        );


    const allValues = [
        ...data.input,
        ...data.output,
        ...difference
    ];


    const minimum =
        Math.max(
            0,
            Math.floor(
                Math.min(...allValues) * 10
            ) / 10 - 0.1
        );


    const maximum =
        Math.ceil(
            Math.max(...data.input) * 10
        ) / 10 + 0.2;


    const rootStyle =
        getComputedStyle(document.documentElement);


    const blue =
        rootStyle.getPropertyValue("--blue").trim() ||
        "#2187c9";

    const green =
        rootStyle.getPropertyValue("--green").trim() ||
        "#2e8b64";

    const orange =
        rootStyle.getPropertyValue("--orange").trim() ||
        "#c9851f";


    renderLineChart("flow-chart", {

        labels: data.labels,

        min: minimum,

        max: maximum,

        series: [

            {
                values: data.input,
                color: blue,
                width: 3
            },

            {
                values: data.output,
                color: green,
                width: 3
            },

            {
                values: difference,
                color: orange,
                width: 2
            }

        ],

        formatter: (value) =>
            Number(value).toFixed(1)

    });

}


/* =========================================================
   TANK LEVEL CHART
   ========================================================= */

function renderTankChart() {

    const levels = [
        82,
        79,
        76,
        73,
        69,
        66,
        64,
        61
    ];


    const labels = [
        "06:00",
        "07:00",
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00"
    ];


    const rootStyle =
        getComputedStyle(document.documentElement);


    const teal =
        rootStyle.getPropertyValue("--teal").trim() ||
        "#159a98";


    renderLineChart("tank-level-chart", {

        labels,

        min: 40,

        max: 100,

        series: [

            {
                values: levels,
                color: teal,
                width: 3
            }

        ],

        formatter: (value) =>
            `${Math.round(value)}%`

    });

}


/* =========================================================
   WATER USAGE CHART
   ========================================================= */

function renderWaterUsageChart() {

    const supplied = [
        21800,
        22400,
        23100,
        23900,
        24680,
        23800,
        24200
    ];


    const accounted = [
        20500,
        21400,
        21900,
        22500,
        22940,
        22400,
        22800
    ];


    const labels = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];


    const rootStyle =
        getComputedStyle(document.documentElement);


    const blue =
        rootStyle.getPropertyValue("--blue").trim() ||
        "#2187c9";

    const green =
        rootStyle.getPropertyValue("--green").trim() ||
        "#2e8b64";


    renderLineChart("water-usage-chart", {

        labels,

        min: 19000,

        max: 25500,

        series: [

            {
                values: supplied,
                color: blue,
                width: 3
            },

            {
                values: accounted,
                color: green,
                width: 3
            }

        ],

        formatter: (value) =>
            `${Math.round(value / 1000)}k`

    });

}


/* =========================================================
   WATER LOSS CHART
   ========================================================= */

function renderWaterLossChart() {

    const loss = [
        1300,
        1000,
        1200,
        1400,
        1740,
        1400,
        1400
    ];


    const labels = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];


    const rootStyle =
        getComputedStyle(document.documentElement);


    const orange =
        rootStyle.getPropertyValue("--orange").trim() ||
        "#c9851f";


    renderLineChart("water-loss-chart", {

        labels,

        min: 0,

        max: 2000,

        series: [

            {
                values: loss,
                color: orange,
                width: 3
            }

        ],

        formatter: (value) =>
            `${Math.round(value)}L`

    });

}


/* =========================================================
   DMA INTERACTIONS
   ========================================================= */

function initDmaInteractions() {

    document
        .querySelectorAll(".dma-card")
        .forEach((card) => {

            const dmaName =
                card.dataset.dma;


            card.addEventListener("click", () => {

                openDmaDetails(dmaName);

            });


            card.addEventListener("keydown", (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    openDmaDetails(dmaName);

                }

            });

        });


    document
        .querySelectorAll("[data-dma-detail]")
        .forEach((button) => {

            button.addEventListener("click", () => {

                openDmaDetails(
                    button.dataset.dmaDetail
                );

            });

        });


    document
        .querySelectorAll(".view-alert")
        .forEach((button) => {

            button.addEventListener("click", () => {

                const dma =
                    button.dataset.dma;

                openDmaDetails(dma);

            });

        });

}


/* =========================================================
   OPEN DMA DETAILS
   ========================================================= */

function openDmaDetails(dmaName) {

    const dma =
        appState.dmaData[dmaName];


    if (!dma) {
        return;
    }


    appState.currentDma = dmaName;


    const page =
        document.getElementById("dma-details");


    if (!page) {
        return;
    }


    const title =
        document.getElementById("dma-detail-title");

    const subtitle =
        document.getElementById("dma-detail-subtitle");

    const status =
        document.getElementById("dma-detail-status");


    if (title) {
        title.textContent =
            `${dma.name} Details`;
    }


    if (subtitle) {
        subtitle.textContent =
            `${dma.zone} • Detailed monitoring information`;
    }


    if (status) {

        status.textContent =
            dma.status;


        status.className =
            `status-badge ${getStatusClass(dma.status)}`;

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


    renderDmaDetailChart(dmaName);


    showPage("dma-details");

}


/* =========================================================
   DMA STATUS CLASS
   ========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "NORMAL":
            return "normal";

        case "WARNING":
            return "warning";

        case "ALERT":
        case "CRITICAL":
            return "danger";

        default:
            return "normal";

    }

}


/* =========================================================
   DMA DETAIL CHART
   ========================================================= */

function renderDmaDetailChart(dmaName) {

    const dma =
        appState.dmaData[dmaName];


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
        (dma.input / max);


    const outputHeight =
        175 *
        (dma.output / max);


    const inputX = 205;
    const outputX = 430;

    const baseY = 215;


    const rootStyle =
        getComputedStyle(document.documentElement);


    const blue =
        rootStyle.getPropertyValue("--blue").trim() ||
        "#2187c9";

    const green =
        rootStyle.getPropertyValue("--green").trim() ||
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
            />


            <rect
                x="${inputX}"
                y="${baseY - inputHeight}"
                width="120"
                height="${inputHeight}"
                rx="8"
                fill="${blue}"
                opacity="0.92"
            />


            <rect
                x="${outputX}"
                y="${baseY - outputHeight}"
                width="120"
                height="${outputHeight}"
                rx="8"
                fill="${green}"
                opacity="0.92"
            />


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
   ALERT INTERACTIONS
   ========================================================= */

function initAlertInteractions() {

    const testButton =
        document.getElementById(
            "test-alert-button"
        );


    if (testButton) {

        testButton.addEventListener(
            "click",
            () => {

                showAlertNotification({

                    title:
                        "TEST WATER LOSS ALERT",

                    dma:
                        "DMA-03",

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

    }


    const notificationButton =
        document.getElementById(
            "notification-button"
        );


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                showPage("alerts");

            }
        );

    }

}


/* =========================================================
   CREATE TOAST CONTAINER
   ========================================================= */

function createToastContainer() {

    let container =
        document.querySelector(
            ".aquaguard-toast-container"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.className =
            "aquaguard-toast-container";

        document.body.appendChild(container);

    }

}


/* =========================================================
   SHOW ALERT NOTIFICATION
   ========================================================= */

function showAlertNotification(options = {}) {

    const {

        title =
            "ACTIVE WATER LOSS ALERT",

        dma =
            "DMA-03",

        message =
            "An abnormal flow condition has been detected.",

        value =
            "10.6 L/min",

        level =
            "critical",

        playSound = true

    } = options;


    const container =
        document.querySelector(
            ".aquaguard-toast-container"
        );


    if (!container) {
        return;
    }


    if (
        playSound &&
        appState.alertSoundEnabled
    ) {

        playAlertSound();

    }


    const toast =
        document.createElement("div");


    toast.className =
        `aquaguard-toast ${level === "warning" ? "warning-toast" : ""}`;


    const safeTitle =
        escapeHtml(title);

    const safeDma =
        escapeHtml(dma);

    const safeMessage =
        escapeHtml(message);

    const safeValue =
        escapeHtml(value);


    toast.innerHTML = `

        <div class="aquaguard-toast-head">

            <strong>
                ${safeTitle}
            </strong>

            <button
                class="aquaguard-toast-close"
                aria-label="Close alert"
            >
                ×
            </button>

        </div>


        <p>
            <strong>${safeDma}</strong>
            • ${safeMessage}
        </p>


        <div class="aquaguard-toast-meta">
            Flow difference: ${safeValue}
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
                ${appState.alertSoundEnabled
                    ? "🔊 Sound On"
                    : "🔈 Enable Sound"}
            </button>

        </div>

    `;


    container.prepend(toast);


    /*
     * Close
     */

    const closeButton =
        toast.querySelector(
            ".aquaguard-toast-close"
        );


    closeButton?.addEventListener(
        "click",
        () => {

            removeToast(toast);

        }
    );


    /*
     * View details
     */

    const viewButton =
        toast.querySelector(
            ".toast-view"
        );


    viewButton?.addEventListener(
        "click",
        () => {

            openDmaDetails(dma);

            removeToast(toast);

        }
    );


    /*
     * Sound
     */

    const soundButton =
        toast.querySelector(
            ".toast-sound"
        );


    soundButton?.addEventListener(
        "click",
        () => {

            enableAlertSound();

            soundButton.textContent =
                "🔊 Sound On";

        }
    );


    /*
     * Auto remove after 12 seconds
     */

    setTimeout(() => {

        if (toast.isConnected) {

            removeToast(toast);

        }

    }, 12000);

}


/* =========================================================
   REMOVE TOAST
   ========================================================= */

function removeToast(toast) {

    if (!toast) {
        return;
    }


    toast.classList.add("toast-hide");


    setTimeout(() => {

        toast.remove();

    }, 180);

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   AUDIO CONTEXT
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


/* =========================================================
   ENABLE ALERT SOUND
   ========================================================= */

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


    context.resume()
        .then(() => {

            appState.alertSoundEnabled = true;

            localStorage.setItem(
                "aquaguardAlertSound",
                "enabled"
            );


            syncSoundUI();

            /*
             * Short confirmation tone
             */

            playTone(
                660,
                0.13,
                "sine",
                0.06
            );


            setTimeout(() => {

                playTone(
                    880,
                    0.16,
                    "sine",
                    0.06
                );

            }, 160);

        })
        .catch(() => {

            showToastMessage(
                "Click the Enable Sound button once to allow browser audio.",
                "warning"
            );

        });

}


/* =========================================================
   DISABLE ALERT SOUND
   ========================================================= */

function disableAlertSound() {

    appState.alertSoundEnabled = false;

    localStorage.removeItem(
        "aquaguardAlertSound"
    );


    syncSoundUI();

}


/* =========================================================
   SYNC SOUND UI
   ========================================================= */

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
        );


    if (toggle) {

        toggle.checked =
            appState.alertSoundEnabled;

    }

}


/* =========================================================
   PLAY SINGLE TONE
   ========================================================= */

function playTone(
    frequency = 800,
    duration = 0.2,
    type = "sine",
    volume = 0.05
) {

    const context =
        getAudioContext();


    if (!context) {
        return;
    }


    const oscillator =
        context.createOscillator();


    const gain =
        context.createGain();


    oscillator.type = type;

    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        0,
        context.currentTime
    );


    gain.gain.linearRampToValueAtTime(
        volume,
        context.currentTime + 0.015
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration
    );


    oscillator.connect(gain);

    gain.connect(context.destination);


    oscillator.start();

    oscillator.stop(
        context.currentTime + duration
    );

}


/* =========================================================
   PLAY ALERT SOUND
   ========================================================= */

function playAlertSound() {

    const context =
        getAudioContext();


    if (!context) {
        return;
    }


    context.resume()
        .then(() => {

            playTone(
                880,
                0.18,
                "square",
                0.055
            );


            setTimeout(() => {

                playTone(
                    660,
                    0.18,
                    "square",
                    0.05
                );

            }, 230);


            setTimeout(() => {

                playTone(
                    880,
                    0.22,
                    "square",
                    0.055
                );

            }, 470);

        });

}


/* =========================================================
   GENERAL TOAST MESSAGE
   ========================================================= */

function showToastMessage(
    message,
    type = "normal"
) {

    const container =
        document.querySelector(
            ".aquaguard-toast-container"
        );


    if (!container) {
        return;
    }


    const toast =
        document.createElement("div");


    toast.className =
        `aquaguard-toast ${
            type === "warning"
                ? "warning-toast"
                : ""
        }`;


    toast.innerHTML = `

        <div class="aquaguard-toast-head">

            <strong>
                AQUAGUARD
            </strong>

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


    container.prepend(toast);


    toast.querySelector(
        ".aquaguard-toast-close"
    )?.addEventListener(
        "click",
        () => removeToast(toast)
    );


    setTimeout(() => {

        if (toast.isConnected) {

            removeToast(toast);

        }

    }, 5000);

}


/* =========================================================
   PROTOTYPE CONTROLS
   ========================================================= */

function initPrototypeControls() {

    document
        .querySelectorAll(".control-toggle")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const device =
                        button.dataset.device;


                    if (!device) {
                        return;
                    }


                    appState.valveStates[device] =
                        !appState.valveStates[device];


                    updateControlButton(
                        button,
                        device
                    );


                    showToastMessage(
                        `${formatDeviceName(device)} ${
                            appState.valveStates[device]
                                ? "activated"
                                : "deactivated"
                        }. Demo control only.`,
                        "normal"
                    );

                }
            );

        });

}


/* =========================================================
   UPDATE CONTROL BUTTON
   ========================================================= */

function updateControlButton(
    button,
    device
) {

    const active =
        appState.valveStates[device];


    button.classList.toggle(
        "active",
        active
    );


    const valve =
        device.includes("valve");


    if (active) {

        button.textContent =
            valve
                ? "OPEN"
                : "ON";

    } else {

        button.textContent =
            valve
                ? "CLOSED"
                : "OFF";

    }

}


/* =========================================================
   FORMAT DEVICE NAME
   ========================================================= */

function formatDeviceName(device) {

    const names = {

        relay1: "Relay 1",
        relay2: "Relay 2",

        valve1: "Valve 1",
        valve2: "Valve 2"

    };


    return names[device] || device;

}


/* =========================================================
   SETTINGS
   ========================================================= */

function initSettings() {

    const soundToggle =
        document.getElementById(
            "sound-setting-toggle"
        );


    if (soundToggle) {

        soundToggle.checked =
            appState.alertSoundEnabled;


        soundToggle.addEventListener(
            "change",
            () => {

                if (soundToggle.checked) {

                    enableAlertSound();

                } else {

                    disableAlertSound();

                }

            }
        );

    }


    /*
     * Critical alert setting
     */

    const criticalToggle =
        document.getElementById(
            "critical-alert-toggle"
        );


    if (criticalToggle) {

        const saved =
            localStorage.getItem(
                "aquaguardCriticalAlerts"
            );


        if (saved !== null) {

            criticalToggle.checked =
                saved === "enabled";

        }


        criticalToggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "aquaguardCriticalAlerts",
                    criticalToggle.checked
                        ? "enabled"
                        : "disabled"
                );

            }
        );

    }


    /*
     * AI alert setting
     */

    const aiToggle =
        document.getElementById(
            "ai-alert-toggle"
        );


    if (aiToggle) {

        const saved =
            localStorage.getItem(
                "aquaguardAiAlerts"
            );


        if (saved !== null) {

            aiToggle.checked =
                saved === "enabled";

        }


        aiToggle.addEventListener(
            "change",
            () => {

                localStorage.setItem(
                    "aquaguardAiAlerts",
                    aiToggle.checked
                        ? "enabled"
                        : "disabled"
                );

            }
        );

    }


    /*
     * Flow threshold
     */

    const thresholdInput =
        document.getElementById(
            "flow-threshold"
        );


    if (thresholdInput) {

        const saved =
            localStorage.getItem(
                "aquaguardFlowThreshold"
            );


        if (saved !== null) {

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


    /*
     * Persistence setting
     */

    const persistence =
        document.getElementById(
            "persistence-duration"
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


/* =========================================================
   REFRESH DASHBOARD
   ========================================================= */

function initRefreshButton() {

    const button =
        document.getElementById(
            "refresh-dashboard"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            button.disabled = true;

            button.textContent =
                "↻ Updating...";


            /*
             * Re-render dashboard visuals.
             */

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


            setTimeout(() => {

                button.disabled = false;

                button.textContent =
                    "↻ Refresh";

                showToastMessage(
                    "Dashboard data refreshed."
                );

            }, 650);

        }
    );

}


/* =========================================================
   LIVE DEMO DATA UPDATE
   ========================================================= */

function updateDemoIndicators() {

    /*
     * This intentionally does NOT overwrite
     * the real hardware snapshot values.

     * It only adds a subtle visual status update
     * to the dashboard.
     */

    const liveElements =
        document.querySelectorAll(
            ".system-live"
        );


    liveElements.forEach((element) => {

        element.classList.remove(
            "status-refresh"
        );

    });

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        /*
         * Escape closes sidebar.
         */

        if (event.key === "Escape") {

            closeMobileSidebar();

        }


        /*
         * Ctrl + R is intentionally left
         * to browser refresh.
         */

    }
);


/* =========================================================
   WINDOW RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    debounce(() => {

        renderFlowChart(
            appState.chartRange
        );

        renderTankChart();

        renderWaterUsageChart();

        renderWaterLossChart();

        renderDmaDetailChart(
            appState.currentDma
        );

    }, 180)
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


        timer = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}


/* =========================================================
   SET TEXT HELPER
   ========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   GLOBAL ACCESS FOR TESTING
   ========================================================= */

window.AquaGuard = {

    showPage,

    openDmaDetails,

    showAlertNotification,

    enableAlertSound,

    disableAlertSound,

    playAlertSound,

    renderFlowChart,

    appState

};