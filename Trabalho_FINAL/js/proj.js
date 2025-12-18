import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';





let camera, scene, renderer, clock, mixer, controls;
let loadFinished = false;
let wolf;
let wolfMixer;
const wolfActions = {};
let wolfActiveAction;



// ===== SISTEMA DE PERSEGUIÇÃO =====
let chaseChain = [];
let trackPath = [];


let animals = {
  dogs: [],
  cats: [],
  rats: []
};




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
const speed = 12; // unidades por segundo

// iluminação
let currentLight = null;
let ambientLight = null;
let lightHelper = null;
let lightTarget = null;
let pointIndicator = null;

// ===== DIA/NOITE (NOVO) =====
let isNight = false;
let sunMesh = null;
let moonMesh = null;

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
criaRua();
createLight(parametrosGui.luz);




carregaAnimal({
  nome: 'Cachorro',
  fbxPath: 'assets/animals/Dobermann.fbx',
  texturePath: 'assets/textures/pelo_cachorro.jpg',
  scale: 0.02,
  positions: [
    new THREE.Vector3(-6, -5.8, -40),
    new THREE.Vector3(6, -5.8, -55)
  ],
  targetArray: animals.dogs
  
});

carregaAnimal({
  nome: 'Gato',
  fbxPath: 'assets/animals/Persian_Cat.fbx',
  texturePath: 'assets/textures/pelo_gato.jpg',
  scale: 0.015,
  positions: [
    new THREE.Vector3(-3, -5.8, -25),
    new THREE.Vector3(3, -5.8, -35)
  ],
  targetArray: animals.cats
});


carregaAnimal({
  nome: 'Rato',
  fbxPath: 'assets/animals/rat.fbx',
  texturePath: 'assets/textures/pelo_rato.png',
  scale: 0.015, // ajuste conforme necessário
  positions: [
    new THREE.Vector3(-1.5, -5.8, -15),
    new THREE.Vector3(1.5, -5.8, -18)
  ],
  targetArray: animals.rats
});

// Exemplo de uso
carregaCasaFBX({
  fbxPath: 'assets/scene/building-sample-house-a.fbx',
  texturePath: 'assets/textures/variation-a.png',
  scale: 0.5,
  position: new THREE.Vector3(-100, -5.8, -50)
});

// Casa à esquerda
carregaCasaFBX({
  fbxPath: 'assets/scene/building-sample-house-b.fbx',
  texturePath: 'assets/textures/variation-b.png',
  scale: 0.5,
  position: new THREE.Vector3(-100, -5.8, -180) // ajuste a distância lateral
});


carregaCasaFBX({
  fbxPath: 'assets/scene/building-sample-house-c.fbx',
  texturePath: 'assets/textures/variation-a.png',
  scale: 0.5,
  position: new THREE.Vector3(100, -5.8, -50),
  doOutroLado: true
});

// Frente da casa da esquerda
carregaPoste({
  objPath: 'assets/scene/StreetLight.obj',
  mtlPath: 'assets/scene/StreetLight.mtl',
  scale: 0.1,
  position: new THREE.Vector3(-32, -5.8, -30)
  
});

adicionaLuzPoste(new THREE.Vector3(-32, -5.8, -30));


// Frente da casa central
carregaPoste({
  objPath: 'assets/scene/StreetLight.obj',
  mtlPath: 'assets/scene/StreetLight.mtl',
  scale: 0.1,
  position: new THREE.Vector3(-32, -5.8, -250)
});

adicionaLuzPoste(new THREE.Vector3(-32, -10, -250));


// Frente da casa da direita
carregaPoste({
  objPath: 'assets/scene/StreetLight.obj',
  mtlPath: 'assets/scene/StreetLight.mtl',
  scale: 0.1,
  position: new THREE.Vector3(32, -5.8, -120)
});

adicionaLuzPoste(new THREE.Vector3(32, -5.8, -120));



//criaPista();

