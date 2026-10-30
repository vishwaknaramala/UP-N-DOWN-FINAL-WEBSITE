import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import {
  BW_PALETTES,
  THEME_PALETTE_EVENT,
  BWPaletteId,
  getStoredPalette,
} from '../utils/themePalettes';
import {
  getStoredRunwayConfig,
  DEVELOPER_DATA_UPDATED,
  RunwayConfig,
  MaterialFinish,
  ViewMode,
  ShowcaseTarget,
} from '../utils/developerStorage';

interface ThreeDLogoRoadCanvasProps {
  onSpeedChange?: (speed: number) => void;
}

export const ThreeDLogoRoadCanvas: React.FC<ThreeDLogoRoadCanvasProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Runway state governed by Developer / Admin Portal
  const [runwayConfig, setRunwayConfig] = useState<RunwayConfig>(getStoredRunwayConfig());

  useEffect(() => {
    setRunwayConfig(getStoredRunwayConfig());
    const handleUpdate = () => {
      setRunwayConfig(getStoredRunwayConfig());
    };
    window.addEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
    return () => window.removeEventListener(DEVELOPER_DATA_UPDATED, handleUpdate);
  }, []);

  // Three.js internal mutable refs to avoid React re-renders tearing down WebGL
  const threeState = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    animId: number;
    // Groups
    mainPivotGroup: THREE.Group | null;
    logoGroup: THREE.Group | null;
    capGroup: THREE.Group | null;
    pantsGroup: THREE.Group | null;
    teeGroup: THREE.Group | null;
    // Logo Meshes
    ringMesh: THREE.Mesh | null;
    frontEmblemMesh: THREE.Mesh | null;
    backEmblemMesh: THREE.Mesh | null;
    coreBezelMesh: THREE.Mesh | null;
    outerRingMesh: THREE.Mesh | null;
    // Road & Environment
    roadMesh: THREE.Mesh | null;
    roadTexture: THREE.CanvasTexture | null;
    roadLinesTexture: THREE.CanvasTexture | null;
    materials: Record<MaterialFinish, THREE.MeshPhysicalMaterial>;
    currentFinish: MaterialFinish;
    viewMode: ViewMode;
    showcaseTarget: ShowcaseTarget;
    speed: number;
    isRotating: boolean;
    explodedDist: number;
    pointer: { x: number; y: number; isDown: boolean; startX: number; startY: number };
    targetRotation: { x: number; y: number };
    currentRotation: { x: number; y: number };
  }>({
    scene: null,
    camera: null,
    renderer: null,
    animId: 0,
    mainPivotGroup: null,
    logoGroup: null,
    capGroup: null,
    pantsGroup: null,
    teeGroup: null,
    ringMesh: null,
    frontEmblemMesh: null,
    backEmblemMesh: null,
    coreBezelMesh: null,
    outerRingMesh: null,
    roadMesh: null,
    roadTexture: null,
    roadLinesTexture: null,
    materials: {} as Record<MaterialFinish, THREE.MeshPhysicalMaterial>,
    currentFinish: 'platinum',
    viewMode: 'road',
    showcaseTarget: 'monogram',
    speed: 90,
    isRotating: true,
    explodedDist: 0,
    pointer: { x: 0, y: 0, isDown: false, startX: 0, startY: 0 },
    targetRotation: { x: 0, y: 0 },
    currentRotation: { x: 0, y: 0 },
  });

  // Sync Material Finishes from Admin Runway Config
  useEffect(() => {
    threeState.current.currentFinish = runwayConfig.materialFinish;
    if (threeState.current.logoGroup) {
      const mat = threeState.current.materials[runwayConfig.materialFinish];
      if (mat) {
        if (threeState.current.ringMesh) threeState.current.ringMesh.material = mat;
        if (threeState.current.coreBezelMesh) threeState.current.coreBezelMesh.material = mat;
        if (threeState.current.outerRingMesh) threeState.current.outerRingMesh.material = mat;
      }
    }
  }, [runwayConfig.materialFinish]);

  // Sync View Mode
  useEffect(() => {
    threeState.current.viewMode = runwayConfig.viewMode;
    if (runwayConfig.viewMode === 'exploded') {
      threeState.current.explodedDist = runwayConfig.explodedDistance || 1.0;
    } else {
      threeState.current.explodedDist = 0;
    }
  }, [runwayConfig.viewMode, runwayConfig.explodedDistance]);

  // Sync Showcase Target (Monogram vs Apparels)
  useEffect(() => {
    threeState.current.showcaseTarget = runwayConfig.showcaseTarget;
    const { logoGroup, capGroup, pantsGroup, teeGroup } = threeState.current;

    if (logoGroup) {
      logoGroup.visible = runwayConfig.showcaseTarget === 'monogram';
    }
    if (capGroup) {
      capGroup.visible = runwayConfig.showcaseTarget === 'cap';
    }
    if (pantsGroup) {
      pantsGroup.visible = runwayConfig.showcaseTarget === 'pants';
    }
    if (teeGroup) {
      teeGroup.visible = runwayConfig.showcaseTarget === 'tee';
    }
  }, [runwayConfig.showcaseTarget]);

  // Sync Speed & Rotation
  useEffect(() => {
    threeState.current.speed = runwayConfig.speedKmh;
  }, [runwayConfig.speedKmh]);

  useEffect(() => {
    threeState.current.isRotating = runwayConfig.isRotating;
  }, [runwayConfig.isRotating]);

  useEffect(() => {
    threeState.current.explodedDist = runwayConfig.explodedDistance;
  }, [runwayConfig.explodedDistance]);

  // Listen to Black & White Theme Palette shifts
  useEffect(() => {
    const handlePaletteShift = (e: Event) => {
      const custom = e as CustomEvent<BWPaletteId>;
      const paletteId = custom.detail || getStoredPalette();
      const palette = BW_PALETTES[paletteId];
      if (palette) {
        if (threeState.current.scene) {
          const bgColor = palette.isLight ? '#f4f4f6' : palette.colors.bg;
          threeState.current.scene.background = new THREE.Color(bgColor);
          if (threeState.current.scene.fog) {
            threeState.current.scene.fog.color.set(bgColor);
          }
        }
      }
    };
    window.addEventListener(THEME_PALETTE_EVENT, handlePaletteShift);
    return () => window.removeEventListener(THEME_PALETTE_EVENT, handlePaletteShift);
  }, []);

  // Three.js Mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialPalette = BW_PALETTES[getStoredPalette()] || BW_PALETTES.black;
    const initialBg = initialPalette.isLight ? '#f4f4f6' : initialPalette.colors.bg;
    const initialFinish: MaterialFinish = getStoredRunwayConfig().materialFinish || 'platinum';

    // 1. Scene & Horizon Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialBg);
    scene.fog = new THREE.FogExp2(initialBg, 0.038);
    threeState.current.scene = scene;

    // 2. Camera Setup
    const width = container.clientWidth;
    const isMobileInitial = width < 640;
    const height = container.clientHeight || (isMobileInitial ? 240 : 480);
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const initialCamY = isMobileInitial ? 1.35 : 1.8;
    const initialCamZ = isMobileInitial ? 5.3 : 5.8;
    camera.position.set(0, initialCamY, initialCamZ);
    camera.lookAt(0, isMobileInitial ? 0.12 : 0.3, 0);
    threeState.current.camera = camera;

    // 3. Renderer with ACES ToneMapping & SRGB Color
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    threeState.current.renderer = renderer;

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.8);
    keyLight.position.set(4, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#e4e4e7', 3.5);
    rimLight.position.set(-5, 6, -4);
    scene.add(rimLight);

    const groundFillLight = new THREE.HemisphereLight('#27272a', '#050507', 1.2);
    scene.add(groundFillLight);

    // 6. Define PBR Materials for the 3D Monogram & Finishes
    const materials: Record<MaterialFinish, THREE.MeshPhysicalMaterial> = {
      platinum: new THREE.MeshPhysicalMaterial({
        color: '#f4f4f5',
        metalness: 0.92,
        roughness: 0.18,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        reflectivity: 0.9,
      }),
      chrome: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.98,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      }),
      obsidian: new THREE.MeshPhysicalMaterial({
        color: '#0f0f12',
        metalness: 0.4,
        roughness: 0.6,
        clearcoat: 0.3,
      }),
      titanium: new THREE.MeshPhysicalMaterial({
        color: '#71717a',
        metalness: 0.85,
        roughness: 0.35,
        clearcoat: 0.5,
      }),
      gold: new THREE.MeshPhysicalMaterial({
        color: '#d4af37',
        metalness: 0.95,
        roughness: 0.2,
        clearcoat: 0.7,
      }),
    };
    threeState.current.materials = materials;

    // 7. Procedural Road Textures
    const asphaltCanvas = document.createElement('canvas');
    asphaltCanvas.width = 256;
    asphaltCanvas.height = 256;
    const actx = asphaltCanvas.getContext('2d');
    if (actx) {
      actx.fillStyle = '#0a0a0c';
      actx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3500; i++) {
        const val = Math.floor(Math.random() * 40 + 10);
        actx.fillStyle = `rgba(${val}, ${val}, ${val + 5}, 0.15)`;
        actx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    }
    const roadTexture = new THREE.CanvasTexture(asphaltCanvas);
    roadTexture.colorSpace = THREE.SRGBColorSpace;
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(4, 40);
    roadTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    threeState.current.roadTexture = roadTexture;

    // Runway Road Markings
    const linesCanvas = document.createElement('canvas');
    linesCanvas.width = 512;
    linesCanvas.height = 512;
    const lctx = linesCanvas.getContext('2d');
    if (lctx) {
      lctx.fillStyle = 'rgba(0,0,0,0)';
      lctx.fillRect(0, 0, 512, 512);
      // Left solid shoulder line
      lctx.fillStyle = '#f4f4f5';
      lctx.fillRect(40, 0, 16, 512);
      // Right solid shoulder line
      lctx.fillRect(456, 0, 16, 512);
      // Center dashed lines
      lctx.fillStyle = '#ffffff';
      lctx.fillRect(250, 40, 12, 160);
      lctx.fillRect(250, 300, 12, 160);
    }
    const roadLinesTexture = new THREE.CanvasTexture(linesCanvas);
    roadLinesTexture.colorSpace = THREE.SRGBColorSpace;
    roadLinesTexture.wrapS = THREE.RepeatWrapping;
    roadLinesTexture.wrapT = THREE.RepeatWrapping;
    roadLinesTexture.repeat.set(1, 25);
    roadLinesTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    threeState.current.roadLinesTexture = roadLinesTexture;

    // Road Plane
    const roadGeometry = new THREE.PlaneGeometry(8, 100, 1, 60);
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.85,
      metalness: 0.15,
    });
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, -1.2, -25);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);
    threeState.current.roadMesh = roadMesh;

    // Road Markings Decal Overlay
    const linesMaterial = new THREE.MeshStandardMaterial({
      map: roadLinesTexture,
      transparent: true,
      roughness: 0.4,
      metalness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const linesMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 100), linesMaterial);
    linesMesh.rotation.x = -Math.PI / 2;
    linesMesh.position.set(0, -1.18, -25);
    scene.add(linesMesh);

    // Lateral Road Curbs
    const curbGeo = new THREE.BoxGeometry(0.35, 0.25, 100);
    const curbMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.7, metalness: 0.3 });
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-4.1, -1.1, -25);
    scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(4.1, -1.1, -25);
    scene.add(rightCurb);

    // Highway Lighting Pylons
    const pylonGeo = new THREE.CylinderGeometry(0.04, 0.05, 3.5, 8);
    const pylonMat = new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.8, roughness: 0.3 });
    const pylonCount = 20;
    const pylons = new THREE.InstancedMesh(pylonGeo, pylonMat, pylonCount * 2);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < pylonCount; i++) {
      const z = -i * 5;
      dummy.position.set(-4.4, 0.5, z);
      dummy.updateMatrix();
      pylons.setMatrixAt(i, dummy.matrix);

      dummy.position.set(4.4, 0.5, z);
      dummy.updateMatrix();
      pylons.setMatrixAt(i + pylonCount, dummy.matrix);
    }
    pylons.instanceMatrix.needsUpdate = true;
    scene.add(pylons);

    // 8. MASTER ROTATION PIVOT GROUP
    const mainPivotGroup = new THREE.Group();
    const initialScale = isMobileInitial ? Math.min(0.66, Math.max(0.50, width / 560)) : 1.0;
    mainPivotGroup.scale.set(initialScale, initialScale, initialScale);
    mainPivotGroup.position.set(0, isMobileInitial ? 0.22 : 0.4, 0);
    scene.add(mainPivotGroup);
    threeState.current.mainPivotGroup = mainPivotGroup;

    // Contact Grounding Shadow
    const shadowGeo = new THREE.PlaneGeometry(3.5, 1.8);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0,0,0,0.7)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.35)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -1.57, 0);
    mainPivotGroup.add(shadowPlane);

    // 9. CONSTRUCT REDESIGNED LUXURY 3D UP N DOWN EMBLEM & SCULPTURE
    const logoGroup = new THREE.Group();
    mainPivotGroup.add(logoGroup);
    threeState.current.logoGroup = logoGroup;

    // Load official UP N DOWN brand logo texture
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load('/assets/aistudio/UP_N_DOWN_LOGO_00d318c2.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });

    // Front Face Emblem Disc (Official Brand Monogram)
    const frontEmblemGeo = new THREE.CircleGeometry(1.68, 64);
    const frontEmblemMat = new THREE.MeshPhysicalMaterial({
      map: logoTexture,
      transparent: true,
      metalness: 0.95,
      roughness: 0.16,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });
    const frontEmblemMesh = new THREE.Mesh(frontEmblemGeo, frontEmblemMat);
    frontEmblemMesh.position.set(0, 0, 0.115);
    frontEmblemMesh.castShadow = true;
    logoGroup.add(frontEmblemMesh);
    threeState.current.frontEmblemMesh = frontEmblemMesh;

    // Back Face Emblem Disc (Official Brand Monogram Dual-Sided)
    const backEmblemGeo = new THREE.CircleGeometry(1.68, 64);
    const backEmblemMat = new THREE.MeshPhysicalMaterial({
      map: logoTexture,
      transparent: true,
      metalness: 0.95,
      roughness: 0.16,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });
    const backEmblemMesh = new THREE.Mesh(backEmblemGeo, backEmblemMat);
    backEmblemMesh.rotation.y = Math.PI;
    backEmblemMesh.position.set(0, 0, -0.115);
    backEmblemMesh.castShadow = true;
    logoGroup.add(backEmblemMesh);
    threeState.current.backEmblemMesh = backEmblemMesh;

    // Architectural Core Chassis / Rim
    const coreBezelGeo = new THREE.CylinderGeometry(1.72, 1.72, 0.22, 64, 1, false);
    const coreBezelMesh = new THREE.Mesh(coreBezelGeo, materials[initialFinish]);
    coreBezelMesh.rotation.x = Math.PI / 2;
    coreBezelMesh.position.set(0, 0, 0);
    coreBezelMesh.castShadow = true;
    logoGroup.add(coreBezelMesh);
    threeState.current.coreBezelMesh = coreBezelMesh;

    // Inner Chamfer Bezel Ring
    const ringGeo = new THREE.TorusGeometry(1.78, 0.045, 16, 80);
    const ringMesh = new THREE.Mesh(ringGeo, materials[initialFinish]);
    ringMesh.position.set(0, 0, 0);
    ringMesh.castShadow = true;
    logoGroup.add(ringMesh);
    threeState.current.ringMesh = ringMesh;

    // Outer Orbit Astronomical Halo Ring
    const outerRingGeo = new THREE.TorusGeometry(2.10, 0.024, 16, 96);
    const outerRingMesh = new THREE.Mesh(outerRingGeo, materials[initialFinish]);
    outerRingMesh.position.set(0, 0, 0);
    outerRingMesh.castShadow = true;
    logoGroup.add(outerRingMesh);
    threeState.current.outerRingMesh = outerRingMesh;
    // 10. 3D APPAREL MODELS (CAP, DENIM LOOSE PANT, HEAVY TEES)
    // CAP GROUP
    const capGroup = new THREE.Group();
    capGroup.visible = false;
    mainPivotGroup.add(capGroup);
    threeState.current.capGroup = capGroup;

    const capMat = new THREE.MeshStandardMaterial({
      color: '#09090b',
      roughness: 0.85,
      metalness: 0.1,
    });
    // Crown
    const crownGeo = new THREE.SphereGeometry(1.0, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const crownMesh = new THREE.Mesh(crownGeo, capMat);
    crownMesh.position.set(0, -0.1, 0);
    crownMesh.castShadow = true;
    capGroup.add(crownMesh);

    // Visor / Brim (Curved forward)
    const visorShape = new THREE.Shape();
    visorShape.moveTo(-0.85, 0);
    visorShape.bezierCurveTo(-0.7, 1.2, 0.7, 1.2, 0.85, 0);
    visorShape.bezierCurveTo(0.6, -0.3, -0.6, -0.3, -0.85, 0);
    const visorGeo = new THREE.ExtrudeGeometry(visorShape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
    const visorMesh = new THREE.Mesh(visorGeo, capMat);
    visorMesh.rotation.x = Math.PI * 0.45;
    visorMesh.position.set(0, -0.22, 0.75);
    visorMesh.castShadow = true;
    capGroup.add(visorMesh);

    // Button on top
    const btnGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const btnMat = new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.8, roughness: 0.3 });
    const topButton = new THREE.Mesh(btnGeo, btnMat);
    topButton.position.set(0, 0.9, 0);
    capGroup.add(topButton);

    // PANTS GROUP (Denim Loose Pant - Skater Wide Leg)
    const pantsGroup = new THREE.Group();
    pantsGroup.visible = false;
    mainPivotGroup.add(pantsGroup);
    threeState.current.pantsGroup = pantsGroup;

    const denimMat = new THREE.MeshStandardMaterial({
      color: '#111827',
      roughness: 0.9,
      metalness: 0.1,
    });
    // Waistband
    const waistGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.25, 32);
    const waistMesh = new THREE.Mesh(waistGeo, denimMat);
    waistMesh.position.set(0, 1.1, 0);
    pantsGroup.add(waistMesh);

    // Left wide-leg
    const legGeo = new THREE.CylinderGeometry(0.44, 0.52, 2.1, 24);
    const leftLeg = new THREE.Mesh(legGeo, denimMat);
    leftLeg.position.set(-0.46, -0.05, 0);
    leftLeg.castShadow = true;
    pantsGroup.add(leftLeg);

    // Right wide-leg
    const rightLeg = new THREE.Mesh(legGeo, denimMat);
    rightLeg.position.set(0.46, -0.05, 0);
    rightLeg.castShadow = true;
    pantsGroup.add(rightLeg);

    // Selvedge Cuff Accent
    const cuffGeo = new THREE.TorusGeometry(0.53, 0.03, 12, 32);
    const cuffMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.4 });
    const leftCuff = new THREE.Mesh(cuffGeo, cuffMat);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.position.set(-0.46, -1.05, 0);
    pantsGroup.add(leftCuff);
    const rightCuff = new THREE.Mesh(cuffGeo, cuffMat);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.position.set(0.46, -1.05, 0);
    pantsGroup.add(rightCuff);

    // TEE GROUP (Heavy Tees - Boxy Oversized Drop Shoulder)
    const teeGroup = new THREE.Group();
    teeGroup.visible = false;
    mainPivotGroup.add(teeGroup);
    threeState.current.teeGroup = teeGroup;

    const teeMat = new THREE.MeshStandardMaterial({
      color: '#09090b',
      roughness: 0.85,
      metalness: 0.05,
    });
    // Torso (Boxy tubular cut)
    const torsoGeo = new THREE.BoxGeometry(1.65, 2.0, 0.5);
    const torsoMesh = new THREE.Mesh(torsoGeo, teeMat);
    torsoMesh.position.set(0, 0, 0);
    torsoMesh.castShadow = true;
    teeGroup.add(torsoMesh);

    // Thick Mock Collar Ring
    const collarGeo = new THREE.TorusGeometry(0.38, 0.08, 16, 32);
    const collarMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 1.0, 0);
    teeGroup.add(collarMesh);

    // Left Drop Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.9, 20);
    const leftSleeve = new THREE.Mesh(sleeveGeo, teeMat);
    leftSleeve.rotation.z = Math.PI * 0.28;
    leftSleeve.position.set(-1.08, 0.55, 0);
    leftSleeve.castShadow = true;
    teeGroup.add(leftSleeve);

    // Right Drop Sleeve
    const rightSleeve = new THREE.Mesh(sleeveGeo, teeMat);
    rightSleeve.rotation.z = -Math.PI * 0.28;
    rightSleeve.position.set(1.08, 0.55, 0);
    rightSleeve.castShadow = true;
    teeGroup.add(rightSleeve);

    // Authentic Tech Pack Garment Base Colors (Developer Governed)
    capMat.color.set('#27272a'); // Stone Wash Grey
    denimMat.color.set('#18181b'); // Obsidian Raw Denim
    teeMat.color.set('#f4f4f5'); // Heavy White Cotton

    // 12. Pointer / Touch Interaction
    const onPointerDown = (e: PointerEvent) => {
      threeState.current.pointer.isDown = true;
      threeState.current.pointer.startX = e.clientX;
      threeState.current.pointer.startY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!threeState.current.pointer.isDown) return;
      const deltaX = (e.clientX - threeState.current.pointer.startX) * 0.008;
      const deltaY = (e.clientY - threeState.current.pointer.startY) * 0.008;

      threeState.current.targetRotation.y += deltaX;
      threeState.current.targetRotation.x = Math.max(-0.6, Math.min(0.6, threeState.current.targetRotation.x + deltaY));

      threeState.current.pointer.startX = e.clientX;
      threeState.current.pointer.startY = e.clientY;
    };

    const onPointerUp = () => {
      threeState.current.pointer.isDown = false;
    };

    const dom = renderer.domElement;
    dom.style.touchAction = 'pan-y';
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 13. Resize Handler
    const onResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const isMob = w < 640;
      const h = container.clientHeight || (isMob ? 240 : 480);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 14. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Road velocity motion
      const currentSpeed = threeState.current.speed;
      const roadTextureOffset = (currentSpeed / 3600) * delta * 120;

      if (threeState.current.roadTexture && threeState.current.roadLinesTexture) {
        threeState.current.roadTexture.offset.y -= roadTextureOffset;
        threeState.current.roadLinesTexture.offset.y -= roadTextureOffset;
      }

      // Smooth exponential damping on user rotation
      threeState.current.currentRotation.x = THREE.MathUtils.damp(
        threeState.current.currentRotation.x,
        threeState.current.targetRotation.x,
        12,
        delta
      );
      threeState.current.currentRotation.y = THREE.MathUtils.damp(
        threeState.current.currentRotation.y,
        threeState.current.targetRotation.y,
        12,
        delta
      );

      // Auto rotation when enabled and not dragging
      if (threeState.current.isRotating && !threeState.current.pointer.isDown) {
        threeState.current.targetRotation.y += delta * 0.65;
      }

      // Dynamic responsive scale for seamless rotation & resize across viewports
      const containerW = container.clientWidth;
      const isMobile = containerW < 640;
      const targetScale = isMobile ? Math.min(0.66, Math.max(0.50, containerW / 560)) : 1.0;

      // Floating harmonic levitation over the runway
      const levitation = Math.sin(elapsed * 2.2) * (isMobile ? 0.05 : 0.08);

      if (mainPivotGroup) {
        mainPivotGroup.scale.set(targetScale, targetScale, targetScale);
        mainPivotGroup.position.y = (isMobile ? 0.22 : 0.4) + levitation;
        mainPivotGroup.rotation.x = threeState.current.currentRotation.x;
        mainPivotGroup.rotation.y = threeState.current.currentRotation.y;

        // Shadow scales with levitation
        shadowPlane.scale.set(1 + levitation * 0.5, 1 + levitation * 0.5, 1);
        shadowMat.opacity = 0.6 - levitation * 0.8;
      }

      // Exploded Layer Animation
      const targetDist = threeState.current.explodedDist;

      // Front & Back Logo Emblem Medallion plates separation
      if (threeState.current.frontEmblemMesh) {
        threeState.current.frontEmblemMesh.position.z = THREE.MathUtils.damp(
          threeState.current.frontEmblemMesh.position.z,
          0.115 + targetDist * 0.9,
          10,
          delta
        );
      }
      if (threeState.current.backEmblemMesh) {
        threeState.current.backEmblemMesh.position.z = THREE.MathUtils.damp(
          threeState.current.backEmblemMesh.position.z,
          -0.115 - targetDist * 0.9,
          10,
          delta
        );
      }

      // Orbital Halo Rings radial expansion
      if (threeState.current.ringMesh) {
        const ringScale = 1 + targetDist * 0.22;
        threeState.current.ringMesh.scale.set(ringScale, ringScale, 1);
      }
      if (threeState.current.outerRingMesh) {
        const outerScale = 1 + targetDist * 0.40;
        threeState.current.outerRingMesh.scale.set(outerScale, outerScale, 1);
        threeState.current.outerRingMesh.rotation.z += delta * 0.25;
      }

      // Camera view mode transition
      if (camera) {
        let targetCamY = isMobile ? 1.35 : 1.8;
        let targetCamZ = isMobile ? 5.3 : 5.8;
        let targetCamX = 0;

        if (threeState.current.viewMode === 'orbit') {
          targetCamY = isMobile ? 0.65 : 0.8;
          targetCamZ = isMobile ? 3.6 : 4.2;
        } else if (threeState.current.viewMode === 'exploded') {
          targetCamY = isMobile ? 0.95 : 1.2;
          targetCamZ = isMobile ? 4.3 : 4.8;
          targetCamX = isMobile ? 0.4 : 0.8;
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 5, delta);
        camera.lookAt(0, isMobile ? 0.12 : 0.3, 0);
      }

      renderer.render(scene, camera);
      threeState.current.animId = requestAnimationFrame(animate);
    };

    threeState.current.animId = requestAnimationFrame(animate);
    renderer.compile(scene, camera);

    // Cleanup
    return () => {
      cancelAnimationFrame(threeState.current.animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);

      roadGeometry.dispose();
      roadMaterial.dispose();
      linesMaterial.dispose();
      frontEmblemGeo.dispose();
      backEmblemGeo.dispose();
      frontEmblemMat.dispose();
      backEmblemMat.dispose();
      coreBezelGeo.dispose();
      ringGeo.dispose();
      outerRingGeo.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      roadTexture.dispose();
      roadLinesTexture.dispose();
      shadowTexture.dispose();
      crownGeo.dispose();
      visorGeo.dispose();
      btnGeo.dispose();
      capMat.dispose();
      btnMat.dispose();
      waistGeo.dispose();
      legGeo.dispose();
      cuffGeo.dispose();
      denimMat.dispose();
      cuffMat.dispose();
      torsoGeo.dispose();
      collarGeo.dispose();
      sleeveGeo.dispose();
      teeMat.dispose();
      collarMat.dispose();
      Object.values(materials).forEach((m) => m.dispose());
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  return (
    <section id="3d-runway" className="relative w-full border-b border-[var(--border-main)] bg-[var(--bg-main)] overflow-hidden select-none transition-colors">
      {/* 3D WebGL Canvas Mount: compact small fit on mobile, proportional on larger screens */}
      <div
        ref={containerRef}
        data-cursor="DRAG"
        className="w-full h-[200px] xs:h-[220px] sm:h-[320px] md:h-[400px] lg:h-[460px] cursor-grab active:cursor-grabbing touch-pan-y"
      />
    </section>
  );
};
