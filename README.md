# Interactive 3D Prototype — Praktikum Grafika Komputer Pertemuan 7

**Mata kuliah:** EF234504 — Grafika Komputer  
**Topik:** Three.js Interactive 3D Application  
**Nama / NRP:** Mario Napitupulu / 5025241085  
**Anggota:** Nathanael Oliver Amadhika Yuswana / 5025241109

## Deskripsi

Prototype ini mengembangkan scene Three.js menjadi aplikasi 3D interaktif. Scene memperlihatkan hierarchy parent-child, transformasi lokal dan world, material PBR, model GLB bebek, clip animasi runtime, skybox/panorama, refleksi environment, shadow, OrbitControls, pergantian kamera, dan pemilihan objek melalui raycasting.

## Isi scene dan hierarchy

```text
Scene
├── HemisphereLight + DirectionalLight
├── Ground + Grid
├── Hierarchy Demo Group (THREE.Group)
│   └── Parent Body
│       └── Child Object
├── PBR Sphere
├── PBR Material Gallery (3 × 3)
└── Imported GLB · Rubber Duck
    └── model hierarchy from Poly Pizza
```

`Hierarchy Demo Group` ditransform dan berputar, sementara Child Object mempertahankan posisi lokalnya terhadap Parent Body. Panel informasi menunjukkan transform entity terpilih. Demo GLB juga memuat node bertingkat; semua mesh yang ditemukan dengan `traverse()` menerima dan melempar shadow.

## Aset dan animasi

