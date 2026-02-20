#!/usr/bin/env python3
"""
kinect_bridge.py  –  MoCap Studio Kinect Bridge
================================================
Reads skeletal data from a Kinect v1 or Kinect v2 sensor and
streams it to the MoCap Studio web app via WebSocket.

Usage
-----
    python kinect_bridge.py --device 1          # Kinect v1
    python kinect_bridge.py --device 2          # Kinect v2 (default)
    python kinect_bridge.py --device 2 --host localhost --port 5001

Requirements
------------
  Kinect v1:
    pip install pykinect websocket-client

  Kinect v2:
    pip install pykinect2 comtypes websocket-client

Windows only (Kinect SDK is not available on Linux/macOS).
"""

import argparse
import json
import sys
import time
import threading
import traceback

try:
    import websocket
except ImportError:
    sys.exit("Please install:  pip install websocket-client")


# ─────────────────────────────────────────────────────────────
# Joint name maps
# ─────────────────────────────────────────────────────────────

KINECT_V1_JOINTS = [
    "HipCenter", "Spine", "ShoulderCenter", "Head",
    "ShoulderLeft", "ElbowLeft", "WristLeft", "HandLeft",
    "ShoulderRight", "ElbowRight", "WristRight", "HandRight",
    "HipLeft", "KneeLeft", "AnkleLeft", "FootLeft",
    "HipRight", "KneeRight", "AnkleRight", "FootRight",
]

KINECT_V2_JOINTS = [
    "SpineBase", "SpineMid", "Neck", "Head",
    "ShoulderLeft", "ElbowLeft", "WristLeft", "HandLeft",
    "ShoulderRight", "ElbowRight", "WristRight", "HandRight",
    "HipLeft", "KneeLeft", "AnkleLeft", "FootLeft",
    "HipRight", "KneeRight", "AnkleRight", "FootRight",
    "SpineShoulder", "HandTipLeft", "ThumbLeft", "HandTipRight", "ThumbRight",
]

# Tracking state integers (v2)
TRACKING_STATE = {0: "NotTracked", 1: "Inferred", 2: "Tracked"}


# ─────────────────────────────────────────────────────────────
# Kinect v1 reader (requires pykinect + Kinect SDK 1.8)
# ─────────────────────────────────────────────────────────────
class KinectV1Reader:
    def __init__(self):
        try:
            import pykinect
            from pykinect import nui
            self.nui = nui
        except ImportError:
            sys.exit(
                "Kinect v1 requires:  pip install pykinect\n"
                "and Microsoft Kinect SDK 1.8 installed."
            )
        self.kinect = None
        self.latest_joints = {}
        self._lock = threading.Lock()

    def start(self):
        self.kinect = self.nui.Runtime()
        self.kinect.skeleton_engine.enabled = True
        self.kinect.skeleton_frame_ready += self._on_frame

    def _on_frame(self, frame):
        for skeleton in frame.SkeletonData:
            if skeleton.eTrackingState != self.nui.SkeletonTrackingState.TRACKED:
                continue
            joints = {}
            for i, name in enumerate(KINECT_V1_JOINTS):
                j = skeleton.SkeletonPositions[i]
                joints[name] = {"x": j.x, "y": j.y, "z": j.z, "state": "Tracked"}
            with self._lock:
                self.latest_joints = joints
            break  # use first tracked skeleton

    def get_joints(self):
        with self._lock:
            return dict(self.latest_joints)

    def stop(self):
        if self.kinect:
            self.kinect.close()


