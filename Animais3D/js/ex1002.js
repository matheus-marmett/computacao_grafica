import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let camera, scene, renderer;
let objects = {};
let parametrosGui;

// ======== GUI dinâmico ========
var createGui = function() {
    const gui = new GUI();

    parametrosGui = {
        escala: 1,
        rotacaoY: 0,
        opt: 'Origem'
    };

    const folder = gui.addFolder("Controle");

    folder.add(parametrosGui, 'escala', 0.1, 8, 0.01)
        .name("Escala")
        .onChange(function(value) {
            const animalNome = parametrosGui.opt.toLowerCase();
            if (objects[animalNome]) {
                const obj = objects[animalNome];
                if (!obj.userData.escalaBase) obj.userData.escalaBase = obj.scale.x;
                obj.scale.set(
                    obj.userData.escalaBase * value,
                    obj.userData.escalaBase * value,
                    obj.userData.escalaBase * value
                );
            }
        });

    folder.add(parametrosGui, 'rotacaoY', -Math.PI, Math.PI, 0.01)
        .name("Rotação Y")
        .onChange(function(value) {
            const animalNome = parametrosGui.opt.toLowerCase();
            if (objects[animalNome]) {
                objects[animalNome].rotation.y = value;
                objects[animalNome].userData.rotacaoY = value;
            }
        });

    folder.open();

    const options = ['Origem', 'Lobão', 'Gato', 'Aranha', 'Alien', 'Cavalo', 'T-Rex'];
    gui.add(parametrosGui, 'opt')
        .options(options)
        .name("Olhar para")
        .onChange(function(value) {
            if (objects[value.toLowerCase()]) {
                camera.lookAt(objects[value.toLowerCase()].position);

                const obj = objects[value.toLowerCase()];
                parametrosGui.escala = obj.scale.x / (obj.userData.escalaBase || 1);
                parametrosGui.rotacaoY = obj.rotation.y;
                folder.updateDisplay();
            } else {
                camera.lookAt(new THREE.Vector3(0, 0, 0));
            }
        });
};

