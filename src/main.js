import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const mount = $('#canvasMount');
const hud = {
  hover: $('#hoverInfo'), selected: $('#selectedInfo'), animation: $('#animationInfo'),
  loading: $('#loadingInfo'), hint: $('#selectionHint'), details: $('#objectDetails'),
  position: $('#detailPosition'), rotation: $('#detailRotation'), scale: $('#detailScale'),
  material: $('#detailMaterial'),
};

// Scene, camera, renderer ------------------------------------------------------
const scene = new THREE.Scene();
const defaultBackground = new THREE.Color('#0b1020');
scene.background = defaultBackground;
const initialTarget = new THREE.Vector3(0, 0.75, 0);
const initialPosition = new THREE.Vector3(8.5, 6.2, 10.5);
let activeCamera;
let controls;
const orbitSettings = {
  enabled: true, pan: true, damping: true, dampingFactor: 0.075, rotateSpeed: 1, zoomSpeed: 1,
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(mount.clientWidth, mount.clientHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.domElement.setAttribute('aria-label', 'Interactive Three.js scene. Drag to orbit and click objects to select.');
renderer.domElement.tabIndex = 0;
mount.append(renderer.domElement);

const perspectiveCamera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
perspectiveCamera.position.copy(initialPosition);
const orthographicCamera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
orthographicCamera.position.copy(initialPosition);
scene.add(perspectiveCamera, orthographicCamera);
activeCamera = perspectiveCamera;

function attachControls(camera, target) {
  controls?.dispose();
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enabled = orbitSettings.enabled;
  controls.enablePan = orbitSettings.pan;
  controls.enableDamping = orbitSettings.damping;
  controls.dampingFactor = orbitSettings.dampingFactor;
  controls.rotateSpeed = orbitSettings.rotateSpeed;
  controls.zoomSpeed = orbitSettings.zoomSpeed;
  controls.minDistance = 3;
  controls.maxDistance = 25;
  controls.minZoom = 0.5;
  controls.maxZoom = 3;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.update();
  controls.saveState();
}
attachControls(activeCamera, initialTarget);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const renderPass = new RenderPass(scene, activeCamera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.16, 0.3, 1.05);
composer.addPass(renderPass);
composer.addPass(bloomPass);

function updateCameraLabel() {
  const isPerspective = activeCamera === perspectiveCamera;
  $('#cameraLabel').textContent = isPerspective ? 'PERSPECTIVE' : 'ORTHOGRAPHIC';
  $('#cameraToggle').textContent = isPerspective ? 'P' : 'O';
  $('#cameraSelect').value = isPerspective ? 'perspective' : 'orthographic';
  $('#fovControl').disabled = !isPerspective;
}
function switchCamera() {
  const position = activeCamera.position.clone();
  const target = controls.target.clone();
  activeCamera = activeCamera === perspectiveCamera ? orthographicCamera : perspectiveCamera;
  activeCamera.position.copy(position);
  activeCamera.lookAt(target);
  if (activeCamera.isOrthographicCamera) activeCamera.zoom = 1;
  activeCamera.updateProjectionMatrix();
  attachControls(activeCamera, target);
  renderPass.camera = activeCamera;
  updateCameraLabel();
}
function resetCamera() {
  activeCamera = perspectiveCamera;
  perspectiveCamera.position.copy(initialPosition);
  perspectiveCamera.fov = 48;
  perspectiveCamera.zoom = 1;
  perspectiveCamera.updateProjectionMatrix();
  $('#fovControl').value = '48';
  $('#fovValue').textContent = '48°';
  orthographicCamera.position.copy(initialPosition);
  orthographicCamera.zoom = 1;
  orthographicCamera.updateProjectionMatrix();
  attachControls(perspectiveCamera, initialTarget);
  renderPass.camera = perspectiveCamera;
  updateCameraLabel();
}
$('#cameraToggle').addEventListener('click', switchCamera);
$('#resetCamera').addEventListener('click', resetCamera);
$('#cameraSelect').addEventListener('change', (event) => {
  const requested = event.target.value === 'orthographic' ? orthographicCamera : perspectiveCamera;
  if (requested !== activeCamera) switchCamera();
});
$('#fovControl').addEventListener('input', (event) => {
  perspectiveCamera.fov = Number(event.target.value);
  perspectiveCamera.updateProjectionMatrix();
  $('#fovValue').textContent = `${perspectiveCamera.fov}°`;
});
function applyOrbitSettings() {
  if (!controls) return;
  controls.enabled = orbitSettings.enabled;
  controls.enablePan = orbitSettings.pan;
  controls.enableDamping = orbitSettings.damping;
  controls.dampingFactor = orbitSettings.dampingFactor;
  controls.rotateSpeed = orbitSettings.rotateSpeed;
  controls.zoomSpeed = orbitSettings.zoomSpeed;
}
$('#orbitEnabled').addEventListener('change', (event) => {
  orbitSettings.enabled = event.target.checked;
  applyOrbitSettings();
});
$('#panEnabled').addEventListener('change', (event) => {
  orbitSettings.pan = event.target.checked;
  applyOrbitSettings();
});
$('#dampingEnabled').addEventListener('change', (event) => {
  orbitSettings.damping = event.target.checked;
  applyOrbitSettings();
});
$('#dampingControl').addEventListener('input', (event) => {
  orbitSettings.dampingFactor = Number(event.target.value);
  $('#dampingValue').textContent = orbitSettings.dampingFactor.toFixed(3);
  applyOrbitSettings();
});
$('#rotateSpeedControl').addEventListener('input', (event) => {
  orbitSettings.rotateSpeed = Number(event.target.value);
  $('#rotateSpeedValue').textContent = `${orbitSettings.rotateSpeed.toFixed(2)}×`;
  applyOrbitSettings();
});
$('#zoomSpeedControl').addEventListener('input', (event) => {
  orbitSettings.zoomSpeed = Number(event.target.value);
  $('#zoomSpeedValue').textContent = `${orbitSettings.zoomSpeed.toFixed(2)}×`;
  applyOrbitSettings();
});

// Lighting, environment, and ground -------------------------------------------
// Hemisphere and directional light intensities remain editable from the HUD.
const keyLight = new THREE.DirectionalLight(0xfff8ed, 2.5);
keyLight.position.set(-4, 9, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 25;
keyLight.shadow.bias = -0.00015;
keyLight.shadow.normalBias = 0.025;
scene.add(keyLight, keyLight.target);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const roomEnvironmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
let environmentMap = roomEnvironmentMap;
scene.environment = environmentMap;
pmremGenerator.dispose();
let environmentEnabled = true;
let panoramaEnabled = true;
const panoramaAssets = new Map();
function createProceduralPanorama() {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 768;
  const context = canvas.getContext('2d');
  const sky = context.createLinearGradient(0, 0, 0, 768);
  sky.addColorStop(0, '#50677f');
  sky.addColorStop(0.42, '#aeb8c0');
  sky.addColorStop(0.52, '#e5ded3');
  sky.addColorStop(0.53, '#77746f');
  sky.addColorStop(1, '#383b40');
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);
  // Studio wall seams and broad softboxes are drawn directly into this generated panorama.
  context.strokeStyle = 'rgba(40, 49, 58, 0.22)';
  context.lineWidth = 5;
  [160, 480, 1056, 1376].forEach((x) => {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 405); context.stroke();
  });
  [[250, 145], [770, 105], [1290, 165]].forEach(([x, y]) => {
    const glow = context.createRadialGradient(x, y, 10, x, y, 135);
    glow.addColorStop(0, 'rgba(255,255,245,0.95)');
    glow.addColorStop(0.18, 'rgba(255,249,230,0.72)');
    glow.addColorStop(1, 'rgba(255,249,230,0)');
    context.fillStyle = glow;
    context.fillRect(x - 140, y - 140, 280, 280);
    context.fillStyle = 'rgba(255,255,246,0.72)';
    context.fillRect(x - 48, y - 24, 96, 48);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const proceduralPanorama = createProceduralPanorama();
panoramaAssets.set('procedural', {
  background: proceduralPanorama,
  environment: proceduralPanorama,
});
let selectedPanorama = 'studio09';
function selectPanorama(name) {
  selectedPanorama = name;
  $('#panoramaSelect').value = name;
  const panorama = panoramaAssets.get(name);
  if (!panorama) {
    const fallback = panoramaAssets.get('procedural');
    if (fallback && panoramaEnabled) scene.background = fallback.background;
    if (fallback && environmentEnabled) {
      environmentMap = fallback.environment;
      scene.environment = environmentMap;
    }
    $('#panoramaDescription').textContent = 'Memuat panorama…';
    return;
  }
  environmentMap = panorama.environment;
  if (environmentEnabled) scene.environment = environmentMap;
  if (panoramaEnabled) scene.background = panorama.background;
  $('#panoramaDescription').textContent = panorama.description;
}
const panoramaLoader = new HDRLoader();
[
  ['studio09', './environment/studio_small_09_1k.hdr', 'Studio Small 09 · softbox studio, CC0 · Poly Haven'],
  ['studio03', './environment/studio_small_03_1k.hdr', 'Studio Small 03 · high contrast studio, CC0 · Poly Haven'],
].forEach(([name, url, description]) => {
  panoramaLoader.load(url, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    panoramaAssets.set(name, { background: texture, environment: texture, description });
    if (name === selectedPanorama) selectPanorama(name);
  }, undefined, (error) => {
    console.warn(`Could not load ${name} panorama.`, error);
    if (name === selectedPanorama && panoramaAssets.has('procedural')) selectPanorama('procedural');
  });
});
panoramaAssets.get('procedural').description = 'Procedural · studio panorama generated from a canvas texture';
selectPanorama('studio09');
function setEnvironment(enabled) {
  environmentEnabled = enabled;
  scene.environment = enabled ? environmentMap : null;
  const button = $('#environmentToggle');
  button.classList.toggle('is-on', enabled);
  button.setAttribute('aria-pressed', String(enabled));
  $('#environmentState').textContent = enabled ? 'ON (E)' : 'OFF (E)';
}
$('#environmentToggle').addEventListener('click', () => setEnvironment(!environmentEnabled));
function setPanorama(enabled) {
  panoramaEnabled = enabled;
  scene.background = enabled ? (panoramaAssets.get(selectedPanorama)?.background || defaultBackground) : defaultBackground;
  const button = $('#panoramaToggle');
  const state = enabled ? 'ON (P)' : 'OFF (P)';
  button.classList.toggle('is-on', enabled);
  button.setAttribute('aria-pressed', String(enabled));
  $('#panoramaState').textContent = state;
}
$('#panoramaToggle').addEventListener('click', () => setPanorama(!panoramaEnabled));
$('#actionReset').addEventListener('click', resetScene);
$('#panoramaSelect').addEventListener('change', (event) => selectPanorama(event.target.value));
$('#environmentIntensityControl').addEventListener('input', (event) => {
  scene.environmentIntensity = Number(event.target.value);
  $('#environmentIntensityValue').textContent = scene.environmentIntensity.toFixed(2);
});
scene.environmentIntensity = 1;

const ambientLight = new THREE.HemisphereLight(0xe9efff, 0x252b38, 0.75);
ambientLight.name = 'AmbientLight';
scene.add(ambientLight);
$('#lightIntensityControl').addEventListener('input', (event) => {
  keyLight.intensity = Number(event.target.value);
  $('#lightIntensityValue').textContent = keyLight.intensity.toFixed(1);
});
$('#ambientIntensityControl').addEventListener('input', (event) => {
  ambientLight.intensity = Number(event.target.value);
  $('#ambientIntensityValue').textContent = ambientLight.intensity.toFixed(2);
});
let bloomEnabled = true;
$('#bloomToggle').addEventListener('click', () => {
  bloomEnabled = !bloomEnabled;
  bloomPass.enabled = bloomEnabled;
  $('#bloomToggle').classList.toggle('is-on', bloomEnabled);
  $('#bloomToggle').setAttribute('aria-pressed', String(bloomEnabled));
  $('#bloomToggle').textContent = `Bloom: ${bloomEnabled ? 'ON' : 'OFF'}`;
});
$('#bloomStrengthControl').addEventListener('input', (event) => {
  bloomPass.strength = Number(event.target.value);
  $('#bloomStrengthValue').textContent = bloomPass.strength.toFixed(2);
});
$('#bloomRadiusControl').addEventListener('input', (event) => {
  bloomPass.radius = Number(event.target.value);
  $('#bloomRadiusValue').textContent = bloomPass.radius.toFixed(2);
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 17),
  new THREE.MeshStandardMaterial({ color: 0x263449, roughness: 0.9, metalness: 0.02 }),
);
ground.name = 'Ground';
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.015;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(22, 22, 0x64748b, 0x475569);
grid.position.y = 0.002;
grid.material.transparent = true;
grid.material.opacity = 0.22;
scene.add(grid);

// Selectable entities and hierarchy demonstration ----------------------------
const interactiveObjects = [];
function registerSelectable(root, label, category = 'MeshStandardMaterial') {
  root.userData.selectLabel = label;
  root.userData.materialLabel = category;
  root.userData.baseScale = root.scale.clone();
  root.userData.baseRotationY = root.rotation.y;
  interactiveObjects.push(root);
  return root;
}

const hierarchyGroup = new THREE.Group();
hierarchyGroup.name = 'Hierarchy Demo Group';
hierarchyGroup.position.set(-2.7, 0, 0.2);
hierarchyGroup.rotation.y = -Math.PI / 9;
scene.add(hierarchyGroup);
const parentBody = new THREE.Mesh(
  new THREE.BoxGeometry(1.55, 0.68, 1.05),
  new THREE.MeshStandardMaterial({ color: 0x4f83a8, roughness: 0.48, metalness: 0.18 }),
);
parentBody.name = 'Parent Body';
parentBody.position.y = 0.78;
parentBody.castShadow = true;
parentBody.receiveShadow = true;
hierarchyGroup.add(parentBody);
const childObject = new THREE.Mesh(
  new THREE.BoxGeometry(0.48, 0.48, 0.48),
  new THREE.MeshStandardMaterial({ color: 0xe99a4a, roughness: 0.38, metalness: 0.16 }),
);
childObject.name = 'Child Object';
childObject.position.set(0.95, 0.35, 0);
childObject.castShadow = true;
childObject.receiveShadow = true;
parentBody.add(childObject);
hierarchyGroup.updateMatrixWorld(true);
const childWorldPosition = new THREE.Vector3();
childObject.getWorldPosition(childWorldPosition);
console.info('Hierarchy transform demo — child local:', childObject.position.clone(), 'child world:', childWorldPosition);
registerSelectable(hierarchyGroup, 'Hierarchy Demo', 'Group + MeshStandardMaterial');

const pbrMaterial = new THREE.MeshStandardMaterial({
  color: 0x4f91c5, roughness: 0.3, metalness: 0.28,
  emissive: 0x071522, emissiveIntensity: 0.12,
});
const pbrSphere = new THREE.Mesh(new THREE.SphereGeometry(0.76, 48, 32), pbrMaterial);
pbrSphere.name = 'PBR Sphere';
pbrSphere.position.set(0, 0.8, 0.2);
pbrSphere.castShadow = true;
pbrSphere.receiveShadow = true;
scene.add(pbrSphere);
registerSelectable(pbrSphere, 'PBR Sphere', 'MeshStandardMaterial · PBR');

// Sembilan material untuk membandingkan roughness dan metalness.
const galleryGroup = new THREE.Group();
galleryGroup.name = 'PBR Material Gallery';
const roughnessSamples = [0.12, 0.5, 0.88];
const metalnessSamples = [0, 0.5, 1];
const galleryGeometry = new THREE.SphereGeometry(0.28, 28, 20);
roughnessSamples.forEach((roughness, row) => {
  metalnessSamples.forEach((metalness, column) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.56 + column * 0.055, 0.52, 0.6 - row * 0.035), roughness, metalness,
    });
    const sample = new THREE.Mesh(galleryGeometry, material);
    sample.name = `Gallery R${roughness.toFixed(2)} M${metalness.toFixed(1)}`;
    sample.position.set(-2.4 + column * 2.4, 0.3, -3.25 + row * 0.82);
    sample.castShadow = true;
    sample.receiveShadow = true;
    galleryGroup.add(sample);
  });
});
scene.add(galleryGroup);
$('#galleryToggle').addEventListener('click', (event) => {
  galleryGroup.visible = !galleryGroup.visible;
  event.currentTarget.classList.toggle('is-on', galleryGroup.visible);
  event.currentTarget.setAttribute('aria-pressed', String(galleryGroup.visible));
  event.currentTarget.textContent = `Gallery: ${galleryGroup.visible ? 'ON' : 'OFF'}`;
  updateStats();
});

