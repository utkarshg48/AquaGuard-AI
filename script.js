/* =========================================================
   AQUAGUARD AI
   MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   PAGE INFORMATION
========================================================= */

const pageInfo = {

    dashboard: {
        title: "Dashboard",
        subtitle: "Intelligent Water Monitoring & Loss Detection"
    },

    monitoring: {
        title: "DMA Monitoring",
        subtitle: "Monitor all district water zones"
    },

    prototype: {
        title: "Physical Prototype",
        subtitle: "Live hardware monitoring and control"
    },

    alerts: {
        title: "Alerts",
        subtitle: "Abnormal water-flow events"
    },

    ai: {
        title: "AI Prediction",
        subtitle: "Intelligent anomaly detection and prediction"
    },

    accounting: {
        title: "Water Accounting",
        subtitle: "Supplied water vs accounted water"
    },

    "dma-details": {
        title: "DMA-01 Details",
        subtitle: "Detailed monitoring information"
    },

    settings: {
        title: "Settings",
        subtitle: "System configuration and preferences"
    }

};


/* =========================================================
   COMMON ELEMENTS
========================================================= */

const navItems =
    document.querySelectorAll(".nav-item");

const pages =
    document.querySelectorAll(".page");

const pageLinks =
    document.querySelectorAll("[data-page-link]");

const pageTitle =
    document.getElementById("page-title");

const pageSubtitle =
    document.getElementById("page-subtitle");

const sidebar =
    document.querySelector(".sidebar");

const mobileMenu =
    document.querySelector(".mobile-menu");


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    /* Hide all pages */

    pages.forEach((page) => {

        page.classList.remove("active-page");

    });


    /* Find requested page */

    const selectedPage =
        document.getElementById(pageId);


    if (!selectedPage) {
        return;
    }


    /* Show requested page */

    selectedPage.classList.add("active-page");


    /* Update sidebar */

    navItems.forEach((item) => {

        item.classList.remove("active");

        if (item.dataset.page === pageId) {

            item.classList.add("active");

        }

    });


    /* Update header */

    if (pageInfo[pageId]) {

        pageTitle.textContent =
            pageInfo[pageId].title;

        pageSubtitle.textContent =
            pageInfo[pageId].subtitle;

    }


    /* Close mobile menu */

    if (sidebar) {

        sidebar.classList.remove("mobile-open");

    }


    /* Scroll to top */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

navItems.forEach((item) => {

    item.addEventListener("click", () => {

        showPage(
            item.dataset.page
        );

    });

});


/* =========================================================
   INTERNAL PAGE BUTTONS
========================================================= */

pageLinks.forEach((button) => {

    button.addEventListener("click", () => {

        const targetPage =
            button.dataset.pageLink;

        showPage(targetPage);

    });

});


/* =========================================================
   MOBILE MENU
========================================================= */

if (mobileMenu && sidebar) {

    mobileMenu.addEventListener("click", () => {

        sidebar.classList.toggle("mobile-open");

    });

}


/* =========================================================
   FLOW CHART DATA
   DEMONSTRATION / SIMULATED DATA
========================================================= */

const flowData = {

    Today: {

        labels: [
            "06:00",
            "08:00",
            "10:00",
            "12:00",
            "14:00",
            "16:00",
            "18:00",
            "20:00"
        ],

        flow1: [
            24,
            26,
            28,
            29,
            31,
            30,
            28,
            27
        ],

        flow2: [
            23,
            25,
            27,
            27,
            29,
            27,
            26,
            25
        ]

    },


    Yesterday: {

        labels: [
            "06:00",
            "08:00",
            "10:00",
            "12:00",
            "14:00",
            "16:00",
            "18:00",
            "20:00"
        ],

        flow1: [
            22,
            24,
            25,
            27,
            28,
            29,
            27,
            26
        ],

        flow2: [
            21,
            23,
            24,
            26,
            26,
            27,
            25,
            24
        ]

    },


    "Last 7 Days": {

        labels: [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun"
        ],

        flow1: [
            23,
            26,
            25,
            29,
            31,
            28,
            27
        ],

        flow2: [
            22,
            24,
            24,
            27,
            28,
            26,
            25
        ]

    },


    "Last 30 Days": {

        labels: [
            "01",
            "05",
            "10",
            "15",
            "20",
            "25",
            "30"
        ],

        flow1: [
            21,
            24,
            23,
            28,
            30,
            27,
            29
        ],

        flow2: [
            20,
            22,
            22,
            26,
            27,
            25,
            26
        ]

    }

};


