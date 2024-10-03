"use strict";

const MIN_GRID_SIZE = 8;
const MAX_GRID_SIZE = 12;

let scene, camera, renderer;
let rabbit, carrot;
let gridSize = getRandomGridSize(); // 隨機生成初始格子大小
let commands = []; // 用於存儲指令

let rabbitTextures = [];
let currentFrame = 0;
let frameCount = 6; // 假設 GIF 分成 6 幀
let animationSpeed = 100; // 每幀間隔 100 毫秒

// 定義全局變數
let textures = []; // 定義全局的 textures 數組
let currentBackgroundIndex = 0; // 當前背景紋理索引
let backgroundSwitchTime = 500; // 背景切換時間間隔，單位：毫秒
let lastBackgroundSwitchTime = 0; // 上一次切換背景的時間

let eagle; // 定義老鷹變數
let eagleSpeed = 0.5; // 老鷹的移動速度，根據需要調整
let eagleActive = false; // 控制老鷹是否可以活動
let gameOver = false; // 遊戲結束標誌

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

    // 建立相機
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const radius = 8; // 假設相機與場景的距離是 8
    const angle = Math.PI / 4; // 45 度角
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
        '/pictures/chicken/GAME_left_0.png',
        '/pictures/chicken/GAME_right_0.png',
         
        '/pictures/chicken/C_top_0.png',
        '/pictures/chicken/C_bottom_0.png',
 
        '/pictures/chicken/C_face_0.png',
        '/pictures/chicken/C_back_0.png',                                
    ];

    let texturesLoaded = 0;

    for (let i = 0; i < texturePaths.length; i++) {
        loader.load(texturePaths[i], (texture) => {
            rabbitTextures[i] = texture; // 使用 rabbitTextures 陣列
            texturesLoaded++;

            if (texturesLoaded === texturePaths.length) {
                const materials = rabbitTextures.map(tex => new THREE.MeshBasicMaterial({ map: tex }));
                rabbit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials); // 創建兔子
                rabbit.position.set(0, 0.5, 0); // 初始位置, y=0.5 to sit on the ground

                scene.add(rabbit);

                createFloorAndObjects();  // 等到 rabbit 初始化後再創建場景
            }
        });
    }
}

let carrots = [];
function createFloorAndObjects() {
    // 只保留 rabbit 之外的其他物體
    scene.children = scene.children.filter(obj => obj === rabbit);
    
    // 加載地面紋理
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('/pictures/underground/GAME_grass_0.png');

    // 創建地面
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 隨機生成紅蘿蔔的位置，最多生成三根紅蘿蔔
    carrots = []; // 清空現有的紅蘿蔔
    const maxCarrots = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < maxCarrots; i++) {
        let carrotPosition;
        do {
            carrotPosition = getRandomPosition(); // 隨機生成位置
        } while (
            carrots.some(carrot => carrot.position.x === carrotPosition.x && carrot.position.z === carrotPosition.z) || 
            (carrotPosition.x === rabbit.position.x && carrotPosition.z === rabbit.position.z)
        ); // 確保不與兔子重疊
        
        // 創建紅蘿蔔並添加到數組
        carrot = createObject(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xFF8C00 }), carrotPosition);
        carrots.push(carrot); // 將紅蘿蔔加入數組
    }

    createEagle(); // 創建老鷹，放在兔子生成之後
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
            eagleActive = true; // 當所有指令執行完畢後，讓老鷹開始活動
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

    // 讓兔子朝向目標位置轉向
    const targetPosition = new THREE.Vector3(targetX, rabbit.position.y, targetZ);
    rabbit.lookAt(targetPosition);  // 使用 lookAt 讓兔子朝向移動的方向

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
            moveAllCarrotsRandomly(); // 每次兔子移動後紅蘿蔔也隨機移動
            if (eagleActive && !gameOver) {
                moveEagleTowardsChick(rabbit); // 每次兔子移動後老鷹也跟著移動
            }
        } else {
            rabbit.position.x = startX + deltaX * t;
            rabbit.position.z = startZ + deltaZ * t;
            rabbit.position.y = Math.sin(t * Math.PI) * jumpHeight + rabbit.geometry.parameters.height / 2;

            requestAnimationFrame(updateJump);
        }
    }

    requestAnimationFrame(updateJump);
}