# ─────────────────────────────────────────────────────────────
# Kinect v2 reader (requires pykinect2 + Kinect SDK 2.0)
# ─────────────────────────────────────────────────────────────
class KinectV2Reader:
    def __init__(self):
        try:
            from pykinect2 import PyKinectV2, PyKinectRuntime
            self.PyKinectV2 = PyKinectV2
            self.PyKinectRuntime = PyKinectRuntime
        except ImportError:
            sys.exit(
                "Kinect v2 requires:  pip install pykinect2 comtypes\n"
                "and Microsoft Kinect for Windows SDK 2.0 installed."
            )
        self.kinect = None
        self.latest_joints = {}
        self._lock = threading.Lock()

    def start(self):
        self.kinect = self.PyKinectRuntime.PyKinectRuntime(
            self.PyKinectV2.FrameSourceTypes_Body
        )

    def get_joints(self):
        if not self.kinect or not self.kinect.has_new_body_frame():
            with self._lock:
                return dict(self.latest_joints)

        bodies = self.kinect.get_last_body_frame()
        if not bodies:
            return {}

        for i in range(self.PyKinectV2.PyKinectV2.NUI_SKELETON_COUNT):
            body = bodies.bodies[i]
            if not body.is_tracked:
                continue
            joints = {}
            for idx, name in enumerate(KINECT_V2_JOINTS):
                j = body.joints[idx]
                pos = j.Position
                state = TRACKING_STATE.get(j.TrackingState, "Unknown")
                joints[name] = {
                    "x": pos.x, "y": pos.y, "z": pos.z, "state": state
                }
            with self._lock:
                self.latest_joints = joints
            return joints  # first tracked body

        return {}

    def stop(self):
        if self.kinect:
            self.kinect.close()