// cria agentes após pequeno delay para garantir que os modelos existam
setTimeout(() => {
  if (
    animals.rats.length === 0 ||
    animals.cats.length === 0 ||
    animals.dogs.length === 0
  ) {
    console.warn('Animais ainda não carregaram');
    return;
  }

  const rat = {
    mesh: animals.rats[5],
    speed: 0.8,
    path: trackPath,
    progress: 0
  };

  const cat = {
    mesh: animals.cats[0],
    speed: 1.0,
    path: trackPath,
    progress: -0.6
  };

  const dog = {
    mesh: animals.dogs[0],
    speed: 1.2,
    path: trackPath,
    progress: -1.2
  };

  chaseChain = [rat, cat, dog];

  console.log('🐭🐱🐶 Cadeia de perseguição iniciada');
}, 800);





  // ===== Sol/Lua + botão Dia/Noite (NOVO) =====
  criaSolELua();
  criaBotaoDiaNoite();
  aplicaDiaNoite(false); // começa de DIA

  carregaLobo();
  animate();

  // GUI
  criaGui();

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
  const textura = texLoader.load('assets/textures/grasslight-big.jpg');
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

function criaRua() {
  const texLoader = new THREE.TextureLoader();

  const texturaAsfalto = texLoader.load('assets/textures/estrada.jpg');
  texturaAsfalto.wrapS = texturaAsfalto.wrapT = THREE.RepeatWrapping;

  // Quanto maior o comprimento, maior a repetição no eixo Y
  texturaAsfalto.repeat.set(1, 40);
  texturaAsfalto.anisotropy = 16;

  const materialRua = new THREE.MeshStandardMaterial({
    map: texturaAsfalto,
    roughness: 0.9,
    metalness: 0.05
  });

  const largura = 60;
  const comprimento = 1000;

  const geometriaRua = new THREE.PlaneGeometry(largura, comprimento);
  const rua = new THREE.Mesh(geometriaRua, materialRua);

  rua.rotation.x = -Math.PI / 2;

  // Levemente acima do chão para evitar z-fighting
  rua.position.y = -5.85;

  // Centraliza a rua no eixo Z
  rua.position.z = 0;

  rua.receiveShadow = true;

  scene.add(rua);
}



/* ---------- ILUMINAÇÃO ---------- */
function createLight(type) {
  // Remove luzes e objetos anteriores
  if (currentLight) {
    scene.remove(currentLight);
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
    ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(currentLight, ambientLight);

  } else if (type === 'Point') {
    // Coordenadas fixas dos postes
    const posicoesPostes = [
      new THREE.Vector3(-32, 33, -30),   // frente casa esquerda
      new THREE.Vector3(-32, 33, -250),  // frente casa central
      new THREE.Vector3(32, 33, -120)    // frente casa direita
    ];

    // Array para guardar os PointLights, caso precise manipular depois
    const pointLights = [];

    posicoesPostes.forEach(pos => {
      const pointLight = new THREE.PointLight(0xfff8c0, 6.5, 100, 0.7);
      pointLight.position.copy(pos);
      pointLight.castShadow = true;

      pointLight.shadow.mapSize.set(1024, 1024);
      pointLight.shadow.camera.near = 0.5;
      pointLight.shadow.camera.far = 100;

      // Indicador visual da luz
      const sphereGeo = new THREE.SphereGeometry(1.5, 16, 8);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xfff8c0 });
      const pointIndicator = new THREE.Mesh(sphereGeo, sphereMat);
      pointIndicator.position.copy(pos);

      scene.add(pointLight, pointIndicator);
      pointLights.push(pointLight);
    });

    // Apenas para referência no sistema de dia/noite
    currentLight = pointLights[0];

    // Luz ambiente
    ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

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

  // Atualiza o modo dia/noite
  aplicaDiaNoite(isNight);
}


