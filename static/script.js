// ============================================================
// SIH26030
// Automated Cable Specimen Preparation System
// Dual Architecture Simulator (ESP32 Prototype vs. Industrial PLC)
// ============================================================

// ------------------------------------------------------------
// ELEMENTS
// ------------------------------------------------------------
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const cableDiameter = document.getElementById("cableDiameter");
const specimenLength = document.getElementById("specimenLength");
const testMethod = document.getElementById("testMethod");
const controllerSelect = document.getElementById("controllerSelect");
const systemStatus = document.getElementById("systemStatus");
const statusDot = document.getElementById("statusDot");
const currentStage = document.getElementById("currentStage");
const processPercent = document.getElementById("processPercent");
const progressFill = document.getElementById("progressFill");
const cable = document.getElementById("cable");
const diameterBeam = document.getElementById("diameterBeam");
const diameterValue = document.getElementById("diameterValue");
const encoderValue = document.getElementById("encoderValue");
const rollerZone = document.querySelector(".roller-zone");
const clampZone = document.querySelector(".clamp-zone");
const clampStatus = document.getElementById("clampStatus");
const cuttingZone = document.getElementById("cuttingZone");
const blade = document.getElementById("blade");
const bladeStatus = document.getElementById("bladeStatus");
const cutDepth = document.getElementById("cutDepth");
const cutIndicator = document.getElementById("cutIndicator");
const cutZoneLabel = document.getElementById("cutZoneLabel");
const verificationBeam = document.getElementById("verificationBeam");
const verificationStatus = document.getElementById("verificationStatus");
const specimen = document.getElementById("specimen");
const wastePiece = document.getElementById("wastePiece");
const commandLog = document.getElementById("commandLog");
const telemetryDiameter = document.getElementById("telemetryDiameter");
const telemetryEncoder = document.getElementById("telemetryEncoder");
const telemetryClamp = document.getElementById("telemetryClamp");
const telemetryCutter = document.getElementById("telemetryCutter");
const telemetryVerification = document.getElementById("telemetryVerification");
const telemetrySafety = document.getElementById("telemetrySafety");
const architectureController = document.getElementById("architectureController");
const archControllerBox = document.getElementById("archControllerBox");
const archLine1 = document.getElementById("archLine1");
const archLine2 = document.getElementById("archLine2");
const archLine3 = document.getElementById("archLine3");
const methodDescription = document.getElementById("methodDescription");
const methodDetails = document.getElementById("methodDetails");
const longitudinalCut = document.getElementById("longitudinalCut");
const ringCut1 = document.getElementById("ringCut1");
const ringCut2 = document.getElementById("ringCut2");
const ringCut3 = document.getElementById("ringCut3");
const sheathSection = document.getElementById("sheathSection");

// Diagnostics Elements
const controllerModeBadge = document.getElementById("controllerModeBadge");
const badgeLabel = document.getElementById("badgeLabel");
const diagBus = document.getElementById("diagBus");
const diagLogic = document.getElementById("diagLogic");
const diagSpeed = document.getElementById("diagSpeed");
const diagSafety = document.getElementById("diagSafety");
const regTitle = document.getElementById("regTitle");
const regValue = document.getElementById("regValue");
const cycleTitle = document.getElementById("cycleTitle");
const cycleValue = document.getElementById("cycleValue");

