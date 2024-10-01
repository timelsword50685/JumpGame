"use strict";

const MIN_GRID_SIZE = 4;
const MAX_GRID_SIZE = 8;

let scene, camera, renderer;
let rabbit, carrot;
let gridSize = getRandomGridSize(); // 隨機生成初始格子大小
let commands = []; // 用於存儲指令

let rabbitTextures = [];
let currentFrame = 0;
let frameCount = 1; // 假設 GIF 分成 10 幀
let animationSpeed = 100; // 每幀間隔 100 毫秒

// 定義全局變數
let textures = []; // 定義全局的 textures 數組
let currentBackgroundIndex = 0; // 當前背景紋理索引
let backgroundSwitchTime = 500; // 背景切換時間間隔，單位：毫秒
let lastBackgroundSwitchTime = 0; // 上一次切換背景的時間

init();
animate();

function init() {
    // 載入兔子的 GIF 幀
    loadCubeTextures();
    
    // 建立場景
    scene = new THREE.Scene();

    const imagePaths = [
        '/pictures/background/GAME_sky1_0.png',
        '/pictures/background/GAME_sky2_0.png',
        '/pictures/background/GAME_sky3_0.png',
    ];

    const textureLoader = new THREE.TextureLoader();
    let texturesLoaded = 0;    

    // 加載每張圖片
    imagePaths.forEach((path, index) => {
        textureLoader.load(path, (texture) => {
            textures[index] = texture; // 使用全局的 textures 陣列
            texturesLoaded++;

            // 當所有圖片加載完畢後執行某個操作
            if (texturesLoaded === imagePaths.length) {
                setBackground(); // 設置初始背景
            }
        });
    });

    function setBackground() {
        // 設置初始背景
        scene.background = textures[currentBackgroundIndex]; // 使用全局的 textures
    }
    const radius = 7; // 假設相機與場景的距離是 7
    const angle = Math.PI / 4; // 45 度角



    // 建立相機
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const height = 5; // 視角高度，可以調整這個值以控制視角的俯視角度
    // 設置相機繞 Y 軸旋轉 45 度向左 (逆時針旋轉)
    camera.position.set(radius * Math.sin(angle), height, radius * Math.cos(angle));
    camera.lookAt(0, 0, 0); // 確保相機仍然對準場景中心

    // 建立渲染器
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 設置按鈕監聽事件
    document.getElementById('left').addEventListener('click', () => addCommand('left'));
    document.getElementById('up').addEventListener('click', () => addCommand('up'));
    document.getElementById('down').addEventListener('click', () => addCommand('down'));
    document.getElementById('right').addEventListener('click', () => addCommand('right'));
    document.getElementById('confirm').addEventListener('click', executeCommands);
}

function loadCubeTextures() {
    const loader = new THREE.TextureLoader();
    
    const texturePaths = [
        '/pictures/chicken/C_face_0.png',
        '/pictures/chicken/C_back_0.png',
        '/pictures/chicken/C_top_0.png',
        '/pictures/chicken/C_bottom_0.png',
        '/pictures/chicken/GAME_right_0.png',
        '/pictures/chicken/GAME_left_0.png',                                  
    ];

    let texturesLoaded = 0;

    for (let i = 0; i < texturePaths.length; i++) {
        loader.load(texturePaths[i], (texture) => {
            rabbitTextures[i] = texture; // 使用 rabbitTextures 陣列
            texturesLoaded++;

            if (texturesLoaded === texturePaths.length) {
                const materials = rabbitTextures.map(tex => new THREE.MeshBasicMaterial({ map: tex }));
                rabbit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials); // 創建兔子
                rabbit.position.set(0, 0.5, 0); // 初始位置

                scene.add(rabbit);

                createFloorAndObjects();  // 等到 rabbit 初始化後再創建場景
            }
        });
    }
}

function createFloorAndObjects() {
    // 只清除除 rabbit 之外的其他物體
    scene.children = scene.children.filter(obj => obj === rabbit);

    // 創建地面
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 隨機生成紅蘿蔔的位置，並避免與兔子重疊
    let carrotPosition;
    do {
        carrotPosition = getRandomPosition();
    } while (carrotPosition.x === rabbit.position.x && carrotPosition.z === rabbit.position.z);
    
    carrot = createObject(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32), new THREE.MeshBasicMaterial({ color: 0xFF8C00 }), carrotPosition);
}