# ─────────────────────────────────────────────────────────────
# Simulated reader – used for testing without real hardware
# ─────────────────────────────────────────────────────────────
class SimulatedReader:
    """
    Generates synthetic walking-like joint data so you can test
    the full pipeline without physical Kinect hardware.
    """
    def __init__(self, device_version=2):
        self.version = device_version
        self.t = 0.0

    def start(self):
        print("[Simulated] No Kinect hardware found – using synthetic data.")

    def get_joints(self):
        import math
        t = self.t
        self.t += 0.033  # ~30 fps

        if self.version == 2:
            return {
                "SpineBase":      {"x": 0.0,              "y": 0.0,             "z": 2.0, "state": "Tracked"},
                "SpineMid":       {"x": 0.0,              "y": 0.25,            "z": 2.0, "state": "Tracked"},
                "SpineShoulder":  {"x": 0.0,              "y": 0.45,            "z": 2.0, "state": "Tracked"},
                "Neck":           {"x": 0.0,              "y": 0.55,            "z": 2.0, "state": "Tracked"},
                "Head":           {"x": 0.0,              "y": 0.7,             "z": 2.0, "state": "Tracked"},
                "ShoulderLeft":   {"x":  0.2,             "y": 0.45,            "z": 2.0, "state": "Tracked"},
                "ElbowLeft":      {"x":  0.35,            "y": 0.35 + 0.05 * math.sin(t), "z": 2.0, "state": "Tracked"},
                "WristLeft":      {"x":  0.45,            "y": 0.2  + 0.08 * math.sin(t), "z": 2.0, "state": "Tracked"},
                "HandLeft":       {"x":  0.48,            "y": 0.18 + 0.08 * math.sin(t), "z": 2.0, "state": "Tracked"},
                "ShoulderRight":  {"x": -0.2,             "y": 0.45,            "z": 2.0, "state": "Tracked"},
                "ElbowRight":     {"x": -0.35,            "y": 0.35 - 0.05 * math.sin(t), "z": 2.0, "state": "Tracked"},
                "WristRight":     {"x": -0.45,            "y": 0.2  - 0.08 * math.sin(t), "z": 2.0, "state": "Tracked"},
                "HandRight":      {"x": -0.48,            "y": 0.18 - 0.08 * math.sin(t), "z": 2.0, "state": "Tracked"},
                "HipLeft":        {"x":  0.1,             "y": -0.1,            "z": 2.0, "state": "Tracked"},
                "KneeLeft":       {"x":  0.1,             "y": -0.35 + 0.05 * math.sin(t * 2), "z": 2.0, "state": "Tracked"},
                "AnkleLeft":      {"x":  0.1,             "y": -0.65,           "z": 2.0, "state": "Tracked"},
                "FootLeft":       {"x":  0.1,             "y": -0.7,            "z": 2.1, "state": "Tracked"},
                "HipRight":       {"x": -0.1,             "y": -0.1,            "z": 2.0, "state": "Tracked"},
                "KneeRight":      {"x": -0.1,             "y": -0.35 - 0.05 * math.sin(t * 2), "z": 2.0, "state": "Tracked"},
                "AnkleRight":     {"x": -0.1,             "y": -0.65,           "z": 2.0, "state": "Tracked"},
                "FootRight":      {"x": -0.1,             "y": -0.7,            "z": 2.1, "state": "Tracked"},
                "HandTipLeft":    {"x":  0.5,             "y": 0.17 + 0.08 * math.sin(t), "z": 2.0, "state": "Inferred"},
                "ThumbLeft":      {"x":  0.47,            "y": 0.20 + 0.08 * math.sin(t), "z": 1.98, "state": "Inferred"},
                "HandTipRight":   {"x": -0.5,             "y": 0.17 - 0.08 * math.sin(t), "z": 2.0, "state": "Inferred"},
                "ThumbRight":     {"x": -0.47,            "y": 0.20 - 0.08 * math.sin(t), "z": 1.98, "state": "Inferred"},
            }
        else:
            # v1 simplified
            return {
                "HipCenter":      {"x": 0.0,  "y": 0.0,  "z": 2.0, "state": "Tracked"},
                "Spine":          {"x": 0.0,  "y": 0.2,  "z": 2.0, "state": "Tracked"},
                "ShoulderCenter": {"x": 0.0,  "y": 0.45, "z": 2.0, "state": "Tracked"},
                "Head":           {"x": 0.0,  "y": 0.65, "z": 2.0, "state": "Tracked"},
                "ShoulderLeft":   {"x":  0.2, "y": 0.45, "z": 2.0, "state": "Tracked"},
                "ElbowLeft":      {"x":  0.35,"y": 0.3,  "z": 2.0, "state": "Tracked"},
                "WristLeft":      {"x":  0.45,"y": 0.15, "z": 2.0, "state": "Tracked"},
                "HandLeft":       {"x":  0.48,"y": 0.12, "z": 2.0, "state": "Tracked"},
                "ShoulderRight":  {"x": -0.2, "y": 0.45, "z": 2.0, "state": "Tracked"},
                "ElbowRight":     {"x": -0.35,"y": 0.3,  "z": 2.0, "state": "Tracked"},
                "WristRight":     {"x": -0.45,"y": 0.15, "z": 2.0, "state": "Tracked"},
                "HandRight":      {"x": -0.48,"y": 0.12, "z": 2.0, "state": "Tracked"},
                "HipLeft":        {"x":  0.1, "y": -0.1, "z": 2.0, "state": "Tracked"},
                "KneeLeft":       {"x":  0.1, "y": -0.4, "z": 2.0, "state": "Tracked"},
                "AnkleLeft":      {"x":  0.1, "y": -0.65,"z": 2.0, "state": "Tracked"},
                "FootLeft":       {"x":  0.12,"y": -0.7, "z": 2.1, "state": "Tracked"},
                "HipRight":       {"x": -0.1, "y": -0.1, "z": 2.0, "state": "Tracked"},
                "KneeRight":      {"x": -0.1, "y": -0.4, "z": 2.0, "state": "Tracked"},
                "AnkleRight":     {"x": -0.1, "y": -0.65,"z": 2.0, "state": "Tracked"},
                "FootRight":      {"x": -0.12,"y": -0.7, "z": 2.1, "state": "Tracked"},
            }

    def stop(self):
        pass