function moveAllCarrotsRandomly() {
    for (const carrot of carrots) { // 遍歷所有紅蘿蔔
        moveCarrotRandomly(carrot); // 讓每根紅蘿蔔隨機移動
    }
}

function moveCarrotRandomly(carrot) {
    if (!carrot) {
        console.error("No carrot to move.");
        return;
    }

    const jumpHeight = 0.5; // 紅蘿蔔跳躍的高度
    const jumpDuration = 500; // 紅蘿蔔跳躍動作持續時間
    const startTime = Date.now();
    const startX = carrot.position.x;
    const startZ = carrot.position.z;

    // 隨機生成紅蘿蔔的新位置，確保不與兔子或其他紅蘿蔔重疊
    let targetPosition;
    do {
        targetPosition = getRandomPosition();
    } while (
        (targetPosition.x === rabbit.position.x && targetPosition.z === rabbit.position.z) ||
        carrots.some(c => c !== carrot && c.position.x === targetPosition.x && c.position.z === targetPosition.z)
    );

    const targetX = targetPosition.x;
    const targetZ = targetPosition.z;

    function updateCarrotJump() {
        const elapsedTime = Date.now() - startTime;
        const t = elapsedTime / jumpDuration; // 時間進度，從 0 到 1

        if (t >= 1) {
            // 跳躍結束，固定位置
            carrot.position.x = targetX;
            carrot.position.z = targetZ;
            carrot.position.y = carrot.geometry.parameters.height / 2; // 回到地面
        } else {
            // 計算新的位置，模擬跳躍過程
            carrot.position.x = startX + (targetX - startX) * t;
            carrot.position.z = startZ + (targetZ - startZ) * t;
            carrot.position.y = Math.sin(t * Math.PI) * jumpHeight + carrot.geometry.parameters.height / 2; // Y 軸位置根據正弦函數變化

            requestAnimationFrame(updateCarrotJump); // 繼續更新跳躍動作
        }
    }

    requestAnimationFrame(updateCarrotJump);
}

function checkCarrotCollision() {
    for (const carrot of carrots) { // 遍歷所有紅蘿蔔
        if (rabbit.position.distanceTo(carrot.position) < 0.8) {
            console.log("小雞吃到了紅蘿蔔！");
            alert("小雞吃到了紅蘿蔔！");
            resetGame(); // 重置遊戲
            break; // 碰撞檢查完成，跳出循環
        }
    }
}  

function checkChickCollision() {
    if (eagle.position.distanceTo(rabbit.position) < 1) {
        console.log("老鷹捉到了小雞！");
        alert("老鷹捉到了小雞！");
        resetGame(); // 重置遊戲
    }
}

// 創建老鷹
function createEagle() {
    const eagleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const eagleMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    eagle = new THREE.Mesh(eagleGeometry, eagleMaterial);
    
    // 確保老鷹的初始位置不與兔子重疊
    const halfGridSize = gridSize / 2 - 0.5;
    let eagleX, eagleZ;
    do {
        eagleX = Math.floor(Math.random() * (gridSize - 2)) - (halfGridSize - 1);
        eagleZ = Math.floor(Math.random() * (gridSize - 2)) - (halfGridSize - 1);
    } while (eagleX === rabbit.position.x && eagleZ === rabbit.position.z);
    
    eagle.position.set(eagleX, 0.25, eagleZ); // y=0.25 to match carrot's y
    scene.add(eagle);
}

function animate() {
    requestAnimationFrame(animate);

    // 更新兔子的材質以模擬動畫
    if (rabbit && rabbitTextures.length > 0) {
        const now = Date.now();
        if (now % animationSpeed < 100) { // 簡單的動畫控制
            currentFrame = (currentFrame + 1) % frameCount;
            rabbit.material.map = rabbitTextures[currentFrame];
            rabbit.material.needsUpdate = true;  // 確保材質更新
        }
    }

    // 背景循環播放
    if (textures.length > 0) {
        const now = Date.now();
        if (now - lastBackgroundSwitchTime > backgroundSwitchTime) {
            currentBackgroundIndex = (currentBackgroundIndex + 1) % textures.length;
            scene.background = textures[currentBackgroundIndex];
            lastBackgroundSwitchTime = now;
        }
    }

    // 如果老鷹可以活動，且遊戲未結束，讓老鷹移動
    // if (eagleActive && !gameOver) {
    //     moveEagleTowardsChick(rabbit); // 老鷹朝小雞移動
    // }

    renderer.render(scene, camera); // 渲染場景
}