/* =========================================================
   CREATE FLOW CHART
========================================================= */

function createFlowChart(period = "Today") {

    const chart =
        document.getElementById("flow-chart");

    if (!chart) {
        return;
    }


    const data =
        flowData[period];

    if (!data) {
        return;
    }


    const width = 900;

    const height = 300;

    const paddingLeft = 55;

    const paddingRight = 25;

    const paddingTop = 25;

    const paddingBottom = 40;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;

    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    const allValues = [
        ...data.flow1,
        ...data.flow2
    ];


    const maxValue =
        Math.ceil(
            Math.max(...allValues) / 5
        ) * 5 + 5;


    const xStep =
        chartWidth /
        (data.labels.length - 1);


    function getX(index) {

        return (
            paddingLeft +
            index * xStep
        );

    }


    function getY(value) {

        const ratio =
            value / maxValue;

        return (
            paddingTop +
            chartHeight -
            ratio * chartHeight
        );

    }


    function createPoints(values) {

        return values
            .map((value, index) => {

                return (
                    `${getX(index)},${getY(value)}`
                );

            })
            .join(" ");

    }


    const points1 =
        createPoints(data.flow1);

    const points2 =
        createPoints(data.flow2);


    /* Flow difference */

    const difference =
        data.flow1.map(
            (value, index) =>
                Math.max(
                    0,
                    value - data.flow2[index]
                )
        );


    const differencePoints =
        createPoints(difference);


    /* Grid lines */

    let gridLines = "";

    const gridCount = 5;


    for (let i = 0; i <= gridCount; i++) {

        const value =
            (maxValue / gridCount) * i;

        const y =
            getY(value);


        gridLines += `

            <line

                x1="${paddingLeft}"

                y1="${y}"

                x2="${width - paddingRight}"

                y2="${y}"

                stroke="#dfe8ed"

                stroke-width="1"

            />

            <text

                x="12"

                y="${y + 4}"

                fill="#7b8d99"

                font-size="10"

            >
                ${Math.round(value)}

            </text>

        `;

    }


    /* X labels */

    let xLabels = "";


    data.labels.forEach(
        (label, index) => {

            xLabels += `

                <text

                    x="${getX(index)}"

                    y="${height - 13}"

                    text-anchor="middle"

                    fill="#7b8d99"

                    font-size="10"

                >
                    ${label}

                </text>

            `;

        }
    );


    /* Data points */

    let dots = "";


    data.flow1.forEach(
        (value, index) => {

            dots += `

                <circle

                    cx="${getX(index)}"

                    cy="${getY(value)}"

                    r="3"

                    fill="#2187c9"

                />

            `;

        }
    );


    data.flow2.forEach(
        (value, index) => {

            dots += `

                <circle

                    cx="${getX(index)}"

                    cy="${getY(value)}"

                    r="3"

                    fill="#149b9b"

                />

            `;

        }
    );


    /* Chart */

    chart.innerHTML = `

        <div style="
            position:relative;
            width:100%;
            height:100%;
        ">

            <svg
                width="100%"
                height="100%"
                viewBox="0 0 ${width} ${height}"
                preserveAspectRatio="none"
            >

                ${gridLines}


                <!-- Flow 1 -->

                <polyline

                    points="${points1}"

                    fill="none"

                    stroke="#2187c9"

                    stroke-width="3"

                    stroke-linecap="round"

                    stroke-linejoin="round"

                />


                <!-- Flow 2 -->

                <polyline

                    points="${points2}"

                    fill="none"

                    stroke="#149b9b"

                    stroke-width="3"

                    stroke-linecap="round"

                    stroke-linejoin="round"

                />


                <!-- Difference -->

                <polyline

                    points="${differencePoints}"

                    fill="none"

                    stroke="#c9841d"

                    stroke-width="2"

                    stroke-dasharray="5 4"

                    stroke-linecap="round"

                />


                ${dots}


                ${xLabels}

            </svg>


            <div style="
                position:absolute;
                top:10px;
                right:10px;
                padding:4px 7px;
                border:1px solid #d9e4ea;
                background:white;
                border-radius:4px;
                color:#7d8e98;
                font-size:8px;
            ">
                SIMULATED DATA
            </div>

        </div>

    `;

}


