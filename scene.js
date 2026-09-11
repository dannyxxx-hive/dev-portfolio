// ---- Project data ----
const projects = [
  {
    id: 0,
    title: "Event Pipeline",
    tag: "infrastructure",
    description: "A distributed event-processing pipeline handling several million events per day, built to survive partial outages without losing data. Started as a weekend rewrite of a brittle cron-based system and grew into the backbone of the platform's async work.",
    stack: ["Kafka", "Go", "PostgreSQL", "Kubernetes"]
  },
  {
    id: 1,
    title: "Query Planner",
    tag: "database internals",
    description: "A cost-based query planner for an internal analytics engine, designed to pick reasonable execution strategies over deeply nested joins without needing manual query hints from users.",
    stack: ["Rust", "SQL", "LLVM"]
  },
  {
    id: 2,
    title: "Config Service",
    tag: "platform",
    description: "A small service that replaced scattered environment variables and YAML files across a dozen microservices with one versioned, auditable source of truth, with instant rollback baked in.",
    stack: ["TypeScript", "Node.js", "Redis"]
  },
  {
    id: 3,
    title: "Rate Limiter",
    tag: "reliability",
    description: "A sliding-window rate limiter deployed at the edge to protect downstream services during traffic spikes, tuned to fail open rather than closed when the limiter itself is under stress.",
    stack: ["Go", "Envoy", "Redis"]
  },
  {
    id: 4,
    title: "Migration Toolkit",
    tag: "developer tools",
    description: "An internal CLI that made zero-downtime schema migrations boring instead of terrifying, with dry-run diffing and automatic rollback scripts generated alongside every migration.",
    stack: ["Python", "PostgreSQL", "Click"]
  }
];

// ---- Scene setup ----
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0A0E14, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0A0E14, 0.045);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 14);

// Lighting
const ambient = new THREE.AmbientLight(0x8899aa, 0.6);
scene.add(ambient);

const keyLight = new THREE.PointLight(0x4C9A8E, 1.2, 50);
keyLight.position.set(8, 6, 10);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0xffffff, 0.4, 50);
rimLight.position.set(-8, -4, -6);
scene.add(rimLight);

// ---- Build node constellation ----
const nodeGroup = new THREE.Group();
scene.add(nodeGroup);

const nodePositions = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(3.2, 1.5, -1.5),
  new THREE.Vector3(-3.0, 2.0, 1.0),
  new THREE.Vector3(-2.6, -2.2, -1.0),
  new THREE.Vector3(2.8, -1.8, 1.8),
];

const connections = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 3]
];

const nodeMeshes = [];

const nodeGeo = new THREE.IcosahedronGeometry(0.55, 1);
const nodeMatBase = new THREE.MeshStandardMaterial({
  color: 0x1a2230,
  emissive: 0x4C9A8E,
  emissiveIntensity: 0.15,
  metalness: 0.3,
  roughness: 0.5,
  flatShading: true
});

nodePositions.forEach((pos, i) => {
  const mat = nodeMatBase.clone();
  const mesh = new THREE.Mesh(nodeGeo, mat);
  mesh.position.copy(pos);
  mesh.userData = { projectIndex: i, baseScale: i === 0 ? 1.3 : 1 };
  mesh.scale.setScalar(mesh.userData.baseScale);
  nodeGroup.add(mesh);
  nodeMeshes.push(mesh);

  // wireframe overlay for extra structure
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x4C9A8E, wireframe: true, transparent: true, opacity: 0.25 });
  const wireMesh = new THREE.Mesh(nodeGeo, wireMat);
  wireMesh.scale.setScalar(1.15);
  mesh.add(wireMesh);
});

// Connection lines
const lineMat = new THREE.LineBasicMaterial({ color: 0x4C9A8E, transparent: true, opacity: 0.3 });
connections.forEach(([a, b]) => {
  const geo = new THREE.BufferGeometry().setFromPoints([nodePositions[a], nodePositions[b]]);
  const line = new THREE.Line(geo, lineMat);
  nodeGroup.add(line);
});

// Ambient particle field
const particleCount = 200;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  particlePos[i * 3] = (Math.random() - 0.5) * 40;
  particlePos[i * 3 + 1] = (Math.random() - 0.5) * 40;
  particlePos[i * 3 + 2] = (Math.random() - 0.5) * 40;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