// ------------------------------------------------------------
// METHOD CONFIGURATION
// ------------------------------------------------------------
const methods = {
    resistance: {
        name: "Conductor Resistance (IS 10810 Part 6)",
        defaultLength: 100,
        description: "Longitudinal stripping for conductor access and micro-ohmmeter testing",
        cutType: "LONGITUDINAL",
        depthFactor: 0.35,
        verification: "CONDUCTOR ACCESS VERIFIED",
        specimenLabel: "CONDUCTOR",
        details: "The cable is positioned and clamped. The cutting module executes an axial score down to the inner conductor strand boundary. The exposed core allows direct four-point Kelvin probe connection without nicking individual wire elements."
    },
    insulation: {
        name: "Insulation Thickness (IS 10810 Part 5)",
        defaultLength: 50,
        description: "Circumferential insulation section preparation (IS 10810 Part 5)",
        cutType: "RING CUT",
        depthFactor: 0.22,
        verification: "INSULATION SECTION VERIFIED",
        specimenLabel: "INSULATION",
        details: "The cutting station performs calibrated circumferential ring cuts. Programmed radial blade penetration isolates cleanly scored cylindrical sheath specimens for optical projector or micrometer thickness verification."
    },
    sheath: {
        name: "Sheath Thickness (IS 7098)",
        defaultLength: 50,
        description: "Boundary cuts for outer protective sheath isolation",
        cutType: "SHEATH SECTION",
        depthFactor: 0.28,
        verification: "SHEATH SECTION VERIFIED",
        specimenLabel: "SHEATH",
        details: "The cable is clamped securely and dual boundary incisions isolate a pristine outer sheath segment. This sample is certified for dimensional uniformity and cross-sectional density evaluation under IS 7098."
    },
    flame: {
        name: "Flame Retardance Specimen",
        defaultLength: 150,
        description: "Longer specimen section preparation for vertical flame chamber tests",
        cutType: "LONG SPECIMEN",
        depthFactor: 0.18,
        verification: "FLAME SPECIMEN VERIFIED",
        specimenLabel: "FLAME TEST",
        details: "A standard 150 mm cable section is fed under linear motion control, cut cleanly through jacket layers, and transferred to the certified output bin for lab burner testing."
    }
};

// ------------------------------------------------------------
// CONTROLLER PROFILES
// ------------------------------------------------------------
const controllerProfiles = {
    esp32: {
        name: "ESP32 PROTOTYPE",
        badge: "ACTIVE TARGET: ESP32-WROOM DUAL-CORE",
        badgeClass: "esp32-badge",
        bus: "UART/Serial (115200 baud)",
        logic: "Non-blocking C++ FSM",
        speed: "22.5 mm/s (Bench Mode)",
        failsafe: "GPIO 27 ISR (<50 ms)",
        regTitle: "ADC Sensor Reading",
        regValue: "1584 mV (Pin 34)",
        cycleTitle: "Target Cycle Window",
        cycleValue: "12.5 s (Bench Mode)",
        arch1: "Non-Blocking 10-State FSM",
        arch2: "FreeRTOS Core Isolation",
        arch3: "A4988 1/16 Microstepping",
        speedFactor: 1.0,
        logTag: "ESP32"
    },
    plc: {
        name: "INDUSTRIAL PLC (IEC 61131-3)",
        badge: "ACTIVE TARGET: 24V DIN-RAIL INDUSTRIAL PLC",
        badgeClass: "plc-badge",
        bus: "Modbus TCP/IP (Port 502)",
        logic: "IEC 61131-3 Ladder Logic",
        speed: "55.0 mm/s (High-Speed Line)",
        failsafe: "Dual-Channel Cat-4 SIL-3 Relay",
        regTitle: "Modbus Holding Register",
        regValue: "%MW104 = 0x04A0 (OK)",
        cycleTitle: "Target Cycle Window",
        cycleValue: "5.2 s (Production Mode)",
        arch1: "IEC 61131-3 Scan Cycle (2.1ms)",
        arch2: "EtherCAT / Modbus TCP Engine",
        arch3: "Closed-Loop Servo Drive Feed",
        speedFactor: 0.42, // 2.4x faster execution
        logTag: "MODBUS"
    }
};

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------
let running = false;
let emergency = false;
let currentEncoder = 0;
let currentProgress = 0;

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function sleep(ms) {
    const factor = controllerProfiles[controllerSelect.value].speedFactor;
    return new Promise(resolve => setTimeout(resolve, ms * factor));
}

