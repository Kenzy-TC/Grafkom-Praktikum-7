import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
const defaultBackground = new THREE.Color('#090b08');
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
renderer.toneMappingExposure = 1.15;
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
const bloomPass = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.35, 0.35, 0.9);
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
const keyLight = new THREE.DirectionalLight(0xfff4cb, 3.4);
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
let panoramaEnabled = false;
let panoramaTexture = null;
new THREE.TextureLoader().load('/environment/environment.jpg', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  panoramaTexture = texture;
  environmentMap = texture;
  if (environmentEnabled) scene.environment = texture;
  if (panoramaEnabled) scene.background = texture;
}, undefined, (error) => {
  console.warn('Optional environment panorama could not be loaded; procedural RoomEnvironment remains active.', error);
});
function setEnvironment(enabled) {
  environmentEnabled = enabled;
  scene.environment = enabled ? environmentMap : null;
  const button = $('#environmentToggle');
  button.classList.toggle('is-on', enabled);
  button.setAttribute('aria-pressed', String(enabled));
  $('#environmentState').textContent = enabled ? 'ON' : 'OFF';
}
$('#environmentToggle').addEventListener('click', () => setEnvironment(!environmentEnabled));
function setPanorama(enabled) {
  panoramaEnabled = enabled;
  scene.background = enabled && panoramaTexture ? panoramaTexture : defaultBackground;
  const button = $('#panoramaToggle');
  const state = enabled && !panoramaTexture ? 'LOADING' : enabled ? 'ON' : 'OFF';
  button.classList.toggle('is-on', enabled);
  button.setAttribute('aria-pressed', String(enabled));
  $('#panoramaState').textContent = state;
}
$('#panoramaToggle').addEventListener('click', () => setPanorama(!panoramaEnabled));
$('#environmentPreset').addEventListener('change', (event) => {
  scene.environmentIntensity = Number(event.target.value);
});
scene.environmentIntensity = 1;

const ambientLight = new THREE.HemisphereLight(0xe9edcf, 0x282c1d, 1.15);
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
  new THREE.MeshStandardMaterial({ color: 0x171a12, roughness: 0.9, metalness: 0.02 }),
);
ground.name = 'Ground';
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.015;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(22, 22, 0x454a1e, 0x272a1b);
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
  new THREE.MeshStandardMaterial({ color: 0x8f9e16, roughness: 0.48, metalness: 0.22 }),
);
parentBody.name = 'Parent Body';
parentBody.position.y = 0.78;
parentBody.castShadow = true;
parentBody.receiveShadow = true;
hierarchyGroup.add(parentBody);
const childObject = new THREE.Mesh(
  new THREE.BoxGeometry(0.48, 0.48, 0.48),
  new THREE.MeshStandardMaterial({ color: 0xffa629, roughness: 0.28, metalness: 0.35 }),
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
  color: 0xe8ff00, roughness: 0.25, metalness: 0.35,
  emissive: 0x232900, emissiveIntensity: 0.25,
});
const pbrSphere = new THREE.Mesh(new THREE.SphereGeometry(0.76, 48, 32), pbrMaterial);
pbrSphere.name = 'PBR Sphere';
pbrSphere.position.set(0, 0.8, 0.2);
pbrSphere.castShadow = true;
pbrSphere.receiveShadow = true;
scene.add(pbrSphere);
registerSelectable(pbrSphere, 'PBR Sphere', 'MeshStandardMaterial · PBR');

// Challenge: roughness × metalness gallery (nine comparison samples). ---------
const galleryGroup = new THREE.Group();
galleryGroup.name = 'PBR Material Gallery';
const roughnessSamples = [0.12, 0.5, 0.88];
const metalnessSamples = [0, 0.5, 1];
const galleryGeometry = new THREE.SphereGeometry(0.28, 28, 20);
roughnessSamples.forEach((roughness, row) => {
  metalnessSamples.forEach((metalness, column) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.17, 0.78, 0.48), roughness, metalness,
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

// Challenge: nested solar-system pivots demonstrate hierarchy animation. -----
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
  event.currentTarget.textContent = `Solar: ${solarSystem.visible ? 'ON' : 'OFF'}`;
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
const loader = new GLTFLoader();
hud.loading.textContent = 'Memuat GLB…';
loader.load(
  '/models/model.glb',
  (gltf) => {
    importedModel = gltf.scene;
    importedModel.name = 'Imported GLB · Astra Beacon';
    importedModel.position.set(2.75, 0, 0.2);
    importedModel.scale.setScalar(1.12);
    importedModel.rotation.y = -0.3;
    importedModel.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (Array.isArray(object.material)) object.material = object.material.map((material) => material.clone());
      else object.material = object.material.clone();
    });
    scene.add(importedModel);
    registerSelectable(importedModel, 'Astra Beacon · GLB', 'GLTF / PBR');

    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(importedModel);
      activeAction = mixer.clipAction(gltf.animations[0]);
      activeAction.play();
      hud.animation.textContent = gltf.animations[0].name || 'Clip 0';
    } else {
      hud.animation.textContent = 'Tidak ada clip';
    }
    let meshCount = 0;
    importedModel.traverse((object) => { if (object.isMesh) meshCount += 1; });
    console.info(`GLB ready: ${meshCount} mesh(es), ${gltf.animations.length} animation clip(s).`, importedModel);
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
function replayModelAnimation() {
  if (!activeAction) {
    hud.animation.textContent = 'Tidak ada clip';
    return;
  }
  mixer.stopAllAction();
  activeAction.reset().fadeIn(0.18).play();
  hud.animation.textContent = activeAction.getClip().name || 'Clip aktif';
}
$('#playAnimation').addEventListener('click', replayModelAnimation);

// Raycasting, hover and persistent click selection ----------------------------
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
function changeHover(next) {
  if (hoveredObject === next) return;
  const previous = hoveredObject;
  hoveredObject = next;
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

// Challenge: selected entity rotates gently while selected. -------------------
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
  if (event.code === 'KeyP') switchCamera();
  if (event.code === 'KeyR') resetCamera();
  if (event.code === 'KeyE') setEnvironment(!environmentEnabled);
});

window.addEventListener('beforeunload', () => {
  controls?.dispose();
  resizeObserver.disconnect();
  roomEnvironmentMap.dispose();
  panoramaTexture?.dispose();
  renderer.dispose();
});