// Orbit bertingkat untuk memperlihatkan hubungan parent dan child.
const solarSystem = new THREE.Group();
solarSystem.name = 'Hierarchical Solar System';
solarSystem.position.set(0, 0, -6.1);
solarSystem.visible = false;
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.43, 32, 24),
  new THREE.MeshStandardMaterial({ color: 0xffc02d, emissive: 0xe87a00, emissiveIntensity: 1.2, roughness: 0.45 }),
);
sun.name = 'Sun';
sun.position.y = 0.48;
sun.castShadow = true;
sun.receiveShadow = true;
solarSystem.add(sun);
const earthOrbit = new THREE.Group();
earthOrbit.name = 'Earth Orbit';
solarSystem.add(earthOrbit);
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 24, 18),
  new THREE.MeshStandardMaterial({ color: 0x4f9fe8, roughness: 0.42, metalness: 0.12 }),
);
earth.name = 'Earth';
earth.position.set(1.45, 0.48, 0);
earth.castShadow = true;
earth.receiveShadow = true;
earthOrbit.add(earth);
const moonOrbit = new THREE.Group();
moonOrbit.name = 'Moon Orbit';
moonOrbit.position.copy(earth.position);
earthOrbit.add(moonOrbit);
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 18, 14),
  new THREE.MeshStandardMaterial({ color: 0xc6c9b9, roughness: 0.8, metalness: 0.05 }),
);
moon.name = 'Moon';
moon.position.set(0.42, 0.08, 0);
moon.castShadow = true;
moon.receiveShadow = true;
moonOrbit.add(moon);
for (const radius of [1.45, 1.9]) {
  const orbitLine = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.008, 6, 96),
    new THREE.MeshBasicMaterial({ color: 0x9aa600, transparent: true, opacity: 0.42 }),
  );
  orbitLine.name = 'Orbit Path';
  orbitLine.rotation.x = Math.PI / 2;
  orbitLine.position.y = 0.03;
  solarSystem.add(orbitLine);
}
scene.add(solarSystem);
registerSelectable(solarSystem, 'Hierarchical Solar System', 'Nested THREE.Group hierarchy');
$('#solarToggle').addEventListener('click', (event) => {
  solarSystem.visible = !solarSystem.visible;
  event.currentTarget.classList.toggle('is-on', solarSystem.visible);
  event.currentTarget.setAttribute('aria-pressed', String(solarSystem.visible));
  event.currentTarget.textContent = `Solar (S): ${solarSystem.visible ? 'ON' : 'OFF'}`;
  updateStats();
});