function log(message, type = null) {
    const active = controllerProfiles[controllerSelect.value];
    const tag = type || active.logTag;
    const isPlc = tag === "MODBUS" || controllerSelect.value === "plc";
    
    const line = document.createElement("div");
    line.className = "log-line";
    line.innerHTML = `<span class="log-tag ${isPlc ? 'plc-tag' : ''}">${tag}</span>${message}`;
    commandLog.appendChild(line);
    commandLog.scrollTop = commandLog.scrollHeight;
}

function setStage(stage) {
    currentStage.textContent = stage;
}

function setProgress(value) {
    currentProgress = Math.max(0, Math.min(100, value));
    processPercent.textContent = `${Math.round(currentProgress)}%`;
    progressFill.style.width = `${currentProgress}%`;
}

function updateEncoder(value) {
    currentEncoder = value;
    encoderValue.textContent = value;
    telemetryEncoder.textContent = value;
}

function setSafety(status) {
    telemetrySafety.textContent = status;
}

function clearMethodVisuals() {
    cuttingZone.classList.remove(
        "circumferential",
        "longitudinal",
        "sheath-mode",
        "flame-mode",
        "cutting-active"
    );
    longitudinalCut.classList.remove("visible");
    ringCut1.classList.remove("visible");
    ringCut2.classList.remove("visible");
    ringCut3.classList.remove("visible");
    sheathSection.classList.remove("visible");
    blade.classList.remove("cut", "longitudinal", "ring", "deep");
}

function resetMachineVisuals() {
    clearMethodVisuals();
    cable.classList.remove("separated", "cutting-glow");
    cable.style.left = "40px";
    clampZone.classList.remove("closed");
    clampStatus.textContent = "OPEN";
    telemetryClamp.textContent = "OPEN";
    bladeStatus.textContent = "RETRACTED";
    telemetryCutter.textContent = "RETRACTED";
    verificationStatus.textContent = "WAITING";
    telemetryVerification.textContent = "WAITING";
    verificationBeam.classList.remove("active");
    specimen.classList.remove("visible");
    wastePiece.classList.remove("visible");
    diameterBeam.classList.remove("active");
    rollerZone.classList.remove("active", "active-plc");
    setProgress(0);
    updateEncoder(0);
    setStage("READY");
    systemStatus.textContent = "READY";
}

function getSelectedMethod() {
    return methods[testMethod.value];
}

// ------------------------------------------------------------
// METHOD SELECTION HANDLER
// ------------------------------------------------------------
function updateMethodUI() {
    const method = getSelectedMethod();
    if (!method) return;
    
    methodDescription.textContent = method.description;
    methodDetails.innerHTML = `
        <h3>${method.name}</h3>
        <p>${method.details}</p>
    `;
    specimenLength.value = method.defaultLength;
    clearMethodVisuals();

    if (testMethod.value === "resistance") {
        cuttingZone.classList.add("longitudinal");
        cutZoneLabel.textContent = "LONGITUDINAL CUT";
    } else if (testMethod.value === "insulation") {
        cuttingZone.classList.add("circumferential");
        cutZoneLabel.textContent = "RING CUT ZONE";
    } else if (testMethod.value === "sheath") {
        cuttingZone.classList.add("sheath-mode");
        cutZoneLabel.textContent = "SHEATH SECTION";
    } else if (testMethod.value === "flame") {
        cuttingZone.classList.add("flame-mode");
        cutZoneLabel.textContent = "LONG SPECIMEN";
    }
    
    log(`Preset recipe selected: ${method.name}`, "RECIPE");
}
testMethod.addEventListener("change", updateMethodUI);