function moveEagleTowardsChick(chick) {
    // 獲取小雞的位置
    const targetX = chick.position.x;
    const targetZ = chick.position.z;

    const halfGridSize = gridSize / 2 - 0.5;

    // 檢查目標位置是否在範圍內
    if (targetX < -halfGridSize || targetX > halfGridSize || targetZ < -halfGridSize || targetZ > halfGridSize) {
        console.log("老鷹嘗試跳出格子邊界，移動無效");
        return; // 如果目標位置超出範圍，則不執行移動
    }

    // 計算朝向小雞的方向
    const directionX = targetX - eagle.position.x;
    const directionZ = targetZ - eagle.position.z;

    // 決定移動方向，優先X軸或Z軸
    let moveAxis = '';
    if (Math.abs(directionX) > Math.abs(directionZ)) {
        moveAxis = 'x';
    } else {
        moveAxis = 'z';
    }

    // 設定每步的距離（例如：每步 0.5）
    const stepSize = 0.5;
    const maxSteps = 4; // 最多移動四步
    const minSteps = 1; // 最少移動一步

    // 計算需要移動的步數
    let stepsToMove = Math.min(Math.max(Math.floor(Math.abs(directionX || directionZ) / stepSize), minSteps), maxSteps);

    // 計算實際的 deltaX 和 deltaZ
    let deltaX = 0;
    let deltaZ = 0;
    if (moveAxis === 'x') {
        deltaX = (directionX / Math.abs(directionX)) * stepSize * stepsToMove; // X方向的移動距離
    } else if (moveAxis === 'z') {
        deltaZ = (directionZ / Math.abs(directionZ)) * stepSize * stepsToMove; // Z方向的移動距離
    }

    // 讓老鷹朝向移動方向轉向
    if (moveAxis === 'x') {
        if (deltaX !== 0) {
            eagle.lookAt(new THREE.Vector3(eagle.position.x + deltaX, eagle.position.y, eagle.position.z));
        }
    } else if (moveAxis === 'z') {
        if (deltaZ !== 0) {
            eagle.lookAt(new THREE.Vector3(eagle.position.x, eagle.position.y, eagle.position.z + deltaZ));
        }
    }

    // 進行移動動畫
    const jumpHeight = 1; // 跳躍的高度
    const flyDuration = 500; // 飛行動作持續時間（毫秒）
    const startTime = Date.now();
    const startX = eagle.position.x;
    const startZ = eagle.position.z;

    function updateFlight() {
        const elapsedTime = Date.now() - startTime;
        const t = elapsedTime / flyDuration; // 時間進度，從 0 到 1

        if (t >= 1) {
            // 更新老鷹的位置到最終位置
            eagle.position.x += deltaX;
            eagle.position.z += deltaZ;
            // 保持y軸位置
            eagle.position.y = eagle.geometry.parameters.height / 2; // 回到地面

            checkChickCollision(); // 檢查是否撞到小雞
        } else {
            // 插值更新位置
            eagle.position.x = startX + deltaX * t;
            eagle.position.z = startZ + deltaZ * t;
            eagle.position.y = Math.sin(t * Math.PI) * jumpHeight + eagle.geometry.parameters.height / 2; // 根據時間進度改變y軸高度

            requestAnimationFrame(updateFlight);
        }
    }

    requestAnimationFrame(updateFlight);
}

// 重置遊戲
function resetGame() {
    commands = []; // 清空指令
    eagleActive = false; // 停止老鷹活動
    gameOver = false; // 重置遊戲結束標誌
    displayCommands(); // 更新指令顯示
    
    // 重置格子大小
    gridSize = getRandomGridSize();

    // 移除所有物體，重新建立地面、兔子、紅蘿蔔和老鷹
    createFloorAndObjects();
}

// 確保窗口大小改變時，調整相機和渲染器尺寸
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});