from flask import Flask, render_template, jsonify, request
import time
import math

app = Flask(__name__)

# System state memory store
system_state = {
    "system_id": "SIH26030",
    "state": "READY",          # READY, CALIBRATING, FEEDING, CLAMPING, CUTTING, VERIFYING, EJECTING, EMERGENCY_STOP
    "progress": 0,
    "controller": "ESP32",     # 'ESP32' or 'PLC'
    "cable_od_mm": 12.0,
    "specimen_length_mm": 50.0,
    "test_method": "Insulation Thickness",
    "cut_depth_mm": 0.0,
    "encoder_pulses": 0,
    "start_time": None,
    "cycle_duration": 0.0,
    
    # Mode-specific telemetry profiles
    "telemetry": {
        "esp32": {
            "bus": "UART/Serial (115200 baud)",
            "protocol": "Non-blocking C++ FSM",
            "core0_load_pct": 14,
            "core1_load_pct": 28,
            "raw_adc_mv": 1584,
            "feed_velocity_mms": 22.5,
            "safety_isr": "GPIO 27 Active-Low (<50 ms)",
            "cycle_target_sec": 12.5
        },
        "plc": {
            "bus": "Modbus TCP/IP (Port 502)",
            "protocol": "IEC 61131-3 Ladder Logic",
            "scan_cycle_ms": 2.1,
            "holding_registers": "%MW100-%MW114",
            "servo_bus": "CanOpen / EtherCAT",
            "feed_velocity_mms": 55.0,
            "safety_relay": "Dual-Channel Cat-4 SIL-3",
            "cycle_target_sec": 5.2
        }
    }
}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/status")
def status():
    # If cycle running, compute real-time simulation progress
    if system_state["state"] not in ["READY", "EMERGENCY_STOP", "COMPLETED"]:
        elapsed = time.time() - (system_state["start_time"] or time.time())
        target = system_state["telemetry"][system_state["controller"].lower()]["cycle_target_sec"]
        progress = min(100, int((elapsed / target) * 100))
        system_state["progress"] = progress
        
        # State transitions based on progress
        if progress < 15:
            system_state["state"] = "CALIBRATING"
            system_state["encoder_pulses"] = int(progress * 15)
        elif progress < 45:
            system_state["state"] = "FEEDING"
            system_state["encoder_pulses"] = int(progress * 42)
        elif progress < 60:
            system_state["state"] = "CLAMPING"
        elif progress < 85:
            system_state["state"] = "CUTTING"
            # Target cut depth calculated from insulation recipe (OD - conductor core clearance)
            system_state["cut_depth_mm"] = round(system_state["cable_od_mm"] * 0.18, 2)
        elif progress < 95:
            system_state["state"] = "VERIFYING"
        elif progress < 100:
            system_state["state"] = "EJECTING"
        else:
            system_state["state"] = "COMPLETED"
            system_state["progress"] = 100

    active_ctrl = system_state["controller"].lower()
    return jsonify({
        "system": system_state["system_id"],
        "state": system_state["state"],
        "progress": system_state["progress"],
        "controller": system_state["controller"],
        "cable_diameter_mm": system_state["cable_od_mm"],
        "specimen_length_mm": system_state["specimen_length_mm"],
        "test_method": system_state["test_method"],
        "cut_depth_mm": system_state["cut_depth_mm"],
        "encoder_pulses": system_state["encoder_pulses"],
        "diagnostics": system_state["telemetry"][active_ctrl]
    })

@app.route("/api/configure", methods=["POST"])
def configure():
    data = request.get_json() or {}
    ctrl = data.get("controller", "ESP32").upper()
    if "PLC" in ctrl:
        system_state["controller"] = "PLC"
    else:
        system_state["controller"] = "ESP32"

    system_state["cable_od_mm"] = float(data.get("diameter", 12.0))
    system_state["specimen_length_mm"] = float(data.get("length", 50.0))
    system_state["test_method"] = data.get("test_method", "Insulation Thickness")
    
    return jsonify({
        "status": "CONFIGURED",
        "controller": system_state["controller"],
        "diagnostics": system_state["telemetry"][system_state["controller"].lower()]
    })

@app.route("/api/start", methods=["POST"])
def start_process():
    if system_state["state"] == "EMERGENCY_STOP":
        return jsonify({"status": "ERROR", "message": "Clear E-Stop before starting"}), 400
        
    data = request.get_json() or {}
    ctrl = data.get("controller", system_state["controller"]).upper()
    system_state["controller"] = "PLC" if "PLC" in ctrl else "ESP32"
    system_state["cable_od_mm"] = float(data.get("diameter", system_state["cable_od_mm"]))
    system_state["specimen_length_mm"] = float(data.get("length", system_state["specimen_length_mm"]))
    system_state["test_method"] = data.get("test_method", system_state["test_method"])
    
    system_state["state"] = "CALIBRATING"
    system_state["progress"] = 0
    system_state["encoder_pulses"] = 0
    system_state["cut_depth_mm"] = 0.0
    system_state["start_time"] = time.time()
    
    return jsonify({"status": "STARTED", "controller": system_state["controller"]})

@app.route("/api/emergency_stop", methods=["POST"])
def emergency_stop():
    system_state["state"] = "EMERGENCY_STOP"
    system_state["progress"] = 0
    system_state["cut_depth_mm"] = 0.0
    return jsonify({
        "status": "HALTED",
        "message": "Actuators cut off. Blade retracted within safety window."
    })

@app.route("/api/reset", methods=["POST"])
def reset():
    system_state["state"] = "READY"
    system_state["progress"] = 0
    system_state["encoder_pulses"] = 0
    system_state["cut_depth_mm"] = 0.0
    system_state["start_time"] = None
    return jsonify({"status": "RESET", "state": "READY"})

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5001
    )