# ─────────────────────────────────────────────────────────────
# WebSocket client + streaming loop
# ─────────────────────────────────────────────────────────────
class BridgeClient:
    def __init__(self, reader, host, port, device_version, simulate):
        self.reader         = reader
        self.url            = f"ws://{host}:{port}?role=kinect-bridge&device=kinect{device_version}"
        self.device_version = device_version
        self.simulate       = simulate
        self.ws             = None
        self.session_id     = None
        self.running        = False

    def _on_open(self, ws):
        print(f"[Bridge] Connected to MoCap Studio at {self.url}")
        ws.send(json.dumps({
            "type": "bridge:hello",
            "data": {"device": f"kinect{self.device_version}"}
        }))

    def _on_message(self, ws, message):
        msg = json.loads(message)
        if msg.get("type") == "bridge:welcome":
            print(f"[Bridge] Server acknowledged device: {msg.get('device')}")
        elif msg.get("type") == "session:started":
            self.session_id = msg.get("sessionId")
            print(f"[Bridge] Recording session started: {self.session_id}")

    def _on_error(self, ws, error):
        print(f"[Bridge] WebSocket error: {error}")

    def _on_close(self, ws, code, reason):
        self.running = False
        print(f"[Bridge] Disconnected (code={code})")

    def _stream_loop(self):
        """Send joint frames at ~30 fps while connected."""
        while self.running and self.ws:
            try:
                joints = self.reader.get_joints()
                if joints:
                    msg = json.dumps({
                        "type":      "frame",
                        "sessionId": self.session_id,
                        "data":      {"t": int(time.time() * 1000), "joints": joints}
                    })
                    self.ws.send(msg)
            except Exception as exc:
                print(f"[Bridge] Stream error: {exc}")
                break
            time.sleep(1 / 30)

    def run(self):
        self.running = True
        ws_app = websocket.WebSocketApp(
            self.url,
            on_open    = self._on_open,
            on_message = self._on_message,
            on_error   = self._on_error,
            on_close   = self._on_close
        )
        self.ws = ws_app

        # Start streaming in a background thread once WS opens
        def on_open_with_thread(ws):
            self._on_open(ws)
            t = threading.Thread(target=self._stream_loop, daemon=True)
            t.start()

        ws_app.on_open = on_open_with_thread

        print(f"[Bridge] Connecting to {self.url} ...")
        while self.running:
            try:
                ws_app.run_forever(reconnect=5)
            except KeyboardInterrupt:
                self.running = False
                break
            except Exception:
                traceback.print_exc()
                time.sleep(3)

        print("[Bridge] Stopped.")

    def stop(self):
        self.running = False
        if self.ws:
            self.ws.close()


# ─────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="MoCap Studio – Kinect Bridge")
    parser.add_argument("--device",   type=int, default=2,          help="Kinect version: 1 or 2 (default: 2)")
    parser.add_argument("--host",     default="localhost",           help="MoCap Studio server host (default: localhost)")
    parser.add_argument("--port",     type=int, default=5001,        help="WebSocket port (default: 5001)")
    parser.add_argument("--simulate", action="store_true",           help="Use simulated data (no hardware needed)")
    args = parser.parse_args()

    if args.device not in (1, 2):
        sys.exit("--device must be 1 or 2")

    # Try to create the real reader; fall back to simulation
    reader = None
    if not args.simulate:
        try:
            reader = KinectV1Reader() if args.device == 1 else KinectV2Reader()
            reader.start()
            print(f"[Bridge] Kinect v{args.device} initialised.")
        except SystemExit:
            raise
        except Exception as exc:
            print(f"[Bridge] Could not initialise Kinect v{args.device}: {exc}")
            print("[Bridge] Falling back to simulated data.")
            reader = SimulatedReader(args.device)
            reader.start()
    else:
        reader = SimulatedReader(args.device)
        reader.start()

    client = BridgeClient(reader, args.host, args.port, args.device, args.simulate)
    try:
        client.run()
    except KeyboardInterrupt:
        pass
    finally:
        client.stop()
        reader.stop()


if __name__ == "__main__":
    main()
