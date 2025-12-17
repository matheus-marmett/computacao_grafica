import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, clock, mixer, controls;
let dragon = null;
let loadFinished = false;

const parametrosGui = {
  escala: 0.01,
  rotY: 0,
  luz: 'Directional' // Directional | Point | Spot
};

let actions = {
  walk: null,
  idle: null,
  fly: null
};
let activeAction = null;
let idleAction = null;

// movimento
let moveDirection = 0; // -1 = trás, 0 = parado, 1 = frente
const speed = 12; // unidades por segundo

// iluminação
let currentLight = null;
let ambientLight = null;
let lightHelper = null;
let lightTarget = null;
let pointIndicator = null;

export function init() {
  // câmera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 12, 40);

  // cena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce0ff);

  // render
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // controles de câmera
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 5, 0);

  clock = new THREE.Clock();

  // chão e iluminação padrão
  criaChao();
  createLight(parametrosGui.luz);

  // GUI
  criaGui();

  // carregar modelo
  carregaDragao();

  // eventos
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // loop
  renderer.setAnimationLoop(loop);
}

/* ---------- CHÃO ---------- */
function criaChao() {
  const texLoader = new THREE.TextureLoader();
  const textura = texLoader.load('assets/grasslight-big.jpg');
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(25, 25);
  textura.anisotropy = 16;

  const mat = new THREE.MeshStandardMaterial({ map: textura });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -6;
  ground.receiveShadow = true;
  scene.add(ground);
}

/* ---------- ILUMINAÇÃO ---------- */
function createLight(type) {
  // Remove luzes e objetos anteriores
  if (currentLight) {
    scene.remove(currentLight);
    currentLight.dispose?.();
    currentLight = null;
  }
  if (ambientLight) {
    scene.remove(ambientLight);
    ambientLight = null;
  }
  if (lightHelper) {
    scene.remove(lightHelper);
    lightHelper = null;
  }
  if (lightTarget) {
    scene.remove(lightTarget);
    lightTarget = null;
  }
  if (pointIndicator) {
    scene.remove(pointIndicator);
    pointIndicator = null;
  }

  // Cria nova luz
  if (type === 'Directional') {
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(100, 150, 100);
    dirLight.castShadow = true;

    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 400;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;

    lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 0, 0);
    scene.add(lightTarget);
    dirLight.target = lightTarget;

    currentLight = dirLight;
    ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(currentLight, ambientLight);

  } else if (type === 'Point') {
    const pointLight = new THREE.PointLight(0xffffff, 1.6, 600, 0.6);
    pointLight.position.set(10, 15, 10);
    pointLight.castShadow = true;

    pointLight.shadow.mapSize.set(1024, 1024);
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 500;

    // Indicador visual (sol)
    const sphereGeo = new THREE.SphereGeometry(1.5, 16, 8);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    pointIndicator = new THREE.Mesh(sphereGeo, sphereMat);
    pointIndicator.position.copy(pointLight.position);

    currentLight = pointLight;
    ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(currentLight, pointIndicator, ambientLight);

  } else if (type === 'Spot') {
    const spotLight = new THREE.SpotLight(0xffffff, 1.8, 1000, Math.PI / 6, 0.3, 1);
    spotLight.position.set(20, 50, 40);
    spotLight.castShadow = true;

    lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 0, 0);
    scene.add(lightTarget);
    spotLight.target = lightTarget;

    spotLight.shadow.mapSize.set(2048, 2048);
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.focus = 1;

    lightHelper = new THREE.SpotLightHelper(spotLight);

    currentLight = spotLight;
    ambientLight = new THREE.AmbientLight(0x404040, 0.35);
    scene.add(currentLight, ambientLight, lightHelper);
  }
}