// ------------------------------------------------------------
// CONTROLLER SELECTION HANDLER
// ------------------------------------------------------------
function updateControllerUI() {
    const p = controllerProfiles[controllerSelect.value];
    
    // Update Badge
    controllerModeBadge.className = `controller-badge ${p.badgeClass}`;
    badgeLabel.textContent = p.badge;
    
    // Update Runtime Info Bar
    diagBus.textContent = p.bus;
    diagLogic.textContent = p.logic;
    diagSpeed.textContent = p.speed;
    diagSafety.textContent = p.failsafe;
    
    // Update Telemetry Diagnostic Registers
    regTitle.textContent = p.regTitle;
    regValue.textContent = p.regValue;
    cycleTitle.textContent = p.cycleTitle;
    cycleValue.textContent = p.cycleValue;
    
    // Update Hardware Architecture Diagram
    architectureController.textContent = p.name;
    archLine1.textContent = p.arch1;
    archLine2.textContent = p.arch2;
    archLine3.textContent = p.arch3;
    
    if (controllerSelect.value === "plc") {
        archControllerBox.classList.add("plc-active");
    } else {
        archControllerBox.classList.remove("plc-active");
    }

    log(`Target hardware switched to: ${p.name}`, "TARGET");
    
    // Sync with Flask backend
    fetch("/api/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            controller: controllerSelect.value,
            diameter: cableDiameter.value,
            length: specimenLength.value,
            test_method: testMethod.value
        })
    }).catch(err => console.log("Backend offline, running browser simulation"));
}
controllerSelect.addEventListener("change", updateControllerUI);

// ------------------------------------------------------------
// AUTOMATION SEQUENCE STEPS
// ------------------------------------------------------------
async function detectDiameter() {
    setStage("DIAMETER DETECTION");
    const isPlc = controllerSelect.value === "plc";
    log(isPlc ? "Modbus register poll: %MW101 (Diameter Sensing)" : "ADC Pin 34 sampling outer boundary", isPlc ? "MODBUS" : "ADC");
    
    diameterBeam.classList.add("active");
    await sleep(800);
    if (emergency) return false;
    
    const diameter = parseFloat(cableDiameter.value);
    diameterValue.textContent = diameter.toFixed(1);
    telemetryDiameter.textContent = `${diameter.toFixed(1)} mm`;
    
    log(`OD calibrated: ${diameter.toFixed(1)} mm (Tolerance: ±0.03 mm)`, "SENSOR");
    diameterBeam.classList.remove("active");
    setProgress(15);
    return true;
}

async function parameterSetup() {
    const method = getSelectedMethod();
    const isPlc = controllerSelect.value === "plc";
    setStage("RECIPE COMPUTATION");
    
    log(isPlc ? `PLC Structured Text: EXEC_RECIPE_${testMethod.value.toUpperCase()}` : `ESP32 FSM loading lookup profile for ${method.name}`, "CALC");
    await sleep(600);
    if (emergency) return false;
    
    const diameter = parseFloat(cableDiameter.value);
    const depth = Math.max(1, diameter * method.depthFactor);
    cutDepth.textContent = depth.toFixed(2);
    
    log(`Programmed radial cut depth: ${depth.toFixed(2)} mm`, "FSM");
    setProgress(25);
    return true;
}

async function feedCable() {
    setStage("FEEDING CABLE");
    const isPlc = controllerSelect.value === "plc";
    log(isPlc ? "High-Speed PTO (Pulse Train Output) active @ 55 mm/s" : "AccelStepper profile initiated (3,200 pulses/rev)", "DRIVE");
    
    rollerZone.classList.add(isPlc ? "active-plc" : "active");
    cable.style.left = "120px";
    
    for (let value = 0; value <= 100; value += 10) {
        if (emergency) {
            rollerZone.classList.remove("active", "active-plc");
            return false;
        }
        updateEncoder(value * 12);
        setProgress(25 + value * 0.25);
        await sleep(isPlc ? 45 : 90);
    }
    
    rollerZone.classList.remove("active", "active-plc");
    log("Target feed position verified by quadrature pulse feedback", "MOTION");
    setProgress(50);
    return true;
}

