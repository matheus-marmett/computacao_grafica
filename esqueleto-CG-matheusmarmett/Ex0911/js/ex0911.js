    import * as THREE from 'three';

    let camera, scene, renderer;
    let objects = [];

    var criaSer = function(){
        const geometry = new THREE.BoxGeometry( 2, 10, 2 );
        const materials = [
            new THREE.MeshBasicMaterial({ color: 'White' }), // right
            new THREE.MeshBasicMaterial({ color: 'White' }), // left
            new THREE.MeshBasicMaterial({ color: 'White' }), // top
            new THREE.MeshBasicMaterial({ color: 'White' }), // bottom
            new THREE.MeshBasicMaterial({ color: 'White' }), // front
            new THREE.MeshBasicMaterial({ color: 'White' })  // back
        ];
        const material = materials;


        // ========================= TRONCO INFERIOR =========================

    let troncoInferior = new THREE.Object3D();
    scene.add(troncoInferior);

    let comprimento = 20; 
    let largura = 2;
    let profundidade = 4;

    let quadril = new THREE.Mesh(
        new THREE.BoxGeometry(largura, comprimento, profundidade),
        new THREE.MeshBasicMaterial({ color: 'White' })
    );

    troncoInferior.add(quadril);

    objects["troncoInferior"] = troncoInferior;

    // ========================= CINTURA =========================
    let cintura = new THREE.Object3D();

    // posiciona na base do tronco inferior
    cintura.position.y = -comprimento / 2;
    troncoInferior.add(cintura);

    let larguraCintura = 11;
    let alturaCintura = 2;
    let profundidadeCintura = 4;

    let meshCintura = new THREE.Mesh(
        new THREE.BoxGeometry(larguraCintura, alturaCintura, profundidadeCintura),
        new THREE.MeshBasicMaterial({ color: 'White' })
    );

    // centraliza o mesh dentro do Object3D
    meshCintura.position.y = alturaCintura / 2;

    cintura.add(meshCintura);
    objects["cintura"] = cintura;

    // ========================= PERNA ESQUERDA =========================

    let quadrilEsq = new THREE.Mesh(
        new THREE.SphereGeometry(2, 32, 32),
        new THREE.MeshBasicMaterial({ color: 'Gray' })
    );
    objects["quadrilEsq"] = quadrilEsq;

    quadrilEsq.position.x = -4;
    quadrilEsq.position.y = 1; 
    cintura.add(quadrilEsq);

    let pivoCoxaEsq = new THREE.Group();
    quadrilEsq.add(pivoCoxaEsq);

    let coxaEsq = new THREE.Mesh(
        new THREE.BoxGeometry(2, 7, 2),
        new THREE.MeshBasicMaterial({ color: 'White' })
    );
    pivoCoxaEsq.add(coxaEsq);
    coxaEsq.position.y -= 5; // posição em relação ao pivô
    objects["pivoCoxaEsq"] = pivoCoxaEsq;

    // ========================= PERNA DIREITA =========================
    let quadrilDir = new THREE.Mesh(
        new THREE.SphereGeometry(2, 32, 32),
        new THREE.MeshBasicMaterial({ color: 'Gray' })
    );
    objects["quadrilDir"] = quadrilDir;

    quadrilDir.position.x = 4;
    quadrilDir.position.y = 1;
    cintura.add(quadrilDir);

    let pivoCoxaDir = new THREE.Group();
    quadrilDir.add(pivoCoxaDir);

    let coxaDir = new THREE.Mesh(
        new THREE.BoxGeometry(2, 7, 2),
        new THREE.MeshBasicMaterial({ color: 'White' })
    );
    pivoCoxaDir.add(coxaDir);
    coxaDir.position.y -= 5;
    objects["pivoCoxaDir"] = pivoCoxaDir;

    // ========================= JOELHO E CANELA PERNA ESQUERDA =========================

    let joelhoEsq = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 32, 32),
        new THREE.MeshBasicMaterial({ color: 'Gray' })
    );
    objects["joelhoEsq"] = joelhoEsq;

    joelhoEsq.position.y = -7.5; 
    pivoCoxaEsq.add(joelhoEsq);

    let pivoCanelaEsq = new THREE.Group();
    joelhoEsq.add(pivoCanelaEsq);

    let canelaEsq = new THREE.Mesh(
        new THREE.BoxGeometry(2, 8, 2),
        new THREE.MeshBasicMaterial({ color: 'White' })
    );
    pivoCanelaEsq.add(canelaEsq);
    canelaEsq.position.y = -5; // posiciona abaixo do pivô
    objects["pivoCanelaEsq"] = pivoCanelaEsq;

    // ========================= JOELHO E CANELA PERNA DIREITA =========================

    let joelhoDir = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 32, 32),
        new THREE.MeshBasicMaterial({ color: 'Gray' })
    );
    objects["joelhoDir"] = joelhoDir;

    joelhoDir.position.y = -7.5; 
    pivoCoxaDir.add(joelhoDir);

    let pivoCanelaDir = new THREE.Group();
    joelhoDir.add(pivoCanelaDir);

    let canelaDir = new THREE.Mesh(
        new THREE.BoxGeometry(2, 8, 2),
        new THREE.MeshBasicMaterial({ color: 'White' })
    );
    pivoCanelaDir.add(canelaDir);
    canelaDir.position.y = -5;
    objects["pivoCanelaDir"] = pivoCanelaDir;


    // ========================= TRONCO SUPERIOR =========================

    let troncoSuperior = new THREE.Object3D();
    troncoSuperior.position.y = 5; 
    troncoInferior.add(troncoSuperior);

    let peito = new THREE.Mesh(
        new THREE.BoxGeometry( 16, 2, 4 ), 
        new THREE.MeshBasicMaterial({ color: 'White' })
    );
    troncoSuperior.add(peito);
    peito.position.y = 2;
    objects["troncoSuperior"] = troncoSuperior;
    objects["peito"] = peito;

    // ========================= CABEÇA (CAVEIRA :D) =========================

    let loader = new THREE.TextureLoader();
    loader.load('caveira2.png', function(texture){
        let materialCabeca = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true
        });

        let cabeca = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 12), 
            materialCabeca
        );

        cabeca.position.y = 6; 
        cabeca.position.z = 2;  
        cabeca.frustumCulled = false; 
        troncoSuperior.add(cabeca);

        objects["cabeca"] = cabeca;
    });


    // ========================= BRAÇO ESQUERDO =========================

    let sphere = new THREE.Mesh(  
        new THREE.SphereGeometry( 2, 32, 32 ),
        new THREE.MeshBasicMaterial({ color: 'Gray' } ) 
    );
    objects["ombro"] = sphere;
    troncoSuperior.add(sphere); 

    sphere.position.x = -8;
    sphere.position.y = 2;

    let pivoOmbro = new THREE.Group();
    sphere.add(pivoOmbro);

    let cube = new THREE.Mesh( geometry, material );
    pivoOmbro.add(cube);
    objects["pivoOmbro"] = (pivoOmbro);
    objects["cubo1"] = (cube);
    cube.position.y-=5;

    let cotovelo = new THREE.Mesh(  
        new THREE.SphereGeometry( 1.5, 32, 32 ),
        new THREE.MeshBasicMaterial({ color: 'Gray' } ) 
    );
    objects["cotovelo"] = cotovelo;
    cotovelo.position.y-=4.5;
    cube.add(cotovelo);

    let pivoCotovelo = new THREE.Group();
    cotovelo.add(pivoCotovelo);

    let antebracoEsq = new THREE.Mesh( geometry, material );
    pivoCotovelo.add(antebracoEsq);
    antebracoEsq.position.y-= 5;
    objects["pivoCotovelo"] = (pivoCotovelo);

    // ========================= BRAÇO DIREITO =========================

    let sphere2 = new THREE.Mesh(  
        new THREE.SphereGeometry( 2, 32, 32 ),
        new THREE.MeshBasicMaterial({ color: 'Gray' } ) 
    );
    objects["ombro2"] = sphere2;
    troncoSuperior.add(sphere2); 

    sphere2.position.x = 8;
    sphere2.position.y = 2;

    let pivoOmbro2 = new THREE.Group();
    sphere2.add(pivoOmbro2);

    let cube2 = new THREE.Mesh( geometry, material );
    pivoOmbro2.add(cube2);
    objects["pivoOmbro2"] = (pivoOmbro2);
    objects["cubo2"] = (cube2);
    cube2.position.y-=5;

    let cotovelo2 = new THREE.Mesh(  
        new THREE.SphereGeometry( 1.5, 32, 32 ),
        new THREE.MeshBasicMaterial({ color: 'Gray' } ) 
    );
    objects["cotovelo2"] = cotovelo2;
    cotovelo2.position.y-=4.5;
    cube2.add(cotovelo2);

    let pivoCotovelo2 = new THREE.Group();
    cotovelo2.add(pivoCotovelo2);

    let antebracoDir = new THREE.Mesh( geometry, material );
    pivoCotovelo2.add(antebracoDir);
    antebracoDir.position.y-= 5;
    objects["pivoCotovelo2"] = (pivoCotovelo2);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