const roughnessControl = $('#roughnessControl');
const metalnessControl = $('#metalnessControl');
roughnessControl.addEventListener('input', () => {
  pbrMaterial.roughness = Number(roughnessControl.value);
  $('#roughnessValue').textContent = pbrMaterial.roughness.toFixed(2);
});
metalnessControl.addEventListener('input', () => {
  pbrMaterial.metalness = Number(metalnessControl.value);
  $('#metalnessValue').textContent = pbrMaterial.metalness.toFixed(2);
});
$('#emissiveControl').addEventListener('input', (event) => {
  pbrMaterial.emissiveIntensity = Number(event.target.value);
  $('#emissiveValue').textContent = pbrMaterial.emissiveIntensity.toFixed(2);
});

// GLB import, hierarchy traversal, shadow, and AnimationMixer -----------------
let importedModel = null;
let mixer = null;
let activeAction = null;
let animationClips = [];
let animationActions = [];
const loader = new GLTFLoader();
hud.loading.textContent = 'Memuat GLB…';
loader.load(
  './models/model.glb',
  (gltf) => {
    importedModel = gltf.scene;
    importedModel.name = 'Imported GLB · Rubber Duck';
    const modelBounds = new THREE.Box3().setFromObject(importedModel);
    const modelSize = modelBounds.getSize(new THREE.Vector3());
    const modelCenter = modelBounds.getCenter(new THREE.Vector3());
    const modelScale = 1.65 / Math.max(modelSize.x, modelSize.y, modelSize.z, 0.001);
    importedModel.scale.setScalar(modelScale);
    importedModel.position.set(2.75 - modelCenter.x * modelScale, -modelBounds.min.y * modelScale, 0.2 - modelCenter.z * modelScale);
    importedModel.rotation.y = -0.3;
    importedModel.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (Array.isArray(object.material)) object.material = object.material.map((material) => material.clone());
      else object.material = object.material.clone();
    });
    scene.add(importedModel);
    registerSelectable(importedModel, 'Rubber Duck · GLB', 'GLTF / PBR');

    animationClips = [...gltf.animations];
    if (animationClips.length === 0) {
      animationClips = [
        new THREE.AnimationClip('Float', 1.2, [new THREE.NumberKeyframeTrack('.position[y]', [0, 0.6, 1.2], [importedModel.position.y, importedModel.position.y + 0.14, importedModel.position.y])]),
        new THREE.AnimationClip('Turn', 1.8, [new THREE.NumberKeyframeTrack('.rotation[y]', [0, 0.9, 1.8], [-0.3, 0.3, -0.3])]),
        new THREE.AnimationClip('Nod', 0.9, [new THREE.NumberKeyframeTrack('.rotation[z]', [0, 0.45, 0.9], [0, 0.18, 0])]),
      ];
    }
    mixer = new THREE.AnimationMixer(importedModel);
    animationActions = animationClips.slice(0, 3).map((clip) => mixer.clipAction(clip));
    for (let index = 0; index < 3; index += 1) {
      const button = $(`#clipButton${index + 1}`);
      button.disabled = !animationActions[index];
      if (animationActions[index]) button.addEventListener('click', () => playAnimationClip(index));
    }
    playAnimationClip(0);
    let meshCount = 0;
    importedModel.traverse((object) => { if (object.isMesh) meshCount += 1; });
    console.info(`GLB ready: ${meshCount} mesh(es), ${gltf.animations.length} embedded clip(s), ${animationActions.length} selectable clip(s).`, importedModel);
    hud.loading.textContent = 'GLB siap';
    updateStats();
  },
  (progress) => {
    if (progress.total > 0) hud.loading.textContent = `${Math.round((progress.loaded / progress.total) * 100)}%`;
  },
  (error) => {
    console.error('GLB loading error:', error);
    hud.loading.textContent = 'Gagal memuat GLB';
    hud.animation.textContent = 'Aset tidak tersedia';
  },
);
function playAnimationClip(index) {
  const nextAction = animationActions[index];
  if (!nextAction) {
    hud.animation.textContent = 'Clip tidak tersedia';
    return;
  }
  activeAction?.fadeOut(0.12);
  activeAction = nextAction;
  activeAction.reset().fadeIn(0.18).play();
  for (let buttonIndex = 0; buttonIndex < 3; buttonIndex += 1) {
    $(`#clipButton${buttonIndex + 1}`).classList.toggle('is-on', buttonIndex === index);
  }
  hud.animation.textContent = activeAction.getClip().name || 'Clip aktif';
}
function replayModelAnimation() {
  const index = Math.max(0, animationActions.indexOf(activeAction));
  playAnimationClip(index);
}
$('#playAnimation').addEventListener('click', replayModelAnimation);
function resetScene() {
  resetCamera();
  selectPanorama('procedural');
  setPanorama(true);
  setEnvironment(true);
  scene.environmentIntensity = 1;
  $('#environmentIntensityControl').value = '1';
  $('#environmentIntensityValue').textContent = '1.00';

  bloomEnabled = true;
  bloomPass.enabled = true;
  bloomPass.strength = 0.16;
  bloomPass.radius = 0.3;
  $('#bloomToggle').classList.add('is-on');
  $('#bloomToggle').setAttribute('aria-pressed', 'true');
  $('#bloomToggle').textContent = 'Bloom: ON';
  $('#bloomStrengthControl').value = '0.16';
  $('#bloomStrengthValue').textContent = '0.16';
  $('#bloomRadiusControl').value = '0.3';
  $('#bloomRadiusValue').textContent = '0.30';

  pbrMaterial.roughness = 0.3;
  pbrMaterial.metalness = 0.28;
  pbrMaterial.emissiveIntensity = 0.12;
  $('#roughnessControl').value = '0.3';
  $('#roughnessValue').textContent = '0.30';
  $('#metalnessControl').value = '0.28';
  $('#metalnessValue').textContent = '0.28';
  $('#emissiveControl').value = '0.12';
  $('#emissiveValue').textContent = '0.12';
  keyLight.intensity = 2.5;
  ambientLight.intensity = 0.75;
  $('#lightIntensityControl').value = '2.5';
  $('#lightIntensityValue').textContent = '2.5';
  $('#ambientIntensityControl').value = '0.75';
  $('#ambientIntensityValue').textContent = '0.75';

  orbitSettings.enabled = true;
  orbitSettings.pan = true;
  orbitSettings.damping = true;
  orbitSettings.dampingFactor = 0.075;
  orbitSettings.rotateSpeed = 1;
  orbitSettings.zoomSpeed = 1;
  $('#orbitEnabled').checked = true;
  $('#panEnabled').checked = true;
  $('#dampingEnabled').checked = true;
  $('#dampingControl').value = '0.075';
  $('#dampingValue').textContent = '0.075';
  $('#rotateSpeedControl').value = '1';
  $('#rotateSpeedValue').textContent = '1.00×';
  $('#zoomSpeedControl').value = '1';
  $('#zoomSpeedValue').textContent = '1.00×';
  applyOrbitSettings();

  galleryGroup.visible = true;
  $('#galleryToggle').classList.add('is-on');
  $('#galleryToggle').setAttribute('aria-pressed', 'true');
  $('#galleryToggle').textContent = 'Gallery: ON';
  solarSystem.visible = false;
  $('#solarToggle').classList.remove('is-on');
  $('#solarToggle').setAttribute('aria-pressed', 'false');
  $('#solarToggle').textContent = 'Solar (S)';

  selectedObject = null;
  changeHover(null);
  updateSelectionPanel(null);
  if (animationActions.length) playAnimationClip(0);
  updateStats();
}

