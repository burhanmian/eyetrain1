# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Endpoints

### Health Check

#### `GET /api/health`
Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "EyeTrain1 API is running"
}
```

---

### Photo to 3D Conversion

#### `POST /api/upload-photo`
Upload a photo for 3D model conversion.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `photo`: Image file (JPEG, PNG, GIF, BMP)

**Example:**
```bash
curl -X POST http://localhost:5000/api/upload-photo \
  -F "photo=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Photo uploaded successfully. Converting to 3D model..."
}
```

#### `GET /api/job/:jobId`
Get the status of a conversion job.

**Parameters:**
- `jobId`: UUID of the conversion job

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "image.jpg",
  "originalName": "my-photo.jpg",
  "status": "processing",
  "progress": 65,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "type": "photo-to-3d"
}
```

**Status Values:**
- `processing`: Conversion in progress
- `completed`: Conversion finished
- `failed`: Conversion failed

---

### Model Management

#### `POST /api/upload-model`
Upload a 3D model for analysis and rigging.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `model`: 3D model file (FBX, OBJ, GLTF, GLB, DAE)

**Example:**
```bash
curl -X POST http://localhost:5000/api/upload-model \
  -F "model=@/path/to/model.fbx"
```

**Response:**
```json
{
  "success": true,
  "modelId": "660f9511-f39c-52e5-b827-557766551111",
  "message": "Model uploaded successfully. Analyzing for humanoid features..."
}
```

#### `GET /api/model/:modelId`
Get details about a specific model.

**Parameters:**
- `modelId`: UUID of the model

**Response:**
```json
{
  "id": "660f9511-f39c-52e5-b827-557766551111",
  "filename": "model.fbx",
  "originalName": "character.fbx",
  "status": "ready",
  "isHumanoid": true,
  "isRigged": true,
  "rigType": "UE4-Skeleton",
  "boneCount": 67,
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

#### `GET /api/models`
Get all user models.

**Response:**
```json
[
  {
    "id": "660f9511-f39c-52e5-b827-557766551111",
    "filename": "model.fbx",
    "originalName": "character.fbx",
    "status": "ready",
    "isHumanoid": true,
    "isRigged": true,
    "rigType": "UE4-Skeleton",
    "boneCount": 67,
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
]
```

#### `GET /api/default-models`
Get list of default Unreal Engine models.

**Response:**
```json
[
  {
    "id": "unreal-mannequin",
    "name": "UE Mannequin",
    "type": "humanoid",
    "isRigged": true,
    "format": "FBX",
    "description": "Standard Unreal Engine mannequin with full skeleton",
    "thumbnail": "/api/thumbnails/unreal-mannequin.png"
  }
]
```

---

### Motion Capture

#### `POST /api/upload-motion`
Upload motion capture data to apply to a rigged model.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `motion`: Motion file (BVH, FBX animation)
  - `modelId`: UUID of the target model

**Example:**
```bash
curl -X POST http://localhost:5000/api/upload-motion \
  -F "motion=@/path/to/animation.bvh" \
  -F "modelId=660f9511-f39c-52e5-b827-557766551111"
```

**Response:**
```json
{
  "success": true,
  "motionId": "770fa622-g40d-63f6-c938-668877662222",
  "message": "Motion data uploaded successfully. Applying to model..."
}
```

#### `GET /api/motion/:motionId`
Get details about motion capture data.

**Parameters:**
- `motionId`: UUID of the motion

**Response:**
```json
{
  "id": "770fa622-g40d-63f6-c938-668877662222",
  "modelId": "660f9511-f39c-52e5-b827-557766551111",
  "filename": "walk.bvh",
  "originalName": "walking-animation.bvh",
  "status": "completed",
  "duration": 5,
  "fps": 30,
  "frames": 150,
  "createdAt": "2024-01-15T10:40:00.000Z"
}
```

**Status Values:**
- `processing`: Validating motion data
- `validating`: Checking compatibility
- `applying`: Applying to model
- `completed`: Successfully applied
- `failed`: Application failed

#### `GET /api/model/:modelId/motions`
Get all motion captures for a specific model.

**Parameters:**
- `modelId`: UUID of the model

**Response:**
```json
[
  {
    "id": "770fa622-g40d-63f6-c938-668877662222",
    "modelId": "660f9511-f39c-52e5-b827-557766551111",
    "filename": "walk.bvh",
    "status": "completed",
    "duration": 5,
    "fps": 30,
    "frames": 150
  }
]
```

---

### Export

#### `POST /api/export`
Export a model with optional animation.

**Request:**
- Method: POST
- Content-Type: application/json
- Body:
```json
{
  "modelId": "660f9511-f39c-52e5-b827-557766551111",
  "motionId": "770fa622-g40d-63f6-c938-668877662222",
  "format": "FBX"
}
```

**Supported Formats:**
- FBX
- OBJ
- GLTF
- GLB
- DAE

**Response:**
```json
{
  "success": true,
  "exportId": "880gb733-h51e-74g7-d049-779988773333",
  "message": "Export started",
  "data": {
    "id": "880gb733-h51e-74g7-d049-779988773333",
    "modelId": "660f9511-f39c-52e5-b827-557766551111",
    "motionId": "770fa622-g40d-63f6-c938-668877662222",
    "format": "FBX",
    "status": "preparing",
    "createdAt": "2024-01-15T10:45:00.000Z"
  }
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## File Size Limits

- Maximum file size: 50 MB (configurable via `MAX_FILE_SIZE` env variable)

## Supported File Types

### Images (Photo Upload)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)

### 3D Models
- FBX (.fbx)
- OBJ (.obj)
- GLTF (.gltf)
- GLB (.glb)
- Collada (.dae)

### Motion Capture
- BVH (.bvh)
- FBX Animation (.fbx)

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## Authentication

Currently no authentication is required. For production deployment, implement proper authentication and authorization.