/* ---------- GUI ---------- */
function criaGui() {
  const gui = new GUI();

  /* ---------- ESCALA ---------- */
  gui.add(parametrosGui, 'escala', 0.005, 0.05, 0.001)
    .name('Escala')
    .onChange(v => {
      Object.values(animals).forEach(animalArray => {
        animalArray.forEach(animal => {
          if (animal) animal.scale.setScalar(v);
        });
      });
    });

  /* ---------- ROTAÇÃO ---------- */
  gui.add(parametrosGui, 'rotY', -Math.PI, Math.PI, 0.01)
    .name('Rot Y')
    .onChange(v => {
      Object.values(animals).forEach(animalArray => {
        animalArray.forEach(animal => {
          if (animal) animal.rotation.y = v;
        });
      });
    });

  /* ---------- LUZ ---------- */
  gui.add(parametrosGui, 'luz', ['Directional', 'Point'])
    .name('Tipo Luz')
    .onChange(v => {
      createLight(v);

      if (gui.__folders['SpotLight Config']) {
        gui.removeFolder(gui.__folders['SpotLight Config']);
      }

      aplicaDiaNoite(isNight);
    });

  /* ---------- LOBO | ANIMAÇÕES ---------- */
  const wolfFolder = gui.addFolder('🐺 Lobo');

  const wolfGuiParams = {
    animacao: ''
  };

  // ⚠️ As animações só existem DEPOIS do FBX carregar
  const intervalo = setInterval(() => {
    const nomes = Object.keys(wolfActions);

    if (nomes.length > 0) {
      wolfGuiParams.animacao = nomes[0];

      wolfFolder
        .add(wolfGuiParams, 'animacao', nomes)
        .name('Animação')
        .onChange(nome => {
          trocarAnimacaoLobo(nome);
        });

      wolfFolder.open();
      clearInterval(intervalo);
    }
  }, 200);
}


function carregaAnimal({ nome, fbxPath, scale, positions, targetArray, texturePath }) {
  const loader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  console.group(`🐭 Carregando ${nome} (FBX)`);

  loader.load(
    fbxPath,
    fbx => {
      // Carrega textura se fornecida
      let textura = null;
      if (texturePath) {
        textura = texLoader.load(texturePath);
      }

      fbx.traverse(child => {
        if (child.isMesh) {
          child.visible = true;
          child.castShadow = true;
          child.receiveShadow = true;

          // aplica textura, se existir
          if (textura) {
            child.material.map = textura;
            child.material.needsUpdate = true;
          }
        }
      });

      fbx.scale.setScalar(scale);

      positions.forEach((pos, index) => {
        const clone = fbx.clone(true);
        clone.position.copy(pos);
        clone.position.y += 0.1;
        clone.scale.setScalar(scale);

        scene.add(clone);

        const mixer = new THREE.AnimationMixer(clone);
        clone.userData.mixer = mixer;
        clone.userData.actions = {};

        if (fbx.animations && fbx.animations.length > 0) {
          fbx.animations.forEach((clip, i) => {
            const actionName = clip.name || `anim_${i}`;
            const action = mixer.clipAction(clip);
            clone.userData.actions[actionName] = action;
          });
          const firstKey = Object.keys(clone.userData.actions)[0];
          if (firstKey) clone.userData.actions[firstKey].play();
        }

        targetArray.push(clone);
        console.log(`➕ ${nome} #${index + 1} em`, pos.toArray());
      });

      console.log(`✔ Total de ${nome}s na cena: ${targetArray.length}`);
      console.groupEnd();
    },
    undefined,
    err => {
      console.error(`❌ Erro ao carregar ${nome}:`, err);
      console.groupEnd();
    }
  );
}


function carregaCasaFBX({ fbxPath, texturePath, scale, position, doOutroLado = false, onLoad }) {
  const loader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  loader.load(fbxPath, fbx => {
    const texture = texLoader.load(texturePath);

    fbx.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
      }
    });

    fbx.scale.setScalar(scale);
    fbx.position.copy(position);

    // aplica rotação baseada no lado da rua
    fbx.rotation.y = doOutroLado ? -Math.PI / 2 : Math.PI / 2;

    scene.add(fbx);
    console.log('✔ Casa carregada com textura na cena');

    if (onLoad) onLoad(fbx); // retorna referência do objeto
  },
  undefined,
  err => {
    console.error('❌ Erro ao carregar casa:', err);
  });
}

