"use strict";

import * as THREE from './three.module.js';

const MIN_GRID_SIZE = 2;
const MAX_GRID_SIZE = 6;

let scene, camera, renderer;
let rabbit, carrot;
let gridSize = getRandomGridSize(); // 隨機生成初始格子大小

init();
animate();

function init() {
  // 建立場景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // 藍天背景

  // 建立相機
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(2, 5, 7); // 提升相機位置來看到整個場景
  camera.lookAt(0, 0, 0);

  // 建立渲染器
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createFloorAndObjects(); // 創建地面和物體
  // 監聽鍵盤事件
  document.addEventListener('keydown', onDocumentKeyDown, false);
}

function createFloorAndObjects() {
  // 清空場景中的物體
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  // 創建地面
  const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // 旋轉讓平面變成水平
  scene.add(floor);

  // 隨機生成兔子的位置
  const rabbitPosition = getRandomPosition();
  rabbit = createObject(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x808080 }), rabbitPosition);

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

const controls = {
  87: { x: 0, z: -1 }, // W
  83: { x: 0, z: 1 },  // S
  65: { x: -1, z: 0 }, // A
  68: { x: 1, z: 0 }   // D
};

function onDocumentKeyDown(event) {
  const control = controls[event.which];
  if (control) {
    rabbit.position.x += control.x;
    rabbit.position.z += control.z;
  }

  // 邊界檢查
  rabbit.position.x = Math.max(-gridSize / 2 + 0.5, Math.min(rabbit.position.x, gridSize / 2 - 0.5));
  rabbit.position.z = Math.max(-gridSize / 2 + 0.5, Math.min(rabbit.position.z, gridSize / 2 - 0.5));

  // 檢查是否吃到紅蘿蔔
  if (rabbit.position.distanceTo(carrot.position) < 0.5) {
    console.log("兔子吃到了紅蘿蔔！");
    alert("兔子吃到了紅蘿蔔！");
    gridSize = getRandomGridSize();
    createFloorAndObjects(); // 重置場景
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}