async function clampCable() {
    setStage("ACTIVE CLAMPING");
    log("Dedicated PWM servo energizing self-centering clamp jaws", "ACT");
    await sleep(400);
    if (emergency) return false;
    
    clampZone.classList.add("closed");
    clampStatus.textContent = "LOCKED";
    telemetryClamp.textContent = "LOCKED";
    log("Interlock active: specimen locked in cutting bay", "FEEDBACK");
    setProgress(58);
    await sleep(400);
    return true;
}

async function performCut() {
    const method = testMethod.value;
    const isPlc = controllerSelect.value === "plc";
    setStage("SPECIMEN SCORING");
    cuttingZone.classList.add("cutting-active");
    cable.classList.add("cutting-glow");
    
    log(isPlc ? "High-torque industrial servo cycle starting" : "Micro-stepping cutter actuation (PWM 14)", "CUTTER");

    if (method === "resistance") {
        blade.classList.add("longitudinal");
        bladeStatus.textContent = "AXIAL SCORE";
        telemetryCutter.textContent = "AXIAL SCORE";
        longitudinalCut.classList.add("visible");
        await sleep(800);
        if (emergency) return false;
        blade.classList.add("deep");
        setProgress(70);
        await sleep(700);
    } else if (method === "insulation") {
        blade.classList.add("ring", "cut");
        bladeStatus.textContent = "RING CUT 1/3";
        telemetryCutter.textContent = "RING 1/3";
        await sleep(500);
        if (emergency) return false;
        ringCut1.classList.add("visible");
        setProgress(64);
        
        bladeStatus.textContent = "RING CUT 2/3";
        telemetryCutter.textContent = "RING 2/3";
        await sleep(450);
        if (emergency) return false;
        ringCut2.classList.add("visible");
        setProgress(70);
        
        bladeStatus.textContent = "RING CUT 3/3";
        telemetryCutter.textContent = "RING 3/3";
        await sleep(450);
        if (emergency) return false;
        ringCut3.classList.add("visible");
        setProgress(75);
    } else if (method === "sheath") {
        blade.classList.add("cut");
        bladeStatus.textContent = "BOUNDARY SCORE";
        telemetryCutter.textContent = "BOUNDARY SCORE";
        sheathSection.classList.add("visible");
        await sleep(700);
        if (emergency) return false;
        setProgress(72);
        await sleep(500);
    } else {
        blade.classList.add("cut");
        bladeStatus.textContent = "PARTING CUT";
        telemetryCutter.textContent = "PARTING CUT";
        await sleep(800);
        if (emergency) return false;
        setProgress(72);
        await sleep(500);
    }

    blade.classList.remove("cut", "deep", "longitudinal");
    cuttingZone.classList.remove("cutting-active");
    cable.classList.remove("cutting-glow");
    bladeStatus.textContent = "RETRACTED";
    telemetryCutter.textContent = "RETRACTED";
    log("Cutter retracted cleanly to safe mechanical limit stop", "FEEDBACK");
    setProgress(80);
    return true;
}

async function verifySpecimen() {
    const method = getSelectedMethod();
    setStage("INLINE QA GATE");
    log("Optical verification sensor active on GPIO 26", "INSPECT");
    
    verificationBeam.classList.add("active");
    verificationStatus.textContent = "SCANNING";
    telemetryVerification.textContent = "SCANNING";
    
    await sleep(750);
    if (emergency) return false;
    
    verificationStatus.textContent = method.verification;
    telemetryVerification.textContent = "CERTIFIED";
    log(`Quality gate passed: ${method.verification}`, "PASS");
    
    verificationBeam.classList.remove("active");
    setProgress(90);
    await sleep(400);
    return true;
}