function carregaPoste({ objPath, mtlPath, scale, position }) {
  const mtlLoader = new MTLLoader();
  mtlLoader.load(mtlPath, materials => {
    materials.preload(); // pré-carrega os materiais

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials); // aplica os materiais ao OBJ
    objLoader.load(objPath, obj => {
      obj.scale.setScalar(scale);
      obj.position.copy(position);
      obj.castShadow = true;
      obj.receiveShadow = true;

      scene.add(obj);
      console.log('✔ Poste carregado na cena');
    },
    undefined,
    err => {
      console.error('❌ Erro ao carregar poste:', err);
    });
  });
}





/* ---------- INPUT ---------- */
let moveDirection = 0; // frente/trás
let sideDirection = 0; // esquerda/direita

function moveAnimals() {
  // Percorre todos os animais de todos os tipos
  Object.values(animals).forEach(animalArray => {
    animalArray.forEach(animal => {
      if (!animal) return;

      // Movimento frente/trás (Z)
      animal.position.z += moveDirection * 0.5;

      // Movimento lateral (X)
      animal.position.x += sideDirection * 0.5;
    });
  });
}

function onKeyDown(e) {
  const code = e.code || e.key;

  // Frente/trás
  if (code === 'KeyW' || code === 'ArrowUp') moveDirection = 1;
  else if (code === 'KeyS' || code === 'ArrowDown') moveDirection = -1;

  // Lateral
  if (code === 'KeyA') sideDirection = -1; // esquerda
  else if (code === 'KeyD') sideDirection = 1; // direita

  moveAnimals();
}

function onKeyUp(e) {
  const code = e.code || e.key;

  // Z: frente/trás
  if (code === 'KeyW' || code === 'ArrowUp' || code === 'KeyS' || code === 'ArrowDown') moveDirection = 0;

  // X: esquerda/direita
  if (code === 'KeyA' || code === 'KeyD') sideDirection = 0;
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


/* ---------- DIA/NOITE (NOVO) ---------- */
function criaSolELua() {
  // Sol
  const sunGeo = new THREE.SphereGeometry(3.5, 24, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0 });
  sunMesh = new THREE.Mesh(sunGeo, sunMat);

  // Lua
  const moonGeo = new THREE.SphereGeometry(3.0, 24, 16);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xcfd8ff });
  moonMesh = new THREE.Mesh(moonGeo, moonMat);

  // posições iniciais (dentro do far=500 da câmera)
  sunMesh.position.set(180, 160, -120);
  moonMesh.position.set(-180, 140, -140);

  scene.add(sunMesh, moonMesh);
}

function criaBotaoDiaNoite() {
  if (document.getElementById('btn-dia-noite')) return;

  const btn = document.createElement('button');
  btn.id = 'btn-dia-noite';
  btn.textContent = '🌙 Noite';

  btn.style.position = 'fixed';
  btn.style.left = '16px';
  btn.style.bottom = '16px';
  btn.style.zIndex = '9999';
  btn.style.padding = '10px 12px';
  btn.style.borderRadius = '10px';
  btn.style.border = '1px solid rgba(255,255,255,0.25)';
  btn.style.background = 'rgba(0,0,0,0.45)';
  btn.style.color = '#fff';
  btn.style.cursor = 'pointer';
  btn.style.fontSize = '14px';
  btn.style.backdropFilter = 'blur(6px)';

  btn.addEventListener('click', () => {
    aplicaDiaNoite(!isNight);
    btn.textContent = isNight ? '☀️ Dia' : '🌙 Noite';
  });

  document.body.appendChild(btn);
}