const particleMat = new THREE.PointsMaterial({ color: 0x6B7280, size: 0.03, transparent: true, opacity: 0.5 });
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ---- Orbit interaction (custom, lightweight — no external OrbitControls needed) ----
let isDragging = false;
let prevX = 0, prevY = 0;
let rotY = 0.3, rotX = -0.15;
let targetRotY = rotY, targetRotX = rotX;
let autoRotate = true;

function pointerDown(x, y) {
  isDragging = true;
  autoRotate = false;
  prevX = x; prevY = y;
}
function pointerMove(x, y) {
  if (!isDragging) return;
  const dx = x - prevX;
  const dy = y - prevY;
  targetRotY += dx * 0.005;
  targetRotX += dy * 0.005;
  targetRotX = Math.max(-0.9, Math.min(0.9, targetRotX));
  prevX = x; prevY = y;
}
function pointerUp() { isDragging = false; }

canvas.addEventListener('mousedown', e => pointerDown(e.clientX, e.clientY));
window.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY));
window.addEventListener('mouseup', pointerUp);

canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  pointerDown(t.clientX, t.clientY);
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  const t = e.touches[0];
  pointerMove(t.clientX, t.clientY);
}, { passive: true });
canvas.addEventListener('touchend', pointerUp);

// ---- Raycasting for node clicks ----
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

function updatePointer(x, y) {
  pointer.x = (x / window.innerWidth) * 2 - 1;
  pointer.y = -(y / window.innerHeight) * 2 + 1;
}

function checkHover() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(nodeMeshes);
  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (hovered !== mesh) {
      if (hovered) hovered.material.emissiveIntensity = 0.15;
      hovered = mesh;
      hovered.material.emissiveIntensity = 0.6;
      canvas.style.cursor = 'pointer';
    }
  } else {
    if (hovered) {
      hovered.material.emissiveIntensity = 0.15;
      hovered = null;
    }
    canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
  }
}

let dragDistance = 0;
canvas.addEventListener('mousedown', e => { dragDistance = 0; });
window.addEventListener('mousemove', e => {
  updatePointer(e.clientX, e.clientY);
  if (isDragging) dragDistance += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
  checkHover();
});

canvas.addEventListener('click', e => {
  if (dragDistance > 6) return; // was a drag, not a click
  updatePointer(e.clientX, e.clientY);
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(nodeMeshes);
  if (intersects.length > 0) {
    openPanel(intersects[0].object.userData.projectIndex);
  }
});

// ---- Detail panel ----
const panel = document.getElementById('detail-panel');
const panelContent = document.getElementById('detail-content');
const closeBtn = document.getElementById('close-panel');

function openPanel(index) {
  const p = projects[index];
  panelContent.innerHTML = `
    <span class="tag">${p.tag}</span>
    <h2>${p.title}</h2>
    <p>${p.description}</p>
    <ul class="stack-list">${p.stack.map(s => `<li>${s}</li>`).join('')}</ul>
  `;
  panel.classList.add('open');
}
closeBtn.addEventListener('click', () => panel.classList.remove('open'));

// ---- Resize ----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Animation loop ----
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  if (autoRotate) {
    targetRotY += 0.0015;
  }

  rotY += (targetRotY - rotY) * 0.08;
  rotX += (targetRotX - rotX) * 0.08;

  nodeGroup.rotation.y = rotY;
  nodeGroup.rotation.x = rotX;

  // gentle bobbing per node
  nodeMeshes.forEach((mesh, i) => {
    mesh.position.y = nodePositions[i].y + Math.sin(t * 0.6 + i * 1.3) * 0.12;
    mesh.rotation.y = t * 0.2 + i;
  });

  particles.rotation.y = t * 0.01;

  renderer.render(scene, camera);
}

// resume auto-rotate after inactivity
let idleTimer;
function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { autoRotate = true; }, 4000);
}
canvas.addEventListener('mousedown', resetIdle);
canvas.addEventListener('touchstart', resetIdle);
resetIdle();

animate();

// ---- Loading screen ----
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 300);
});