/* ---------- GUI ---------- */
function criaGui() {
  const gui = new GUI();

  // Escala
  gui.add(parametrosGui, 'escala', 0.005, 0.05, 0.001).name('Escala').onChange(v => {
    if (dragon) dragon.scale.setScalar(v);
  });

  // Rotação Y
  gui.add(parametrosGui, 'rotY', -Math.PI, Math.PI, 0.01).name('Rot Y').onChange(v => {
    if (dragon) dragon.rotation.y = v;
  });

  // Tipo de luz
  gui.add(parametrosGui, 'luz', ['Directional', 'Point', 'Spot']).name('Tipo Luz').onChange(v => {
    createLight(v);

    // Remove folder antigo
    if (gui.__folders['SpotLight Config']) gui.removeFolder(gui.__folders['SpotLight Config']);

    // Controles para o SpotLight
    if (v === 'Spot' && currentLight && currentLight.isSpotLight) {
      const spotFolder = gui.addFolder('SpotLight Config');
      spotFolder.add(currentLight, 'intensity', 0, 5, 0.1).name('Intensidade');
      spotFolder.add(currentLight, 'angle', 0.1, Math.PI / 2, 0.01).name('Ângulo').onChange(() => {
        currentLight.updateMatrixWorld();
      });
      spotFolder.add(currentLight, 'penumbra', 0, 1, 0.05).name('Penumbra');
      spotFolder.add(currentLight.position, 'x', -100, 200, 1).name('Posição X');
      spotFolder.add(currentLight.position, 'y', 0, 200, 1).name('Posição Y');
      spotFolder.add(currentLight.position, 'z', -100, 100, 1).name('Posição Z');
      spotFolder.open();
    }
  });
}

/* ---------- CARREGA DRAGÃO ---------- */
function carregaDragao() {
  const loader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  loader.load(
    'assets/fbx/Dragon3.fbx',
    obj => {
      obj.traverse(child => {
        if (child.isMesh) {
          const tex = texLoader.load('assets/fbx/Dragon_ground_color.jpg');
          child.material = new THREE.MeshStandardMaterial({ map: tex });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      obj.position.y = -5.8;
      obj.scale.setScalar(parametrosGui.escala);
      scene.add(obj);
      dragon = obj;

      mixer = new THREE.AnimationMixer(obj);
      const anims = obj.animations || [];

      if (anims.length > 0) {
        if (anims[0]) actions.walk = mixer.clipAction(anims[0]);
        if (anims[1]) actions.fly = mixer.clipAction(anims[1]);
        if (anims[2]) actions.idle = mixer.clipAction(anims[2]);
        if (!actions.idle) actions.idle = mixer.clipAction(anims[0]);

        if (actions.idle) {
          actions.idle.play();
          activeAction = actions.idle;
          idleAction = actions.idle;
        }
      }

      loadFinished = true;
      console.log('Dragão carregado. Animações detectadas:', anims.length);
    },
    progress => {
      if (progress.total) console.log('Carregando dragão:', ((progress.loaded / progress.total) * 100).toFixed(1), '%');
    },
    err => console.error('Erro ao carregar FBX:', err)
  );
}

/* ---------- INPUT ---------- */
function onKeyDown(e) {
  const code = e.code || e.key;
  if (code === 'KeyW' || code === 'ArrowUp') {
    moveDirection = 1;
    startMoving();
  } else if (code === 'KeyS' || code === 'ArrowDown') {
    moveDirection = -1;
    startMoving();
  }
}

function onKeyUp(e) {
  const code = e.code || e.key;
  if (code === 'KeyW' || code === 'ArrowUp' || code === 'KeyS' || code === 'ArrowDown') {
    moveDirection = 0;
    stopMoving();
  }
}

function startMoving() {
  if (!mixer || !loadFinished) return;
  if (actions.walk) fadeToAction(actions.walk, 0.2);
  else if (actions.fly) fadeToAction(actions.fly, 0.2);
}

function stopMoving() {
  if (!mixer || !loadFinished) return;
  if (actions.idle) fadeToAction(actions.idle, 0.2);
}

function fadeToAction(toAction, duration) {
  if (!toAction) return;
  const from = activeAction;
  if (from === toAction) return;
  toAction.reset().play();
  if (from) from.crossFadeTo(toAction, duration, false);
  activeAction = toAction;
}

/* ---------- LOOP ---------- */
function loop() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  // mover o dragão
  if (dragon && moveDirection !== 0) {
    const moveStep = speed * delta * moveDirection;
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(dragon.quaternion);
    dragon.position.addScaledVector(forward, moveStep);
  }

  controls.update();
  renderer.render(scene, camera);
}

/* ---------- RESIZE ---------- */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