function aplicaDiaNoite(night) {
  isNight = night;

  // céu
  scene.background = new THREE.Color(night ? 0x0b1026 : 0xcce0ff);

  // Sol / Lua
  if (sunMesh) sunMesh.visible = !night;
  if (moonMesh) moonMesh.visible = night;

  // opcional: esconde o indicador do PointLight pra não ficar “2 sóis”
  if (pointIndicator) pointIndicator.visible = false;

  // luz ambiente
  if (ambientLight) {
    ambientLight.color.setHex(night ? 0x1a1f3a : 0x404040);
    ambientLight.intensity = night ? 0.18 : 0.6;
  }

  // luz principal
  if (currentLight) {
    if (currentLight.isDirectionalLight) {
      currentLight.color.setHex(night ? 0x8ab4ff : 0xffffff);
      currentLight.intensity = night ? 0.35 : 1.2;

      // direção do “sol”/“lua”
      currentLight.position.set(night ? -120 : 140, night ? 140 : 170, 120);

      // posiciona o sol/lua próximo da direção (visual)
      if (!night && sunMesh) sunMesh.position.copy(currentLight.position);
      if (night && moonMesh) moonMesh.position.copy(currentLight.position);

    } else if (currentLight.isPointLight) {
      currentLight.color.setHex(night ? 0xb0c7ff : 0xffffff);
      currentLight.intensity = night ? 0.9 : 1.6;

    } else if (currentLight.isSpotLight) {
      currentLight.color.setHex(night ? 0xb0c7ff : 0xffffff);
      currentLight.intensity = night ? 0.9 : 1.8;
    }
  }

  if (lightHelper && lightHelper.update) lightHelper.update();
}

 // ciclo/circuito de movimentação
function moveAlongPath(agent, delta) {
  if (!agent.path || agent.path.length < 2) {
    console.warn('⚠ Caminho inválido para agente:', agent);
    return;
  }

  const path = agent.path;

  agent.progress += agent.speed * delta;

  if (agent.progress >= path.length) {
    agent.progress -= path.length;
  }

  const index = Math.floor(agent.progress);
  const nextIndex = (index + 1) % path.length;

  const current = path[index];
  const next = path[nextIndex];

  if (!current || !next) {
    console.error('❌ Ponto inválido no caminho', { index, nextIndex, path });
    return;
  }

  const t = agent.progress - index;
  agent.mesh.position.lerpVectors(current, next, t);

  const dir = next.clone().sub(current).normalize();
  agent.mesh.lookAt(agent.mesh.position.clone().add(dir));
}

function applyRunMotion(agent, time) {
  if (!agent.mesh) return;

  // parâmetros por espécie
  let bounce = 0.1;
  let sway = 0.04;

  if (agent.mesh === animals.rats[0]) {
    bounce = 0.14;
    sway = 0.06;
  } else if (agent.mesh === animals.cats[0]) {
    bounce = 0.11;
    sway = 0.045;
  } else if (agent.mesh === animals.dogs[0]) {
    bounce = 0.08;
    sway = 0.03;
  }

  // movimento vertical (passadas)
  agent.mesh.position.y =
    -5.8 + Math.abs(Math.sin(time * 8)) * bounce;

  // inclinação lateral (peso)
  agent.mesh.rotation.z =
    Math.sin(time * 6) * sway;
}



/* ---------- LOOP ---------- */
function loop() {
  const delta = clock.getDelta();

  // ===== PERSEGUIÇÃO =====
  chaseChain.forEach(agent => {
    moveAlongPath(agent, delta);
  });

  // animações (se existirem futuramente)
  if (mixer) mixer.update(delta);

  controls.update();
  renderer.render(scene, camera);
}

