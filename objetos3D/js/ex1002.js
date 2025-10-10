import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

let camera, scene, renderer;
let objects = {}; // array q armazena todos os .obj
let parametrosGui;

// ======== GUI dinâmico ========
var createGui = function() {
    const gui = new GUI();

    parametrosGui = {
        escala: 1,          // multiplicador de escala
        rotacaoY: 0,        // rotação Y
        opt: 'Origem'       // animal selecionado
    };

    const folder = gui.addFolder("Controle");

    // Slider de escala
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

    // Slider de rotação Y
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

    // Dropdown de seleção do animal
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

// ======== Função para carregar OBJ com normalização ========
function carregarAnimal(nome, arquivo, pos, escalaBase = 20) {
    const objLoader = new OBJLoader();

    objLoader.load(
        `assets/${arquivo}`,
        function(obj) {
            obj.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshNormalMaterial();
                }
            });

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

// ======== Lista de animais e posições ========
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
    scene.add(new THREE.AmbientLight(0xffffff));

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createGui();
    loadObj();

    renderer.setAnimationLoop(nossaAnimacao);

    document.addEventListener('mousemove', makeMove);
    document.addEventListener('mouseup', clickOn);
    document.addEventListener('mousedown', clickOff);

    window.addEventListener('resize', onWindowResize);
}

// ======== Render loop ========
var nossaAnimacao = function() {
    renderer.render(scene, camera);
};

// ======== Movimentação da câmera ========
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

function clickOff() {
    click = true;
}

function clickOn() {
    click = false;
}

function toRadians(value) {
    return value * (Math.PI / 180);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