/* =========================================================
   FLOW CHART SELECTOR
========================================================= */

const timeSelector =
    document.querySelector(".time-selector");


if (timeSelector) {

    timeSelector.addEventListener(
        "change",
        (event) => {

            createFlowChart(
                event.target.value
            );

        }
    );

}


/* =========================================================
   DMA DATA
========================================================= */

const dmaData = {

    "DMA-01": {

        name: "DMA-01",

        zone: "Residential Zone",

        inputFlow: 28.4,

        outputFlow: 26.9,

        difference: 1.5,

        tankLevel: 72,

        valve1: "OPEN",

        valve2: "OPEN",

        status: "NORMAL",

        latitude: "19.0760° N",

        longitude: "72.8777° E",

        risk: "LOW",

        action: "Continue monitoring",

        analysis:
            "Flow is currently within the expected range for this monitored area."

    },


    "DMA-02": {

        name: "DMA-02",

        zone: "Commercial Zone",

        inputFlow: 31.2,

        outputFlow: 27.8,

        difference: 3.4,

        tankLevel: 61,

        valve1: "OPEN",

        valve2: "OPEN",

        status: "WARNING",

        latitude: "19.0895° N",

        longitude: "72.8656° E",

        risk: "MEDIUM",

        action: "Inspect flow trend",

        analysis:
            "A moderate flow imbalance has been observed compared with the expected baseline."

    },


    "DMA-03": {

        name: "DMA-03",

        zone: "Industrial Zone",

        inputFlow: 29.7,

        outputFlow: 19.1,

        difference: 10.6,

        tankLevel: 48,

        valve1: "OPEN",

        valve2: "OPEN",

        status: "ALERT",

        latitude: "19.1024° N",

        longitude: "72.8891° E",

        risk: "HIGH",

        action: "Inspect monitored pipeline",

        analysis:
            "A significant persistent flow imbalance has been detected. Possible leakage or unauthorized diversion should be investigated."

    }

};


/* =========================================================
   DMA CARD NAVIGATION
========================================================= */

function attachDmaEvents() {

    const dmaCards =
        document.querySelectorAll(".dma-card");


    dmaCards.forEach((card) => {

        card.style.cursor = "pointer";


        card.addEventListener(
            "click",
            () => {

                const heading =
                    card.querySelector("h3");

                if (!heading) {
                    return;
                }


                const dmaName =
                    heading.textContent.trim();


                openDmaDetails(dmaName);

            }
        );


        /* Keyboard support */

        card.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    const heading =
                        card.querySelector("h3");

                    if (!heading) {
                        return;
                    }

                    openDmaDetails(
                        heading.textContent.trim()
                    );

                }

            }
        );

    });

}


attachDmaEvents();


/* =========================================================
   OPEN DMA DETAILS
========================================================= */