function createObject(geometry, material, position) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, 0.25, position.z);
    scene.add(mesh);
    return mesh;
}

function getRandomGridSize() {
    return Math.floor(Math.random() * (MAX_GRID_SIZE - MIN_GRID_SIZE + 1)) + MIN_GRID_SIZE;
}

function getRandomPosition() {
    const halfGridSize = gridSize / 2 - 0.5;
    const x = Math.floor(Math.random() * gridSize) - halfGridSize;
    const z = Math.floor(Math.random() * gridSize) - halfGridSize;
    return { x, z };
}

function addCommand(direction) {
    commands.push(direction);
    displayCommands();
}

function displayCommands() {
    const commandList = document.getElementById('commandList');
    commandList.innerHTML = commands.join(' -> ');
}

function executeCommands() {
    let currentIndex = 0;

    function executeNextCommand() {
        if (currentIndex >= commands.length) {
            commands = []; // 清空命令
            displayCommands();
            return; // 所有命令執行完畢
        }

        const direction = commands[currentIndex];
        currentIndex++;

        // 根據命令移動兔子
        switch (direction) {
            case 'up':
                moveRabbit(0, -1);
                break;
            case 'down':
                moveRabbit(0, 1);
                break;
            case 'left':
                moveRabbit(-1, 0);
                break;
            case 'right':
                moveRabbit(1, 0);
                break;
        }

        setTimeout(executeNextCommand, 500); // 每個命令間隔 500 毫秒
    }

    executeNextCommand();
}

function moveRabbit(deltaX, deltaZ) {
    if (!rabbit) {
        console.error("Rabbit is not initialized.");
        return;
    }

    const jumpHeight = 0.5; // 跳躍的高度
    const jumpDuration = 500; // 跳躍動作持續時間（毫秒）
    const startTime = Date.now();
    const startX = rabbit.position.x;
    const startZ = rabbit.position.z;
    const targetX = startX + deltaX;
    const targetZ = startZ + deltaZ;

    function updateJump() {
        const elapsedTime = Date.now() - startTime;
        const t = elapsedTime / jumpDuration; // 時間進度，從 0 到 1

        if (t >= 1) {
            // 跳躍結束，固定位置
            rabbit.position.x = targetX;
            rabbit.position.z = targetZ;
            rabbit.position.y = rabbit.geometry.parameters.height / 2; // 回到地面
            checkCarrotCollision(); // 檢查是否碰到紅蘿蔔
        } else {
            // 計算新的位置，模擬跳躍過程
            rabbit.position.x = startX + deltaX * t;
            rabbit.position.z = startZ + deltaZ * t;
            rabbit.position.y = Math.sin(t * Math.PI) * jumpHeight + rabbit.geometry.parameters.height / 2; // Y 軸位置根據正弦函數變化

            requestAnimationFrame(updateJump); // 繼續更新跳躍動作
        }
    }

    requestAnimationFrame(updateJump);
}

function checkCarrotCollision() {
    if (rabbit.position.distanceTo(carrot.position) < 0.8) {
        console.log("小雞吃到了蟲蟲！");
        alert("小雞吃到了蟲蟲！");
        gridSize = getRandomGridSize();
        createFloorAndObjects(); // 重置場景
    }
}    

function animate() {
    requestAnimationFrame(animate);

    // 更新兔子的材質以模擬動畫
    if (rabbit && rabbitTextures.length > 0) {
        currentFrame = (currentFrame + 1) % frameCount;
        rabbit.material.map = rabbitTextures[currentFrame];
        rabbit.material.needsUpdate = true;  // 確保材質更新
    }

    // 背景循環播放
    if (textures.length > 0) {
        const now = Date.now();
        if (now - lastBackgroundSwitchTime > backgroundSwitchTime) {
            currentBackgroundIndex = (currentBackgroundIndex + 1) % textures.length; // 確保 textures 不為空
            scene.background = textures[currentBackgroundIndex]; // 設置新的背景
            lastBackgroundSwitchTime = now; // 更新上次切換時間
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