- `public/models/model.glb` adalah model **Rubber Duck** dari CreativeTrio di Poly Pizza, lisensi CC0 / public domain ([sumber aset](https://poly.pizza/m/oH3dEdlDpB)).
- Model bebek tidak menyertakan clip animasi. Tiga pilihan clip aplikasi (**Float**, **Turn**, dan **Nod**) dibuat melalui `AnimationMixer` saat runtime; tombol 1/2/3 dan klik bebek menjalankan clip.
- Untuk mengganti model dengan asset sendiri, letakkan file bernama `model.glb` di `public/models/`. Loader membaca clip yang tersedia pada GLB.
- Pilihan **Skybox / Panorama** berisi panorama procedural, **Studio Small 09** (pilihan awal), dan **Studio Small 03**. Dua HDRI 1K Poly Haven berlisensi CC0 ([Studio Small 09](https://polyhaven.com/a/studio_small_09), [Studio Small 03](https://polyhaven.com/a/studio_small_03)); panorama procedural dibuat runtime dengan CanvasTexture. Panorama mengatur `scene.background`, sedangkan tombol Refleksi mengatur `scene.environment`; `RoomEnvironment` menjadi fallback pencahayaan refleksi.

## PBR dan interaksi

- Sphere utama memakai `MeshStandardMaterial`; slider Roughness dan Metalness mengubah material secara langsung.
- Gallery 3 × 3 membandingkan roughness **0.12 / 0.50 / 0.88** dengan metalness **0 / 0.5 / 1**.
- Hover memberi umpan balik skala sementara. Klik menyimpan selection, memperbesar objek, dan mengisi panel posisi, rotasi, skala, serta material.
- Raycaster menggunakan koordinat pointer NDC dari bounding box canvas dan recursive intersection untuk menemukan root entity GLB.
- Gerakan pointer di atas 5 piksel dianggap drag, sehingga mengorbit kamera tidak memilih objek.
- Pergantian Perspective/Orthographic Camera mempertahankan posisi dan target; reset mengembalikan Perspective Camera dan target awal.
- Panel kamera mengatur pilihan proyeksi, FOV, OrbitControls, pan, damping, kecepatan orbit, dan zoom.
- Slider lighting mengatur intensitas DirectionalLight/HemisphereLight; slider Reflection Intensity mengubah kekuatan environment map.
- Bloom dapat diaktifkan dan dikalibrasi dengan slider intensity/radius. Slider emissive mengatur glow sphere PBR.
- Tombol Gallery menyembunyikan/menampilkan gallery PBR; tombol Solar menampilkan sistem orbit Sun-Earth-Moon berbasis hierarchy.
- Environment dapat dibandingkan ON/OFF melalui tombol panel atau tombol **E**.
- Tombol cepat menyediakan Panorama (P), Bloom, Refleksi (E), Reset (R), Clip 1/2/3, dan Solar (S). Refleksi environment dapat tetap aktif saat skybox/panorama dimatikan.

## Challenge

1. **PBR Material Gallery:** sembilan sampel memetakan kombinasi roughness dan metalness.
2. **Camera Switch:** tombol kamera atau **C** berganti Perspective/Orthographic sambil mempertahankan sudut pandang dan target.
3. **Environment Toggle:** tombol **E** mengaktifkan atau mematikan pencahayaan environment untuk membandingkan respons material metal.
4. **Selection Rotation:** objek mesh yang dipilih berputar perlahan selama selected.
5. **Click Animation:** klik bebek menjalankan kembali clip animasi aktif.
6. **Information Panel:** selection menampilkan posisi, rotasi, skala, dan jenis material.
7. **Solar System:** Sun, Earth Orbit, Earth, Moon Orbit, dan Moon disusun bertingkat dan bergerak dengan delta time.
8. **Bloom:** UnrealBloomPass dan emissive dapat diatur dari panel controls.

## Cara menjalankan

Pastikan Node.js dan npm tersedia. Dari folder `Praktikum 7` jalankan:

```bash
npm install
npm run dev
```

Buka URL lokal yang ditampilkan Vite. Jangan membuka `index.html` langsung; module `three` dan addon perlu dilayani oleh Vite.

Build production:

```bash
npm run build
npm run preview
```

Di PowerShell, gunakan `npm.cmd` jika execution policy memblokir `npm.ps1`.

## Kontrol

| Input | Fungsi |
|---|---|
| Drag kiri | Orbit kamera |
| Scroll | Zoom |
| Drag kanan | Pan |
| Klik objek | Pilih / lihat informasi |
| **P** | Toggle skybox/panorama |
| **C** | Ganti kamera |
| **R** | Reset kamera |
| **E** | Toggle refleksi environment |
| **S** | Toggle solar system |
| **1 / 2 / 3** | Jalankan clip bebek |
| Pilihan kamera | Perspective atau Orthographic |
| Slider FOV | Mengubah sudut pandang Perspective Camera |
| Orbit controls | Mengaktifkan kamera, pan, damping, damping factor, rotate speed, dan zoom speed |
| Lighting | Mengubah intensitas directional dan ambient light |
| Skybox / Panorama | Memilih panorama procedural, Studio Small 09, atau Studio Small 03 |
| Refleksi | Menyalakan/mematikan `scene.environment` dan mengubah kekuatan refleksinya |
| Scene Tools | Toggle bloom/gallery/solar system dan replay animasi GLB |
| Emissive / Bloom | Mengubah intensitas emissive sphere, kekuatan dan radius bloom |

## Catatan debugging

- Jika model tidak muncul, periksa keberadaan `public/models/model.glb`, URL `/models/model.glb`, dan pesan Console.
- Jika animation tidak bergerak, pastikan GLB menyediakan clip, `AnimationMixer` dan `clipAction()` dibuat, serta `mixer.update(delta)` berjalan di loop.
- Jika shadow GLB tidak terlihat, cek `renderer.shadowMap.enabled`, `DirectionalLight.castShadow`, dan flag shadow mesh.
- Jika selection tidak mengenai GLB, pastikan pointer NDC dihitung terhadap canvas dan intersection memakai mode recursive.
- Jika material metal terlihat gelap, aktifkan kembali environment dan pastikan pencahayaan scene menyala.

## Refleksi

Scene Graph memudahkan pengelolaan objek kompleks karena bagian-bagiannya dapat disusun sebagai parent dan child. Posisi lokal child dinyatakan relatif terhadap parent, sementara posisi world merupakan hasil komposisi transformasi seluruh hierarchy. Roughness mengubah ketajaman pantulan dan metalness mengubah sifat permukaan terhadap cahaya serta environment. GLB dimuat secara asynchronous dan perlu ditelusuri karena isinya dapat terdiri atas banyak mesh dan node. AnimationMixer mengelola clip, sedangkan `mixer.update(delta)` memajukan waktunya setiap frame. Pointer layar dikonversi ke NDC sebelum raycaster menguji objek di scene. Hover bersifat sementara, sementara click menyimpan selection dan menampilkan feedback yang tetap. Environment memberi sumber pantulan yang membantu material PBR, terutama permukaan metal.

## Struktur project

```text
Praktikum 7/
├── index.html
├── package.json
├── package-lock.json
├── public/
│   ├── models/
│   │   └── model.glb
│   └── environment/
│       ├── studio_small_09_1k.hdr
│       └── studio_small_03_1k.hdr
├── src/
│   ├── main.js
│   └── style.css
├── README.md
└── screenshot.png
README.md
```

Screenshot scene tersimpan sebagai `screenshot.png`.
