# MoCap Studio

Professional motion capture from **webcam**, **Kinect v1**, and **Kinect v2**.
Inspired by [iPi Soft](https://www.ipisoft.com/) — off-the-shelf cameras, full-body tracking, BVH export.

---

## Features

| Feature | Webcam | Kinect v1 | Kinect v2 |
|---|---|---|---|
| Full-body tracking | MediaPipe Pose (33 pts) | 20 joints | 25 joints |
| Depth sensor | No | Yes | Yes (HD) |
| OS requirement | Any (browser) | Windows | Windows |
| Real-time 3D preview | Yes | Yes | Yes |
| BVH export | Yes | Yes | Yes |
| JSON export | Yes | Yes | Yes |
| Recording sessions | Yes | Yes | Yes |

---

## Quick Start

### 1. Install dependencies

```bash
npm run install-all
```

### 2. Start the server

```bash
npm start
```

Open **http://localhost:5000**

### 3. For development (hot reload)

```bash
npm run dev
```

---

## Kinect Setup (Windows only)

### Kinect v1

1. Install [Kinect SDK 1.8](https://www.microsoft.com/en-us/download/details.aspx?id=40278)
2. Plug in Kinect v1 sensor
3. Install Python bridge dependencies:
   ```
   pip install pykinect websocket-client
   ```
4. Run the bridge:
   ```
   python bridge/kinect_bridge.py --device 1
   ```

### Kinect v2

1. Install [Kinect for Windows SDK 2.0](https://www.microsoft.com/en-us/download/details.aspx?id=44561)
2. Plug in Kinect v2 sensor via **USB 3.0**
3. Install Python bridge dependencies:
   ```
   pip install pykinect2 comtypes websocket-client
   ```
4. Run the bridge:
   ```
   python bridge/kinect_bridge.py --device 2
   ```

### Test without hardware (simulation mode)

```bash
python bridge/kinect_bridge.py --device 2 --simulate
```

---

## Project Structure

```
mocap-studio/
├── server/
│   └── index.js          # Express API + WebSocket server
├── client/
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── LiveCapture.js      # Main capture UI
│       │   ├── SkeletonOverlay.js  # 2D canvas overlay
│       │   ├── Skeleton3DViewer.js # Three.js 3D view
│       │   └── InfoPanel.js        # Setup guide
│       └── utils/
│           ├── PoseDetector.js     # MediaPipe wrapper
│           ├── KinectMapper.js     # Kinect joint normaliser
│           └── BVHExporter.js      # BVH/JSON exporter
├── bridge/
│   ├── kinect_bridge.py  # Python Kinect bridge
│   └── requirements.txt
└── package.json
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status + WS info |
| GET | `/api/recordings` | List saved recordings |
| POST | `/api/recordings` | Save a recording from browser |
| GET | `/api/recordings/:id` | Get recording with frames |
| DELETE | `/api/recordings/:id` | Delete recording |
| GET | `/api/recordings/:id/bvh` | Download as BVH |
| GET | `/api/recordings/:id/json` | Download as JSON |

### WebSocket (`ws://localhost:5001`)

**Browser client** connects with `?role=browser`.
**Kinect bridge** connects with `?role=kinect-bridge&device=kinect2`.

Messages: `session:start` / `frame` / `session:stop` / `bridge:hello`

---

## Export Formats

### BVH (BioVision Hierarchy)
Standard motion capture format. Compatible with:
- Blender, Maya, 3ds Max, MotionBuilder
- Unity, Unreal Engine
- iPi Mocap Studio, iClone

### JSON
Raw joint data: `{ fps, frames: [{ t, joints: { name: {x,y,z,rx,ry,rz} } }] }`

---

## Technology Stack

- **Frontend**: React 18, Three.js, @react-three/fiber, @react-three/drei
- **Pose AI**: MediaPipe Pose (Google) — runs in browser, no server calls
- **Backend**: Node.js, Express, WebSocket (ws)
- **Kinect bridge**: Python, pykinect / pykinect2, websocket-client

---

## License

MIT