export function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    criaSer();

    camera.position.z = 40;
    renderer.setAnimationLoop(nossaAnimacao);

    document.body.appendChild(renderer.domElement);
    renderer.render(scene, camera);

    document.addEventListener('keydown', onKeyDown);

    document.addEventListener('mousemove', makeMove);
    document.addEventListener('mouseup', clickOn);
    document.addEventListener('mousedown', clickOff);

    window.addEventListener('resize', onWindowResize); 
}

// ======================== Movimentação pelo mouse ======================== //

    var click = false;
    var mousePosition = {
        x: 0,
        y: 0,
        z: 0
    };

    var makeMove = function(e){
        let deltaX = mousePosition.x - e.offsetX ;
        let deltaY = mousePosition.y - e.offsetY ;
        console.log("X ->" + deltaX + "Y ->" + deltaY);

        let eulerMat = new THREE.Euler(toRadians(deltaX)*0.01, toRadians(deltaY)*0.01, 0, "XYZ");
        let quater = new THREE.Quaternion().setFromEuler(eulerMat);
        camera.quaternion.multiplyQuaternions(quater,camera.quaternion);

            mousePosition = {
            x: e.offsetX,
            y: e.offsetY,
            }
    }

    var clickOff = function(e){
        mousePosition = {
            x: e.offsetX,
            y: e.offsetY,
            
        }
    }

    var clickOn = function(e){
        console.log(mousePosition);
        
    
    }

    var toRadians = function(value){
        return value*(Math.PI/180);
    }