function openDmaDetails(dmaName) {

    const dma =
        dmaData[dmaName];


    if (!dma) {
        return;
    }


    /* Open detail page */

    showPage("dma-details");


    /* Page heading */

    document.getElementById(
        "dma-detail-title"
    ).textContent =
        `${dma.name} Details`;


    /* Flow */

    document.getElementById(
        "detail-input-flow"
    ).textContent =
        `${dma.inputFlow.toFixed(1)} L/min`;


    document.getElementById(
        "detail-output-flow"
    ).textContent =
        `${dma.outputFlow.toFixed(1)} L/min`;


    document.getElementById(
        "detail-difference"
    ).textContent =
        `${dma.difference.toFixed(1)} L/min`;


    /* Tank */

    document.getElementById(
        "detail-tank-level"
    ).textContent =
        `${dma.tankLevel}%`;


    /* DMA name */

    document.getElementById(
        "detail-dma-name"
    ).textContent =
        dma.name;


    /* Zone */

    document.getElementById(
        "detail-zone"
    ).textContent =
        dma.zone;


    /* Valve */

    document.getElementById(
        "detail-valve-1"
    ).textContent =
        dma.valve1;


    document.getElementById(
        "detail-valve-2"
    ).textContent =
        dma.valve2;


    /* Status */

    const systemStatus =
        document.getElementById(
            "detail-system-status"
        );

    systemStatus.textContent =
        dma.status;


    systemStatus.className = "";


    if (dma.status === "NORMAL") {

        systemStatus.classList.add(
            "text-green"
        );

    }
    else if (dma.status === "WARNING") {

        systemStatus.classList.add(
            "text-orange"
        );

    }
    else {

        systemStatus.classList.add(
            "text-red"
        );

    }


    /* Status badge */

    const statusBadge =
        document.getElementById(
            "dma-detail-status"
        );


    statusBadge.textContent =
        dma.status;


    statusBadge.className =
        "status-badge";


    if (dma.status === "NORMAL") {

        statusBadge.classList.add(
            "normal"
        );

    }
    else if (dma.status === "WARNING") {

        statusBadge.classList.add(
            "warning"
        );

    }
    else {

        statusBadge.classList.add(
            "danger"
        );

    }


    /* Risk */

    const risk =
        document.getElementById(
            "detail-risk"
        );


    risk.textContent =
        dma.risk;


    risk.className = "";


    if (dma.risk === "LOW") {

        risk.classList.add(
            "text-green"
        );

    }
    else if (dma.risk === "MEDIUM") {

        risk.classList.add(
            "text-orange"
        );

    }
    else {

        risk.classList.add(
            "text-red"
        );

    }


    /* Recommended action */

    document.getElementById(
        "detail-action"
    ).textContent =
        dma.action;


    /* Analysis */

    document.getElementById(
        "detail-analysis"
    ).textContent =
        dma.analysis;


    /* Location */

    document.getElementById(
        "detail-location-name"
    ).textContent =
        `${dma.name} Location`;


    document.getElementById(
        "detail-coordinates"
    ).textContent =
        `${dma.latitude}, ${dma.longitude}`;


    /* Detail chart */

    createDmaDetailChart(dma);

}


/* =========================================================
   DMA DETAIL CHART
========================================================= */

function createDmaDetailChart(dma) {

    const chart =
        document.getElementById(
            "dma-detail-chart"
        );


    if (!chart) {
        return;
    }


    const maxFlow =
        Math.max(
            dma.inputFlow,
            dma.outputFlow
        );


    const inputHeight =
        (dma.inputFlow / maxFlow) * 150;


    const outputHeight =
        (dma.outputFlow / maxFlow) * 150;


    chart.innerHTML = `

        <div style="
            position:relative;
            width:100%;
            height:100%;
            display:flex;
            align-items:flex-end;
            justify-content:center;
            gap:55px;
            padding:20px 30px 35px;
        ">


            <!-- INPUT -->

            <div style="
                width:55px;
                height:${inputHeight}px;
                background:#2187c9;
                border-radius:5px 5px 2px 2px;
                position:relative;
            ">

                <span style="
                    position:absolute;
                    top:-20px;
                    left:50%;
                    transform:translateX(-50%);
                    color:#607985;
                    font-size:9px;
                    white-space:nowrap;
                ">
                    ${dma.inputFlow} L/min
                </span>

            </div>


            <!-- OUTPUT -->

            <div style="
                width:55px;
                height:${outputHeight}px;
                background:#149b9b;
                border-radius:5px 5px 2px 2px;
                position:relative;
            ">

                <span style="
                    position:absolute;
                    top:-20px;
                    left:50%;
                    transform:translateX(-50%);
                    color:#607985;
                    font-size:9px;
                    white-space:nowrap;
                ">
                    ${dma.outputFlow} L/min
                </span>

            </div>


            <span style="
                position:absolute;
                bottom:10px;
                left:calc(50% - 82px);
                color:#788b95;
                font-size:8px;
            ">
                INPUT
            </span>


            <span style="
                position:absolute;
                bottom:10px;
                right:calc(50% - 91px);
                color:#788b95;
                font-size:8px;
            ">
                OUTPUT
            </span>

        </div>

    `;

}


/* =========================================================
   ALERT BUTTONS
========================================================= */

const alertButtons =
    document.querySelectorAll(".view-alert");


alertButtons.forEach((button) => {

    button.addEventListener("click", () => {

        openDmaDetails("DMA-03");

    });

});


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

showPage("dashboard");

createFlowChart("Today");