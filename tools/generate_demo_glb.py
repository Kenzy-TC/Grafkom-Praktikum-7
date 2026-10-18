"""Create the small, animated Astra Beacon GLB shipped with this practicum."""

import json
import math
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "models" / "model.glb"

# Six independent faces keep the beacon's box normals flat and crisp.
faces = [
    ((0, 0, 1), [(-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]),
    ((0, 0, -1), [(1, -1, -1), (-1, -1, -1), (-1, 1, -1), (1, 1, -1)]),
    ((1, 0, 0), [(1, -1, 1), (1, -1, -1), (1, 1, -1), (1, 1, 1)]),
    ((-1, 0, 0), [(-1, -1, -1), (-1, -1, 1), (-1, 1, 1), (-1, 1, -1)]),
    ((0, 1, 0), [(-1, 1, 1), (1, 1, 1), (1, 1, -1), (-1, 1, -1)]),
    ((0, -1, 0), [(-1, -1, -1), (1, -1, -1), (1, -1, 1), (-1, -1, 1)]),
]
positions, normals, indices = [], [], []
for normal, corners in faces:
    offset = len(positions) // 3
    for point in corners:
        positions.extend(point)
        normals.extend(normal)
    indices.extend((offset, offset + 1, offset + 2, offset, offset + 2, offset + 3))

binary = bytearray()
views, accessors = [], []


def add_view(data, target=None):
    while len(binary) % 4:
        binary.append(0)
    offset = len(binary)
    binary.extend(data)
    view = {"buffer": 0, "byteOffset": offset, "byteLength": len(data)}
    if target:
        view["target"] = target
    views.append(view)
    return len(views) - 1


def add_accessor(data, component_type, count, kind, target=None, minimum=None, maximum=None):
    view_index = add_view(data, target)
    accessor = {
        "bufferView": view_index,
        "componentType": component_type,
        "count": count,
        "type": kind,
    }
    if minimum is not None:
        accessor["min"] = minimum
    if maximum is not None:
        accessor["max"] = maximum
    accessors.append(accessor)
    return len(accessors) - 1


position_data = struct.pack(f"<{len(positions)}f", *positions)
normal_data = struct.pack(f"<{len(normals)}f", *normals)
index_data = struct.pack(f"<{len(indices)}H", *indices)
position_accessor = add_accessor(position_data, 5126, len(positions) // 3, "VEC3", 34962, [-1, -1, -1], [1, 1, 1])
normal_accessor = add_accessor(normal_data, 5126, len(normals) // 3, "VEC3", 34962)
index_accessor = add_accessor(index_data, 5123, len(indices), "SCALAR", 34963)

times = [0.0, 1.5, 3.0, 4.5, 6.0]
quaternions = []
for degrees in (0, 90, 180, 270, 360):
    angle = math.radians(degrees) / 2
    quaternions.extend((0.0, math.sin(angle), 0.0, math.cos(angle)))
time_accessor = add_accessor(struct.pack("<5f", *times), 5126, 5, "SCALAR", minimum=[0], maximum=[6])
rotation_accessor = add_accessor(struct.pack("<20f", *quaternions), 5126, 5, "VEC4")

gltf = {
    "asset": {"version": "2.0", "generator": "Praktikum Grafkom 7 Demo Asset"},
    "scene": 0,
    "scenes": [{"name": "Astra Beacon Scene", "nodes": [0]}],
    "nodes": [
        {"name": "Astra Beacon", "children": [1, 2, 3]},
        {"name": "Beacon Body", "mesh": 0, "translation": [0, 0.55, 0], "scale": [1.25, 0.65, 0.82]},
        {"name": "Beacon Crown", "mesh": 0, "translation": [0, 1.18, 0], "scale": [0.74, 0.12, 0.55]},
        {"name": "Rotating Signal", "children": [4], "translation": [0, 1.43, 0]},
        {"name": "Signal Bar", "mesh": 0, "translation": [0, 0.45, 0], "scale": [0.68, 0.09, 0.13]},
    ],
    "meshes": [{"name": "Beacon Box Parts", "primitives": [{
        "attributes": {"POSITION": position_accessor, "NORMAL": normal_accessor},
        "indices": index_accessor,
        "material": 0,
    }]}],
    "materials": [{
        "name": "Satin Blue Steel",
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.28, 0.46, 0.58, 1],
            "metallicFactor": 0.38,
            "roughnessFactor": 0.38,
        },
    }],
    "animations": [{
        "name": "Signal Rotation",
        "samplers": [{"input": time_accessor, "output": rotation_accessor, "interpolation": "LINEAR"}],
        "channels": [{"sampler": 0, "target": {"node": 3, "path": "rotation"}}],
    }],
    "buffers": [{"byteLength": len(binary)}],
    "bufferViews": views,
    "accessors": accessors,
}

json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
binary.extend(b"\0" * ((4 - len(binary) % 4) % 4))
total_length = 12 + 8 + len(json_bytes) + 8 + len(binary)
glb = bytearray(struct.pack("<4sII", b"glTF", 2, total_length))
glb.extend(struct.pack("<I4s", len(json_bytes), b"JSON"))
glb.extend(json_bytes)
glb.extend(struct.pack("<I4s", len(binary), b"BIN\0"))
glb.extend(binary)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_bytes(glb)
print(f"Wrote {OUTPUT} ({len(glb)} bytes)")