// Raycasting, hover, dan pemilihan objek.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredObject = null;
let selectedObject = null;
let selectionGesture = null;
let suppressSelection = false;

function selectableRoot(object) {
  let current = object;
  while (current && !current.userData.selectLabel) current = current.parent;
  return current || null;
}
function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return true;
}
function intersectAt(event) {
  if (!updatePointer(event)) return null;
  raycaster.setFromCamera(pointer, activeCamera);
  const hits = raycaster.intersectObjects(interactiveObjects, true);
  for (const hit of hits) {
    const root = selectableRoot(hit.object);
    if (root && root.visible) return root;
  }
  return null;
}
function setVisualScale(root) {
  if (!root) return;
  const factor = root === selectedObject ? 1.12 : root === hoveredObject ? 1.06 : 1;
  root.scale.copy(root.userData.baseScale).multiplyScalar(factor);
}
const hoverMaterials = new WeakMap();
function setHoverEmissive(root, enabled) {
  if (!root) return;
  root.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material?.emissive) continue;
      if (!hoverMaterials.has(material)) {
        hoverMaterials.set(material, { color: material.emissive.clone(), intensity: material.emissiveIntensity });
      }
      const base = hoverMaterials.get(material);
      if (enabled) {
        material.emissive.copy(base.color).add(new THREE.Color(0x263300));
        material.emissiveIntensity = Math.max(base.intensity, 0.22);
      } else {
        material.emissive.copy(base.color);
        material.emissiveIntensity = base.intensity;
      }
    }
  });
}
function changeHover(next) {
  if (hoveredObject === next) return;
  const previous = hoveredObject;
  hoveredObject = next;
  setHoverEmissive(previous, false);
  setHoverEmissive(hoveredObject, true);
  setVisualScale(previous);
  setVisualScale(hoveredObject);
  hud.hover.textContent = hoveredObject?.userData.selectLabel || '—';
  renderer.domElement.style.cursor = hoveredObject ? 'pointer' : 'grab';
}
function materialDescription(root) {
  if (root === hierarchyGroup) return 'THREE.Group · parent / child meshes';
  const materials = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) if (material && !materials.includes(material.type)) materials.push(material.type);
  });
  return materials.join(', ') || root.userData.materialLabel || 'Object3D';
}
function updateSelectionPanel(root) {
  if (!root) {
    hud.selected.textContent = 'Belum ada';
    hud.hint.hidden = false;
    hud.details.hidden = true;
    return;
  }
  hud.selected.textContent = root.userData.selectLabel;
  hud.hint.hidden = true;
  hud.details.hidden = false;
  const position = root.position;
  const rotation = root.rotation;
  const scale = root.userData.baseScale;
  hud.position.textContent = `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`;
  hud.rotation.textContent = `${THREE.MathUtils.radToDeg(rotation.x).toFixed(0)}°, ${THREE.MathUtils.radToDeg(rotation.y).toFixed(0)}°, ${THREE.MathUtils.radToDeg(rotation.z).toFixed(0)}°`;
  hud.scale.textContent = `${scale.x.toFixed(2)} × ${scale.y.toFixed(2)} × ${scale.z.toFixed(2)}`;
  hud.material.textContent = materialDescription(root);
}
renderer.domElement.addEventListener('pointerdown', (event) => {
  suppressSelection = event.button !== 0 || selectionGesture !== null;
  selectionGesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
window.addEventListener('pointermove', (event) => {
  if (!selectionGesture || event.pointerId !== selectionGesture.id) return;
  if (Math.hypot(event.clientX - selectionGesture.x, event.clientY - selectionGesture.y) > 5) suppressSelection = true;
}, true);
window.addEventListener('pointerup', (event) => {
  if (event.pointerId !== selectionGesture?.id) return;
  selectionGesture = null;
  window.setTimeout(() => { suppressSelection = false; }, 0);
});
window.addEventListener('pointercancel', () => {
  selectionGesture = null;
  suppressSelection = true;
  window.setTimeout(() => { suppressSelection = false; }, 0);
});
renderer.domElement.addEventListener('pointermove', (event) => {
  if (selectionGesture) return;
  changeHover(intersectAt(event));
});
renderer.domElement.addEventListener('pointerleave', () => changeHover(null));
renderer.domElement.addEventListener('click', (event) => {
  if (suppressSelection || event.button !== 0) return;
  const next = intersectAt(event);
  const previous = selectedObject;
  selectedObject = next;
  setVisualScale(previous);
  setVisualScale(selectedObject);
  updateSelectionPanel(selectedObject);
  if (selectedObject === importedModel && activeAction) {
    replayModelAnimation();
  }
  if (selectedObject && selectedObject !== previous) console.info('Selected object:', selectedObject.name, selectedObject);
});

// Objek terpilih berputar perlahan selama tetap dipilih.
const clock = new THREE.Timer();
clock.connect(document);
const frameTimes = [];
let lastStatsUpdate = 0;
function updateStats() {
  let meshes = 0;
  let triangles = 0;
  scene.traverse((object) => {
    if (!object.isMesh || !object.visible) return;
    meshes += 1;
    const position = object.geometry?.attributes?.position;
    if (object.geometry?.index) triangles += object.geometry.index.count / 3;
    else if (position) triangles += position.count / 3;
  });
  $('#objectCount').textContent = String(meshes).padStart(2, '0');
  $('#triangleCount').textContent = String(Math.round(triangles)).padStart(3, '0');
}
updateStats();

function resizeRenderer() {
  const width = Math.max(1, mount.clientWidth);
  const height = Math.max(1, mount.clientHeight);
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  perspectiveCamera.aspect = width / height;
  perspectiveCamera.updateProjectionMatrix();
  const frustumHeight = 16;
  const aspect = width / height;
  orthographicCamera.left = (-frustumHeight * aspect) / 2;
  orthographicCamera.right = (frustumHeight * aspect) / 2;
  orthographicCamera.top = frustumHeight / 2;
  orthographicCamera.bottom = -frustumHeight / 2;
  orthographicCamera.updateProjectionMatrix();
}
const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(mount);
window.addEventListener('resize', resizeRenderer);

function animate() {
  requestAnimationFrame(animate);
  clock.update();
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsed();
  mixer?.update(delta);
  earthOrbit.rotation.y += 0.65 * delta;
  moonOrbit.rotation.y += 1.7 * delta;
  if (selectedObject && selectedObject !== importedModel && selectedObject !== hierarchyGroup) {
    selectedObject.rotation.y += 0.28 * delta;
  }
  hierarchyGroup.rotation.y = -Math.PI / 9 + Math.sin(elapsed * 0.35) * 0.035;
  controls.update();
  composer.render();

  frameTimes.push(performance.now());
  while (frameTimes.length && frameTimes[0] < performance.now() - 1000) frameTimes.shift();
  if (performance.now() - lastStatsUpdate > 500) {
    $('#fpsCount').textContent = String(frameTimes.length);
    lastStatsUpdate = performance.now();
  }
}
animate();

window.addEventListener('keydown', (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return;
  if (event.code === 'KeyP') setPanorama(!panoramaEnabled);
  if (event.code === 'KeyC') switchCamera();
  if (event.code === 'KeyR') resetScene();
  if (event.code === 'KeyE') setEnvironment(!environmentEnabled);
  if (event.code === 'KeyS') $('#solarToggle').click();
  if (event.code === 'Digit1') playAnimationClip(0);
  if (event.code === 'Digit2') playAnimationClip(1);
  if (event.code === 'Digit3') playAnimationClip(2);
});

window.addEventListener('beforeunload', () => {
  controls?.dispose();
  resizeObserver.disconnect();
  roomEnvironmentMap.dispose();
  for (const panorama of panoramaAssets.values()) {
    panorama.background.dispose();
    if (panorama.environment !== panorama.background) panorama.environment.dispose();
  }
  renderer.dispose();
});