async function ejectSpecimen() {
    const method = getSelectedMethod();
    setStage("EJECTION CYCLE");
    log("De-energizing clamp and initiating pneumatic specimen release", "EJECT");
    
    clampZone.classList.remove("closed");
    clampStatus.textContent = "OPEN";
    telemetryClamp.textContent = "OPEN";
    
    await sleep(400);
    if (emergency) return false;
    
    specimen.textContent = method.specimenLabel;
    specimen.classList.add("visible");
    wastePiece.classList.add("visible");
    cable.classList.add("separated");
    
    setProgress(98);
    await sleep(600);
    log("Standard test specimen discharged to certified output tray", "OUTPUT");
    log("Sheath trims routed to scrap collection bin", "WASTE");
    setProgress(100);
    return true;
}

async function completeProcess() {
    const method = getSelectedMethod();
    const isPlc = controllerSelect.value === "plc";
    setStage("CYCLE COMPLETE");
    systemStatus.textContent = "COMPLETED";
    
    log(`Batch cycle finished in ${isPlc ? '5.2' : '12.4'} s. Machine ready for next test specimen.`, "SUCCESS");
    setSafety("SAFE");
    await sleep(500);
}

// ------------------------------------------------------------
// MAIN START ROUTINE
// ------------------------------------------------------------
async function startProcess() {
    if (running) return;
    emergency = false;
    document.body.classList.remove("emergency");
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    systemStatus.textContent = "EXECUTING";
    setSafety("INTERLOCKED");
    resetMachineVisuals();

    const method = getSelectedMethod();
    const ctrl = controllerProfiles[controllerSelect.value];
    
    log("==========================================", "SYS");
    log(`RUNNING: ${method.name} via [${ctrl.name}]`, "SYSTEM");
    log(`Target length: ${specimenLength.value} mm | Speed profile: ${ctrl.speed}`, "CONFIG");

    // Inform Flask backend
    fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            controller: controllerSelect.value,
            diameter: cableDiameter.value,
            length: specimenLength.value,
            test_method: testMethod.value
        })
    }).catch(err => console.log("Backend sync skipped"));

    // Sequential cycle execution
    if (!await detectDiameter()) return finishProcess();
    if (!await parameterSetup()) return finishProcess();
    if (!await feedCable()) return finishProcess();
    if (!await clampCable()) return finishProcess();
    if (!await performCut()) return finishProcess();
    if (!await verifySpecimen()) return finishProcess();
    if (!await ejectSpecimen()) return finishProcess();
    await completeProcess();
    finishProcess();
}

function finishProcess() {
    running = false;
    startBtn.disabled = false;
}

// ------------------------------------------------------------
// EMERGENCY STOP ROUTINE
// ------------------------------------------------------------
function emergencyStop() {
    emergency = true;
    running = false;
    document.body.classList.add("emergency");
    
    systemStatus.textContent = "EMERGENCY HALT";
    setStage("EMERGENCY STOP (<50 ms)");
    setSafety("CUT-OFF");
    
    rollerZone.classList.remove("active", "active-plc");
    cuttingZone.classList.remove("cutting-active");
    cable.classList.remove("cutting-glow");
    blade.classList.remove("cut", "deep", "longitudinal", "ring");
    clampZone.classList.remove("closed");
    clampStatus.textContent = "OPEN";
    telemetryClamp.textContent = "OPEN";
    bladeStatus.textContent = "HALTED";
    telemetryCutter.textContent = "RETRACTED";
    
    log("EMERGENCY STOP TRIP: GPIO 27 hardware interrupt fired!", "E-STOP");
    log("All PWM pulses killed. Actuators isolated in <50 ms.", "SAFETY");
    
    fetch("/api/emergency_stop", { method: "POST" }).catch(err => {});
    startBtn.disabled = false;
}

// ------------------------------------------------------------
// EVENT LISTENERS & INITIALIZATION
// ------------------------------------------------------------
startBtn.addEventListener("click", startProcess);
stopBtn.addEventListener("click", emergencyStop);

// Startup Initialization
resetMachineVisuals();
updateMethodUI();
updateControllerUI();
log("SIH26030 supervisory twin ready on Port 5001", "PORT5001");
log("All safety loops and ADC lookup tables nominal", "INIT");