// ========================= VARIÁVEIS DE VELOCIDADE =========================

var velOmbro = 0.01;
var velCotovelo = 0.01;
var velOmbro2 = 0.01;
var velCotovelo2 = 0.01;

var velQuadrilEsq = 0.01;
var velJoelhoEsq = 0.01;
var velQuadrilDir = 0.01;
var velJoelhoDir = 0.01;

var onKeyDown = function (e){
    if (e.keyCode == 82){ // R - move braço esquerdo
         objects["pivoOmbro"].rotation.x-= velOmbro;
         if (objects["pivoOmbro"].rotation.x < -1.62 || objects["pivoOmbro"].rotation.x > 0.9)
            velOmbro*=-1;
    }

    if (e.keyCode == 84){ // T - move braço direito
         objects["pivoOmbro2"].rotation.x-= velOmbro2;
         if (objects["pivoOmbro2"].rotation.x < -1.62 || objects["pivoOmbro2"].rotation.x > 0.9)
            velOmbro2*=-1;
    }

    if (e.keyCode == 71){ // G move coxa direita
        objects["pivoCoxaDir"].rotation.x-= velQuadrilDir;
        if(objects["pivoCoxaDir"].rotation.x < -1.62 || objects["pivoCoxaDir"].rotation.x > 0.9)
            velQuadrilDir*=-1;
    }

    if (e.keyCode == 70){ // F move coxa esquerda
        objects["pivoCoxaEsq"].rotation.x-= velQuadrilEsq;
        if(objects["pivoCoxaEsq"].rotation.x < -1.62 || objects["pivoCoxaEsq"].rotation.x > 0.9)
            velQuadrilEsq*=-1;
    }

    if (e.keyCode == 32) { // space pausa animação por completo
        velCotovelo = velCotovelo == 0 ? 0.01 : 0;
        velCotovelo2 = velCotovelo2 == 0 ? 0.01 : 0;
        velJoelhoEsq = velJoelhoEsq == 0 ? 0.01 : 0;
        velJoelhoDir = velJoelhoDir == 0 ? 0.01 : 0;
    }
}

var nossaAnimacao = function () {
    // braço esquerdo (cotovelo)
    objects["pivoCotovelo"].rotation.x-= velCotovelo;
    if (objects["pivoCotovelo"].rotation.x < -2.14 || objects["pivoCotovelo"].rotation.x > 1.3)
        velCotovelo*=-1;
         
    // braço direito (cotovelo)
    objects["pivoCotovelo2"].rotation.x-= velCotovelo2;
    if (objects["pivoCotovelo2"].rotation.x < -2.14 || objects["pivoCotovelo2"].rotation.x > 1.3)
        velCotovelo2*=-1;

    // perna esquerda (joelho)
    objects["pivoCanelaEsq"].rotation.x-= velJoelhoEsq;
    if (objects["pivoCanelaEsq"].rotation.x < -0.25 || objects["pivoCanelaEsq"].rotation.x > 1.4)
        velJoelhoEsq*=-1;

    // perna direita (joelho)
    objects["pivoCanelaDir"].rotation.x-= velJoelhoDir;
    if (objects["pivoCanelaDir"].rotation.x < -0.25 || objects["pivoCanelaDir"].rotation.x > 1.4)
        velJoelhoDir*=-1;

    renderer.render( scene, camera );
}