function adicionaLuzPoste(position) {
  // Mesmos parâmetros do PointLight do createLight
  const cor = 0xfff8c0;
  const intensidade = 6.5;
  const alcance = 100;
  const decay = 0.7;

  const pointLight = new THREE.PointLight(cor, intensidade, alcance, decay);
  pointLight.position.copy(position);
  pointLight.castShadow = true;

  pointLight.shadow.mapSize.set(1024, 1024);
  pointLight.shadow.camera.near = 0.5;
  pointLight.shadow.camera.far = 100;

  // Indicador visual da luz (opcional)
  const sphereGeo = new THREE.SphereGeometry(1.5, 16, 8);
  const sphereMat = new THREE.MeshBasicMaterial({ color: cor });
  const pointIndicator = new THREE.Mesh(sphereGeo, sphereMat);
  pointIndicator.position.copy(position);

  scene.add(pointLight, pointIndicator);
  

  return pointLight; // caso queira manipular depois
}

function carregaLobo() {
  const loader = new FBXLoader();
  const texLoader = new THREE.TextureLoader();

  const wolfTextures = {
  body: texLoader.load('assets/textures/Wolf_Body.jpg'),
  fur: texLoader.load('assets/textures/Wolf_Fur.jpg'),
  eyes1: texLoader.load('assets/textures/Wolf_Eyes_1.jpg'),
  eyes2: texLoader.load('assets/textures/Wolf_Eyes_2.jpg')
};


  loader.load(
    'assets/animals/Wolf.fbx', // ajuste o path exato
    obj => {
        obj.traverse(child => {
  if (!child.isSkinnedMesh) return;

  child.castShadow = true;
  child.receiveShadow = true;

  const mat = child.material;

  // GARANTIAS ABSOLUTAS
  mat.skinning = true;
  mat.transparent = false;
  mat.opacity = 1;
  mat.side = THREE.FrontSide;
  mat.color.set(0xffffff);

  const name = (mat.name || '').toLowerCase();

  if (name.includes('body')) {
    mat.map = wolfTextures.body;
  }

  if (name.includes('fur')) {
    mat.map = wolfTextures.fur;
  }

  if (name.includes('eye')) {
    mat.map = wolfTextures.eyes1;
  }

  mat.needsUpdate = true;
});




      /* ---------- TRANSFORM ---------- */
      obj.scale.setScalar(0.2);        // ajuste fino depois
      obj.position.set(0, -5.8, 30);   // chão + posição no cenário
      obj.rotation.y = Math.PI;         // geralmente necessário

      scene.add(obj);
      wolf = obj;

      /* ---------- ANIMAÇÕES ---------- */
      wolfMixer = new THREE.AnimationMixer(obj);

      const clips = obj.animations || [];
      console.log('Animações do lobo:', clips.map(c => c.name));

      clips.forEach(clip => {
        wolfActions[clip.name] = wolfMixer.clipAction(clip);
      });

      // animação padrão
      if (clips.length > 0) {
        wolfActiveAction = wolfActions[clips[0].name];
        wolfActiveAction.play();
      }
    },
    xhr => {
      if (xhr.total) {
        console.log(
          `Carregando lobo: ${((xhr.loaded / xhr.total) * 100).toFixed(1)}%`
        );
      }
    },
    err => {
      console.error('Erro ao carregar lobo:', err);
    }
  );
}




function carregaAnimacaoLobo(nome, path) {
  const loader = new FBXLoader();

  loader.load(path, anim => {
    const clip = anim.animations[0];
    const action = wolfMixer.clipAction(clip);

    wolfActions[nome] = action;

    // Primeira animação padrão
    if (!wolfActiveAction) {
      wolfActiveAction = action;
      action.play();
    }
  });
}



function trocarAnimacaoLobo(nome, fade = 0.25) {
  const nova = wolfActions[nome];
  if (!nova || nova === wolfActiveAction) return;

  nova.reset().play();

  if (wolfActiveAction) {
    wolfActiveAction.crossFadeTo(nova, fade, false);
  }

  wolfActiveAction = nova;
}



function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (wolfMixer) wolfMixer.update(delta);

  renderer.render(scene, camera);
}






/* ---------- RESIZE ---------- */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}



