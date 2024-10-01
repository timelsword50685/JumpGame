"use strict";

const MIN_GRID_SIZE = 6;
const MAX_GRID_SIZE = 10;

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
    const radius = 8; // 假設相機與場景的距離是 7
    const angle = Math.PI / 4; // 45 度角



    // 建立相機
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const height = 8; // 視角高度，可以調整這個值以控制視角的俯視角度
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
                rabbit.position.set(0, 1, 0); // 初始位置

                scene.add(rabbit);

                createFloorAndObjects();  // 等到 rabbit 初始化後再創建場景
            }
        });
    }
}

function createFloorAndObjects() {
    // 只清除除 rabbit 之外的其他物體
    scene.children = scene.children.filter(obj => obj === rabbit);

    // 加載地面紋理
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('/pictures/underground/GAME_grass_0.png'); // 替換為您的圖片路徑

    // 創建地面
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture }); // 使用加載的紋理
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
    const x = Math.floor(Math.random() * (gridSize - 2)) - (halfGridSize - 1); // 限制兔子不生成在邊界
    const z = Math.floor(Math.random() * (gridSize - 2)) - (halfGridSize - 1); // 同樣限制 z 軸位置
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
    const targetX = rabbit.position.x + deltaX;
    const targetZ = rabbit.position.z + deltaZ;

    const halfGridSize = gridSize / 2 - 0.5;

    // 檢查目標位置是否在範圍內
    if (targetX < -halfGridSize || targetX > halfGridSize || targetZ < -halfGridSize || targetZ > halfGridSize) {
        console.log("兔子嘗試跳出格子邊界，移動無效");
        return; // 如果目標位置超出範圍，則不執行移動
    }

    // 繼續進行跳躍的邏輯
    const jumpHeight = 0.5; // 跳躍的高度
    const jumpDuration = 500; // 跳躍動作持續時間（毫秒）
    const startTime = Date.now();
    const startX = rabbit.position.x;
    const startZ = rabbit.position.z;

    function updateJump() {
        const elapsedTime = Date.now() - startTime;
        const t = elapsedTime / jumpDuration; // 時間進度，從 0 到 1

        if (t >= 1) {
            rabbit.position.x = targetX;
            rabbit.position.z = targetZ;
            rabbit.position.y = rabbit.geometry.parameters.height / 2; // 回到地面

            checkCarrotCollision();  // 檢查是否撞到紅蘿蔔
            moveCarrotRandomly();    // 每次兔子移動後紅蘿蔔也隨機移動
        } else {
            rabbit.position.x = startX + deltaX * t;
            rabbit.position.z = startZ + deltaZ * t;
            rabbit.position.y = Math.sin(t * Math.PI) * jumpHeight + rabbit.geometry.parameters.height / 2;

            requestAnimationFrame(updateJump);
        }
    }

    requestAnimationFrame(updateJump);
}

function moveCarrotRandomly() {
    if (!carrot) {
        console.error("Carrot is not initialized.");
        return;
    }

    const jumpHeight = 0.2; // 紅蘿蔔跳躍的高度
    const jumpDuration = 200; // 紅蘿蔔跳躍動作持續時間
    const startTime = Date.now();
    const startX = carrot.position.x;
    const startZ = carrot.position.z;

    // 隨機生成紅蘿蔔的新位置，確保不與兔子重疊
    let targetPosition;
    do {
        targetPosition = getRandomPosition();
    } while (targetPosition.x === rabbit.position.x && targetPosition.z === rabbit.position.z);

    const targetX = targetPosition.x;
    const targetZ = targetPosition.z;

    function updateCarrotJump() {
        const elapsedTime = Date.now() - startTime;
        const t = elapsedTime / jumpDuration; // 時間進度，從 0 到 1

        if (t >= 1) {
            // 跳躍結束，固定位置
            carrot.position.x = targetX;
            carrot.position.z = targetZ;
            carrot.position.y = 0.25; // 回到地面
        } else {
            // 計算新的位置，模擬跳躍過程
            carrot.position.x = startX + (targetX - startX) * t;
            carrot.position.z = startZ + (targetZ - startZ) * t;
            carrot.position.y = Math.sin(t * Math.PI) * jumpHeight + 0.25; // Y 軸位置根據正弦函數變化

            requestAnimationFrame(updateCarrotJump); // 繼續更新跳躍動作
        }
    }

    requestAnimationFrame(updateCarrotJump);
}

function checkCarrotCollision() {
    if (rabbit.position.distanceTo(carrot.position) < 0.8) {
        console.log("小雞吃到了蟲蟲！");
        alert("小雞吃到了蟲蟲！");
        gridSize = getRandomGridSize();
        createFloorAndObjects(); // 重置場景
        moveCarrotRandomly(); // 讓紅蘿蔔移動
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