// ======== Carregamento de OBJ + texturas ========
function carregarAnimal(nome, arquivo, pos, escalaBase = 20) {
    const objLoader = new OBJLoader();

    objLoader.load(
        `assets/${arquivo}`,
        function(obj) {
            obj.traverse(function(child) {
                if (child instanceof THREE.Mesh) {

                    // ======== Para animais sem geometria UV (cavalo e lobão) ========
                    if (!child.geometry.attributes.uv) {
                        child.geometry.computeBoundingBox();
                        const box = child.geometry.boundingBox;
                        const size = new THREE.Vector3();
                        box.getSize(size);
                        const uv = new Float32Array(child.geometry.attributes.position.count * 2);

                        for (let i = 0; i < child.geometry.attributes.position.count; i++) {
                            const x = child.geometry.attributes.position.getX(i);
                            const y = child.geometry.attributes.position.getY(i);
                            const z = child.geometry.attributes.position.getZ(i);
                            uv[i * 2] = (x - box.min.x) / size.x;
                            uv[i * 2 + 1] = (z - box.min.z) / size.z;
                        }
                        child.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
                    }

                    // ======== Texturas específicas ========
                    let material;
                    const texLoader = new THREE.TextureLoader();

                    function criarMaterial(caminho, rough, metal, repeat = 1) {
                        const textura = texLoader.load(caminho);
                        textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
                        textura.repeat.set(repeat, repeat);
                        textura.anisotropy = 16;
                        textura.colorSpace = THREE.SRGBColorSpace;
                        return new THREE.MeshStandardMaterial({
                            map: textura,
                            roughness: rough,
                            metalness: metal
                        });
                    }

                    const nomeLower = nome.toLowerCase();
                    if (nomeLower === 'gato') {
                        material = criarMaterial('assets/textura1tijolo.jpg', 1.0, 0.0, 2);
                    } 
                    else if (nomeLower === 'lobão') {
                        material = criarMaterial('assets/textura2holografico.jpg', 0.3, 0.9, 3);
                    } 
                    else if (nomeLower === 'cavalo') {
                        material = criarMaterial('assets/textura3tyedie.jpg', 0.7, 0.3, 2);
                    } 
                    else if (nomeLower === 'aranha') {
                        material = criarMaterial('assets/textura4verde.jpg', 0.6, 0.4, 2);
                    } 
                    else if (nomeLower === 'alien') {
                        material = criarMaterial('assets/textura5mato.jpg', 0.8, 0.2, 3);
                    } 
                    else if (nomeLower === 't-rex') {
                        material = criarMaterial('assets/textura6roxo.jpg', 0.5, 0.6, 2);
                    } 
                    else {
                        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
                    }

                    child.material = material;
                }
            });

            // ===== Normalização =====
            const box = new THREE.Box3().setFromObject(obj);
            const tamanho = box.getSize(new THREE.Vector3());
            const maiorDimensao = Math.max(tamanho.x, tamanho.y, tamanho.z);
            const escalaFinal = escalaBase / maiorDimensao;
            obj.scale.set(escalaFinal, escalaFinal, escalaFinal);
            obj.userData.escalaBase = escalaFinal;
            obj.userData.rotacaoY = 0;

            obj.position.set(pos.x, pos.y, pos.z);
            scene.add(obj);
            objects[nome.toLowerCase()] = obj;
            console.log(`${nome} carregado!`);
        },
        function(progress) {
            console.log(`${nome}: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
        },
        function(error) {
            console.error(`Erro ao carregar ${nome}:`, error);
        }
    );
}

// ======== Lista de animais ========
const animais = [
    { nome: "Lobão", arquivo: "Wolf.obj", pos: {x: 90, y: 0, z: 0} },
    { nome: "Gato", arquivo: "cat.obj", pos: {x: 0, y: 0, z: -90} },
    { nome: "Aranha", arquivo: "Only_Spider_with_Animations_Export.obj", pos: {x: -90, y: 0, z: 0} },
    { nome: "Alien", arquivo: "Alien Animal.obj", pos: {x: 0, y: 0, z: 90} },
    { nome: "Cavalo", arquivo: "16267_American_Paint_Horse_Nuetral_new.obj", pos: {x: -90, y: 0, z: 90} },
    { nome: "T-Rex", arquivo: "T-Rex Model.obj", pos: {x: 90, y: 0, z: -90} },
];

var loadObj = function() {
    const escalaBase = 20;
    animais.forEach(a => carregarAnimal(a.nome, a.arquivo, a.pos, escalaBase));
};

// ======== Inicialização ========
export function init() {
    camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.z = 60;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 50, 50);
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createGui();
    loadObj();

    renderer.setAnimationLoop(() => renderer.render(scene, camera));

    document.addEventListener('mousemove', makeMove);
    document.addEventListener('mouseup', clickOn);
    document.addEventListener('mousedown', clickOff);

    window.addEventListener('resize', onWindowResize);
}

// ======== Controle de câmera ========
let click = false;
let mousePosition = { x: 0, y: 0 };

function makeMove(e) {
    if (click) {
        let deltaX = mousePosition.x - e.offsetX;
        let deltaY = mousePosition.y - e.offsetY;
        let euler = new THREE.Euler(toRadians(deltaY) * 0.1, toRadians(deltaX) * 0.1, 0, "YXZ");
        let quat = new THREE.Quaternion().setFromEuler(euler);
        camera.quaternion.multiplyQuaternions(quat, camera.quaternion);
    }
    mousePosition = { x: e.offsetX, y: e.offsetY };
}

function clickOff() { click = true; }
function clickOn() { click = false; }
function toRadians(value) { return value * (Math.PI / 180); }

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
