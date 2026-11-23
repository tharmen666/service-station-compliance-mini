"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type Drill3DMode = "pass" | "spill" | "firstaid";
export type ExtinguisherKind = "dcp" | "co2" | "water";

export interface Forecourt3DCanvasProps {
  mode: Drill3DMode;
  step: number;
  extinguisher?: ExtinguisherKind;
  waterHazardActive?: boolean;
  resetToken?: number;
}

const CAMERA_PRESETS: Record<
  Drill3DMode,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  pass: { pos: [7.8, 5.2, 8.8], target: [0.5, 1.0, 0.2] },
  spill: { pos: [7.5, 6.4, 8.5], target: [0.6, 0.2, 1.2] },
  firstaid: { pos: [6.4, 4.8, 7.6], target: [-0.8, 0.5, 1.4] },
};

function disposeObjectResources(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
      obj.geometry.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    }
  });
}

export function Forecourt3DCanvas({
  mode,
  step,
  extinguisher = "dcp",
  waterHazardActive = false,
  resetToken = 0,
}: Forecourt3DCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ mode, step, extinguisher, waterHazardActive });
  stateRef.current = { mode, step, extinguisher, waterHazardActive };

  const cameraCtrlRef = useRef<{
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
  } | null>(null);

  const [webglFailed, setWebglFailed] = useState(false);

  // Reset camera smoothly when drill mode changes or user taps Reset Camera
  useEffect(() => {
    const ctrl = cameraCtrlRef.current;
    if (!ctrl) return;
    const preset = CAMERA_PRESETS[mode];
    ctrl.camera.position.set(...preset.pos);
    ctrl.controls.target.set(...preset.target);
    ctrl.controls.update();
  }, [mode, resetToken]);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "default",
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false; // Lightweight for POS terminals & mobile browsers

    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 280);
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#070d1e");
    scene.fog = new THREE.Fog("#070d1e", 18, 38);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 80);
    const initialPreset = CAMERA_PRESETS[stateRef.current.mode];
    camera.position.set(...initialPreset.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 24;
    controls.target.set(...initialPreset.target);
    controls.update();

    cameraCtrlRef.current = { camera, controls };

    // Lighting
    const hemi = new THREE.HemisphereLight("#dbeafe", "#0f172a", 1.15);
    scene.add(hemi);
    const dirLight = new THREE.DirectionalLight("#fff7ed", 1.35);
    dirLight.position.set(7, 12, 8);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight("#38bdf8", 0.45);
    fillLight.position.set(-8, 6, -6);
    scene.add(fillLight);

    // ---- Shared Base Forecourt Environment ----
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    const asphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 18),
      new THREE.MeshStandardMaterial({ color: "#131c2e", roughness: 0.92 })
    );
    asphalt.rotation.x = -Math.PI / 2;
    baseGroup.add(asphalt);

    const grid = new THREE.GridHelper(24, 24, "#1e293b", "#0f172a");
    grid.position.y = 0.005;
    baseGroup.add(grid);

    // Safety yellow bay markings
    const laneMat = new THREE.MeshBasicMaterial({ color: "#f59e0b" });
    const laneFront = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.12), laneMat);
    laneFront.rotation.x = -Math.PI / 2;
    laneFront.position.set(0, 0.01, -0.8);
    baseGroup.add(laneFront);

    // Concrete Pump Island
    const island = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 0.28, 1.9),
      new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.85 })
    );
    island.position.set(0, 0.14, -2.2);
    baseGroup.add(island);

    // Overhead Canopy Columns & Amber Fascia
    const pillarMat = new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.35, roughness: 0.5 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.6, 0.45), pillarMat);
    pillarL.position.set(-2.6, 2.3, -2.2);
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.6, 0.45), pillarMat);
    pillarR.position.set(2.6, 2.3, -2.2);
    baseGroup.add(pillarL, pillarR);

    const canopyRoof = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 0.45, 5.2),
      new THREE.MeshStandardMaterial({ color: "#0b1329", roughness: 0.6 })
    );
    canopyRoof.position.set(0, 4.75, -1.8);
    baseGroup.add(canopyRoof);

    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(9.28, 0.14, 5.28),
      new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#b45309", emissiveIntensity: 0.35 })
    );
    fascia.position.set(0, 4.58, -1.8);
    baseGroup.add(fascia);

    // Twin Fuel Dispensers
    const dispenserBodyMat = new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.35 });
    const dispenserScreenMat = new THREE.MeshStandardMaterial({
      color: "#10b981",
      emissive: "#059669",
      emissiveIntensity: 0.6,
    });
    const dispenserPositions = [-1.2, 1.2];
    dispenserPositions.forEach((px) => {
      const disp = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.72), dispenserBodyMat);
      disp.position.set(px, 1.2, -2.2);
      const topCap = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.25, 0.78),
        new THREE.MeshStandardMaterial({ color: "#2563eb" })
      );
      topCap.position.set(px, 2.15, -2.2);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.75), dispenserScreenMat);
      screen.position.set(px, 1.65, -2.2);
      baseGroup.add(disp, topCap, screen);
    });

    // Emergency Shut-Off (ESD / E-Stop) Pillar
    const esdPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1.35, 0.32),
      new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.5 })
    );
    esdPost.position.set(-4.2, 0.675, -1.8);
    const esdBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.42, 0.36),
      new THREE.MeshStandardMaterial({ color: "#dc2626" })
    );
    esdBox.position.set(-4.2, 1.35, -1.8);
    const esdButton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#991b1b", emissiveIntensity: 0.5 })
    );
    esdButton.rotation.x = Math.PI / 2;
    esdButton.position.set(-4.2, 1.35, -1.58);
    const esdBeaconMat = new THREE.MeshStandardMaterial({
      color: "#10b981",
      emissive: "#059669",
      emissiveIntensity: 0.7,
    });
    const esdBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), esdBeaconMat);
    esdBeacon.position.set(-4.2, 1.72, -1.8);
    baseGroup.add(esdPost, esdBox, esdButton, esdBeacon);

    // Stormwater Drain Grate (used prominently in Spill mode)
    const drainGroup = new THREE.Group();
    drainGroup.position.set(3.2, 0.02, 2.3);
    const drainFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.04, 1.1),
      new THREE.MeshStandardMaterial({ color: "#334155", metalness: 0.6, roughness: 0.4 })
    );
    drainGroup.add(drainFrame);
    for (let g = -0.55; g <= 0.55; g += 0.22) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.05, 0.95),
        new THREE.MeshStandardMaterial({ color: "#090d16" })
      );
      slat.position.set(g, 0.01, 0);
      drainGroup.add(slat);
    }
    const drainHaloMat = new THREE.MeshBasicMaterial({
      color: "#ef4444",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const drainHalo = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.12, 28), drainHaloMat);
    drainHalo.rotation.x = -Math.PI / 2;
    drainHalo.position.y = 0.025;
    drainGroup.add(drainHalo);
    baseGroup.add(drainGroup);

    // Emergency Eyewash / First-Aid Cabinet
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(-4.4, 0, 1.6);
    const cabBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.6, 0.55),
      new THREE.MeshStandardMaterial({ color: "#065f46", roughness: 0.45 })
    );
    cabBody.position.y = 0.8;
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.14, 0.58),
      new THREE.MeshStandardMaterial({ color: "#f8fafc" })
    );
    crossH.position.y = 1.15;
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.45, 0.58),
      new THREE.MeshStandardMaterial({ color: "#f8fafc" })
    );
    crossV.position.y = 1.15;
    const eyewashHaloMat = new THREE.MeshBasicMaterial({
      color: "#10b981",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const eyewashHalo = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.98, 28), eyewashHaloMat);
    eyewashHalo.rotation.x = -Math.PI / 2;
    eyewashHalo.position.y = 0.03;
    cabinetGroup.add(cabBody, crossH, crossV, eyewashHalo);
    baseGroup.add(cabinetGroup);

    // =========================================================
    // MODE 1: P.A.S.S. FIRE EXTINGUISHER & EVACUATION GROUP
    // =========================================================
    const passGroup = new THREE.Group();
    scene.add(passGroup);

    // Fuel pan & Fire cones
    const fuelPan = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.22, 0.16, 24),
      new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.5 })
    );
    fuelPan.position.set(1.2, 0.08, 0.35);
    passGroup.add(fuelPan);

    const flameOuter = new THREE.Mesh(
      new THREE.ConeGeometry(0.82, 2.0, 16),
      new THREE.MeshStandardMaterial({
        color: "#f97316",
        emissive: "#ea580c",
        emissiveIntensity: 0.95,
        transparent: true,
        opacity: 0.85,
      })
    );
    flameOuter.position.set(1.2, 1.05, 0.35);

    const flameMid = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.45, 14),
      new THREE.MeshStandardMaterial({
        color: "#facc15",
        emissive: "#f59e0b",
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9,
      })
    );
    flameMid.position.set(1.2, 0.85, 0.35);

    const flameCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.85, 12),
      new THREE.MeshBasicMaterial({ color: "#fef9c3", transparent: true, opacity: 0.95 })
    );
    flameCore.position.set(1.2, 0.55, 0.35);
    passGroup.add(flameOuter, flameMid, flameCore);

    // Class B water boil-over flare ring
    const boilRingMat = new THREE.MeshBasicMaterial({
      color: "#ef4444",
      transparent: true,
      opacity: 0.85,
    });
    const boilRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.14, 10, 28), boilRingMat);
    boilRing.rotation.x = Math.PI / 2;
    boilRing.position.set(1.2, 0.25, 0.35);
    passGroup.add(boilRing);

    // Fire target base aim ring
    const aimRingMat = new THREE.MeshBasicMaterial({
      color: "#10b981",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const aimRing = new THREE.Mesh(new THREE.RingGeometry(1.28, 1.48, 32), aimRingMat);
    aimRing.rotation.x = -Math.PI / 2;
    aimRing.position.set(1.2, 0.04, 0.35);
    passGroup.add(aimRing);

    // Upwind indicator post + animated windsock + safe stance pad
    const upwindPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.5, 10),
      new THREE.MeshStandardMaterial({ color: "#94a3b8" })
    );
    upwindPost.position.set(-2.5, 1.25, 2.1);
    const windsock = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 1.05, 12),
      new THREE.MeshStandardMaterial({ color: "#f97316", emissive: "#c2410c", emissiveIntensity: 0.35 })
    );
    windsock.rotation.z = -Math.PI / 2;
    windsock.position.set(-1.95, 2.35, 2.1);
    const safePad = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.85, 24),
      new THREE.MeshBasicMaterial({ color: "#10b981", side: THREE.DoubleSide })
    );
    safePad.rotation.x = -Math.PI / 2;
    safePad.position.set(-1.35, 0.03, 1.75);
    passGroup.add(upwindPost, windsock, safePad);

    // Extinguisher rig standing upwind of the fire
    const extGroup = new THREE.Group();
    extGroup.position.set(-1.35, 0, 1.75);
    extGroup.lookAt(1.2, 0, 0.35);
    passGroup.add(extGroup);

    const extTankMat = new THREE.MeshStandardMaterial({ color: "#dc2626", roughness: 0.35 });
    const extTank = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.92, 18), extTankMat);
    extTank.position.y = 0.56;
    const extBandMat = new THREE.MeshStandardMaterial({ color: "#fde68a" });
    const extBand = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.14, 18), extBandMat);
    extBand.position.y = 0.72;
    const extValve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.7 })
    );
    extValve.position.y = 1.08;
    const pinMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.018, 8, 16),
      new THREE.MeshStandardMaterial({ color: "#facc15", metalness: 0.8 })
    );
    pinMesh.position.set(0.11, 1.14, 0.04);

    const nozzlePivot = new THREE.Group();
    nozzlePivot.position.set(0, 1.05, 0.14);
    const nozzleTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.55, 10),
      new THREE.MeshStandardMaterial({ color: "#0f172a" })
    );
    nozzleTube.rotation.x = Math.PI / 2;
    nozzleTube.position.z = 0.28;
    nozzlePivot.add(nozzleTube);
    extGroup.add(extTank, extBand, extValve, pinMesh, nozzlePivot);

    // Extinguishing plume particles
    const PLUME_COUNT = 75;
    const plumePositions = new Float32Array(PLUME_COUNT * 3);
    const plumeGeo = new THREE.BufferGeometry();
    plumeGeo.setAttribute("position", new THREE.BufferAttribute(plumePositions, 3));
    const plumeMat = new THREE.PointsMaterial({
      color: "#f8fafc",
      size: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const plumePoints = new THREE.Points(plumeGeo, plumeMat);
    plumePoints.visible = false;
    passGroup.add(plumePoints);

    // =========================================================
    // MODE 2: EMERGENCY FUEL SPILL RESPONSE GROUP
    // =========================================================
    const spillGroup = new THREE.Group();
    scene.add(spillGroup);

    const puddleMat = new THREE.MeshStandardMaterial({
      color: "#f59e0b",
      emissive: "#78350f",
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.82,
      roughness: 0.15,
      metalness: 0.4,
    });
    const puddleMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.65, 0.03, 28), puddleMat);
    puddleMesh.position.set(1.3, 0.025, 1.05);
    puddleMesh.scale.set(1.35, 1, 0.95);
    spillGroup.add(puddleMesh);

    // 6 safety cones + yellow cordon perimeter
    const conesGroup = new THREE.Group();
    const coneCoords: [number, number][] = [
      [-0.7, -0.4],
      [1.3, -0.5],
      [3.3, -0.3],
      [-0.7, 2.7],
      [1.3, 2.9],
      [3.3, 2.8],
    ];
    const coneOrangeMat = new THREE.MeshStandardMaterial({ color: "#f97316" });
    const coneWhiteMat = new THREE.MeshStandardMaterial({ color: "#f8fafc" });
    coneCoords.forEach(([cx, cz]) => {
      const cBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), coneOrangeMat);
      cBase.position.set(cx, 0.03, cz);
      const cBody = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.56, 12), coneOrangeMat);
      cBody.position.set(cx, 0.31, cz);
      const cStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.12, 0.12, 12), coneWhiteMat);
      cStripe.position.set(cx, 0.3, cz);
      conesGroup.add(cBase, cBody, cStripe);
    });
    const cordonGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.7, 0.38, -0.4),
      new THREE.Vector3(3.3, 0.38, -0.3),
      new THREE.Vector3(3.3, 0.38, 2.8),
      new THREE.Vector3(-0.7, 0.38, 2.7),
      new THREE.Vector3(-0.7, 0.38, -0.4),
    ]);
    const cordonLine = new THREE.Line(cordonGeo, new THREE.LineBasicMaterial({ color: "#facc15" }));
    conesGroup.add(cordonLine);
    spillGroup.add(conesGroup);

    // Absorbent sausage boom protecting the stormwater drain
    const boomMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.13, 12, 26, Math.PI * 1.15),
      new THREE.MeshStandardMaterial({ color: "#eab308", roughness: 0.7 })
    );
    boomMesh.rotation.x = Math.PI / 2;
    boomMesh.rotation.z = Math.PI * 0.7;
    boomMesh.position.set(3.15, 0.12, 2.25);
    spillGroup.add(boomMesh);

    // Granular absorbent mat over puddle
    const absorbentMatMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.42, 1.5, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: "#d6d3d1", roughness: 0.95 })
    );
    absorbentMatMesh.position.set(1.3, 0.045, 1.05);
    absorbentMatMesh.scale.set(1.25, 1, 0.88);
    spillGroup.add(absorbentMatMesh);

    // Sealed Hazmat waste drums (Step 5)
    const hazmatGroup = new THREE.Group();
    const drumMat = new THREE.MeshStandardMaterial({ color: "#facc15", roughness: 0.45 });
    const lidMat = new THREE.MeshStandardMaterial({ color: "#0f172a" });
    [-3.4, -2.5].forEach((dx) => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.88, 16), drumMat);
      drum.position.set(dx, 0.44, 0.5);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 16), lidMat);
      lid.position.set(dx, 0.9, 0.5);
      hazmatGroup.add(drum, lid);
    });
    spillGroup.add(hazmatGroup);

    // =========================================================
    // MODE 3: BASIC FIRST AID AWARENESS GROUP
    // =========================================================
    const firstAidGroup = new THREE.Group();
    scene.add(firstAidGroup);

    const casualtyMat = new THREE.MeshStandardMaterial({ color: "#38bdf8", roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.6 });
    const casualtyPivot = new THREE.Group();
    casualtyPivot.position.set(-0.8, 0.22, 1.4);
    firstAidGroup.add(casualtyPivot);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.95), casualtyMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), skinMat);
    head.position.set(0, 0.04, -0.68);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.72), casualtyMat);
    armL.position.set(-0.38, -0.02, -0.05);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.72), casualtyMat);
    armR.position.set(0.38, -0.02, -0.05);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.82), new THREE.MeshStandardMaterial({ color: "#1e293b" }));
    legL.position.set(-0.15, -0.02, 0.88);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.82), new THREE.MeshStandardMaterial({ color: "#1e293b" }));
    legR.position.set(0.15, -0.02, 0.88);
    casualtyPivot.add(torso, head, armL, armR, legL, legR);

    // First-Aid cordon cones (Step 1)
    const faCones = new THREE.Group();
    [
      [-2.1, 0.3],
      [0.6, 0.3],
      [-2.1, 2.7],
      [0.6, 2.7],
    ].forEach(([cx, cz]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 12), coneOrangeMat);
      cone.position.set(cx, 0.25, cz);
      faCones.add(cone);
    });
    firstAidGroup.add(faCones);

    // DRABC Pulsing Cyan Diagnostic Ring (Step 2)
    const drabcRingMat = new THREE.MeshBasicMaterial({
      color: "#38bdf8",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const drabcRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.12, 32), drabcRingMat);
    drabcRing.rotation.x = -Math.PI / 2;
    drabcRing.position.set(-0.8, 0.04, 1.4);
    firstAidGroup.add(drabcRing);

    // EMS Dispatch Lane Chevrons & Beacon (Step 3)
    const emsGroup = new THREE.Group();
    const emsBeaconMat = new THREE.MeshStandardMaterial({
      color: "#ef4444",
      emissive: "#dc2626",
      emissiveIntensity: 0.9,
    });
    const emsBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), emsBeaconMat);
    emsBeacon.position.set(2.4, 1.4, 3.2);
    const emsStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 3.2),
      new THREE.MeshBasicMaterial({ color: "#3b82f6", transparent: true, opacity: 0.45 })
    );
    emsStrip.rotation.x = -Math.PI / 2;
    emsStrip.position.set(2.4, 0.03, 2.2);
    emsGroup.add(emsBeacon, emsStrip);
    firstAidGroup.add(emsGroup);

    // Stabilized Vitals Emerald Halo (Step 5)
    const vitalsHaloMat = new THREE.MeshBasicMaterial({
      color: "#10b981",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const vitalsHalo = new THREE.Mesh(new THREE.RingGeometry(1.22, 1.4, 32), vitalsHaloMat);
    vitalsHalo.rotation.x = -Math.PI / 2;
    vitalsHalo.position.set(-0.8, 0.045, 1.4);
    firstAidGroup.add(vitalsHalo);

    // ResizeObserver for crisp layout across POS / Mobile / Desktop
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(entry.contentRect.width, 280);
      const h = Math.max(entry.contentRect.height, 260);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    ro.observe(container);

    // Animation Loop
    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const s = stateRef.current;

      passGroup.visible = s.mode === "pass";
      spillGroup.visible = s.mode === "spill";
      firstAidGroup.visible = s.mode === "firstaid";

      // ESD Pillar state across modes
      const esdActivated =
        (s.mode === "spill" && s.step >= 1) || (s.mode === "firstaid" && s.step >= 1);
      esdButton.position.z = esdActivated ? -1.62 : -1.58;
      esdBeaconMat.color.set(esdActivated ? "#f59e0b" : "#10b981");
      esdBeaconMat.emissive.set(esdActivated ? "#d97706" : "#059669");

      if (s.mode === "pass") {
        // Windsock gentle flutter
        windsock.rotation.y = Math.sin(t * 3.2) * 0.12;

        // Extinguisher styling by type
        if (s.extinguisher === "co2") {
          extBandMat.color.set("#0f172a");
          plumeMat.color.set("#e2e8f0");
        } else if (s.extinguisher === "water") {
          extBandMat.color.set("#38bdf8");
          plumeMat.color.set("#60a5fa");
        } else {
          extBandMat.color.set("#fde68a");
          plumeMat.color.set("#f8fafc");
        }

        // Fire scale & boil-over logic
        let fireScale = 1;
        if (s.waterHazardActive) {
          fireScale = 1.75 + Math.sin(t * 14) * 0.2;
          boilRing.visible = true;
          boilRing.scale.setScalar(1 + Math.sin(t * 10) * 0.12);
        } else {
          boilRing.visible = false;
          if (s.step === 3) fireScale = 0.48 + Math.sin(t * 9) * 0.06;
          else if (s.step >= 4) fireScale = 0.001;
          else fireScale = 1 + Math.sin(t * 7) * 0.08;
        }

        const fireVisible = fireScale > 0.02;
        flameOuter.visible = fireVisible;
        flameMid.visible = fireVisible;
        flameCore.visible = fireVisible;
        flameOuter.scale.set(fireScale, fireScale, fireScale);
        flameMid.scale.set(fireScale, fireScale, fireScale);
        flameCore.scale.set(fireScale, fireScale, fireScale);

        // Step 1: Pull pin
        pinMesh.position.y = s.step >= 1 ? 1.38 : 1.14;
        pinMesh.position.x = s.step >= 1 ? 0.34 : 0.11;

        // Step 2: Aim low
        aimRingMat.opacity = s.step >= 2 ? 0.85 : 0;
        aimRingMat.color.set(s.step >= 4 ? "#10b981" : "#f59e0b");
        nozzlePivot.rotation.x = s.step >= 2 ? 0.26 : 0;

        // Step 4: Sweep left-to-right
        extGroup.rotation.y =
          Math.atan2(1.2 - -1.35, 0.35 - 1.75) + (s.step >= 4 ? Math.sin(t * 5.2) * 0.22 : 0);

        // Step 3-4: Plume discharge
        const discharging = s.step >= 3 && !s.waterHazardActive;
        plumePoints.visible = discharging;
        if (discharging) {
          const sweepX = s.step >= 4 ? Math.sin(t * 5.2) * 0.75 : 0;
          const attr = plumeGeo.getAttribute("position") as THREE.BufferAttribute;
          for (let i = 0; i < PLUME_COUNT; i++) {
            const p = ((t * 1.9 + i / PLUME_COUNT) % 1);
            const px = THREE.MathUtils.lerp(-0.95, 1.2 + sweepX, p) + Math.sin(i * 1.7 + t * 5) * 0.22 * p;
            const py = THREE.MathUtils.lerp(0.95, 0.28, p) + Math.cos(i * 2.1) * 0.12 * p;
            const pz = THREE.MathUtils.lerp(1.52, 0.35 + sweepX * 0.4, p) + Math.sin(i * 3.1) * 0.2 * p;
            attr.setXYZ(i, px, py, pz);
          }
          attr.needsUpdate = true;
        }
      }

      if (s.mode === "spill") {
        const puddleActive = s.step < 5;
        puddleMesh.visible = puddleActive;
        if (puddleActive) {
          const pulse = s.step === 0 ? 1 + Math.sin(t * 2.4) * 0.08 : 1;
          puddleMesh.scale.set(1.35 * pulse, 1, 0.95 * pulse);
          puddleMat.opacity = s.step >= 4 ? 0.35 : 0.82;
        }
        conesGroup.visible = s.step >= 2;
        boomMesh.visible = s.step >= 3;
        absorbentMatMesh.visible = s.step >= 4 && s.step < 5;
        hazmatGroup.visible = s.step >= 5;

        drainHaloMat.color.set(s.step >= 3 ? "#10b981" : "#ef4444");
        drainHaloMat.opacity = s.step >= 3 ? 0.8 : 0.45 + Math.abs(Math.sin(t * 4)) * 0.45;
      }

      if (s.mode === "firstaid") {
        faCones.visible = s.step >= 1;
        drabcRing.visible = s.step >= 2;
        if (s.step >= 2) {
          const ringScale = 1 + Math.sin(t * 4) * 0.08;
          drabcRing.scale.set(ringScale, ringScale, 1);
        }
        emsGroup.visible = s.step >= 3;
        if (s.step >= 3) {
          const flash = Math.sin(t * 7) > 0;
          emsBeaconMat.color.set(flash ? "#ef4444" : "#3b82f6");
          emsBeaconMat.emissive.set(flash ? "#dc2626" : "#2563eb");
        }
        // Step 4: Smooth transition into safe Recovery Position + Eyewash Highlight
        const targetRoll = s.step >= 4 ? Math.PI * 0.42 : 0;
        casualtyPivot.rotation.z = THREE.MathUtils.lerp(casualtyPivot.rotation.z, targetRoll, 0.08);
        eyewashHaloMat.opacity = s.step >= 4 ? 0.85 : 0.2;
        vitalsHalo.visible = s.step >= 5;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      disposeObjectResources(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      cameraCtrlRef.current = null;
    };
  }, []);

  if (webglFailed) {
    return (
      <div className="flex h-[320px] w-full flex-col items-center justify-center rounded-2xl border border-slate-700 bg-[#0b1329] p-4 sm:h-[380px]">
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-amber-400">
          2D Tactical Schematic Fallback (WebGL Inactive)
        </p>
        <svg viewBox="0 0 420 200" className="h-full max-h-[250px] w-full max-w-md rounded-xl border border-slate-800 bg-[#070d1e]">
          <rect x="20" y="25" width="380" height="150" rx="12" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
          <rect x="90" y="42" width="240" height="32" rx="6" fill="#334155" />
          <text x="210" y="62" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">
            PUMP ISLAND &amp; CANOPY
          </text>
          {mode === "pass" ? (
            <>
              <circle cx="245" cy="120" r={waterHazardActive ? 26 : step >= 4 ? 8 : 18} fill={step >= 4 ? "#10b981" : "#f97316"} opacity="0.85" />
              <circle cx="135" cy="135" r="14" fill="#10b981" opacity="0.4" stroke="#10b981" strokeWidth="2" />
              <text x="135" y="139" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">UPWIND</text>
              <text x="245" y="124" textAnchor="middle" fill="#020617" fontSize="10" fontWeight="bold">
                {waterHazardActive ? "BOIL-OVER!" : step >= 4 ? "OUT" : "FIRE"}
              </text>
            </>
          ) : mode === "spill" ? (
            <>
              <ellipse cx="220" cy="118" rx="48" ry="20" fill={step >= 5 ? "#10b981" : "#f59e0b"} opacity="0.7" />
              <rect x="315" y="128" width="42" height="24" rx="4" fill="#1e293b" stroke={step >= 3 ? "#10b981" : "#ef4444"} strokeWidth="3" />
              <text x="336" y="144" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold">DRAIN</text>
            </>
          ) : (
            <>
              <rect x="45" y="120" width="54" height="34" rx="6" fill="#065f46" stroke="#10b981" strokeWidth="2" />
              <text x="72" y="141" textAnchor="middle" fill="#ecfdf5" fontSize="9" fontWeight="bold">EYEWASH</text>
              <circle cx="195" cy="125" r="20" fill="#38bdf8" opacity="0.35" stroke={step >= 5 ? "#10b981" : "#38bdf8"} strokeWidth="2" />
              <text x="195" y="129" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold">
                {step >= 4 ? "RECOVERY" : "CASUALTY"}
              </text>
            </>
          )}
        </svg>
        <p className="mt-2 text-center text-xs text-slate-400">
          Step {step} active in {mode.toUpperCase()} drill mode.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-slate-700 bg-[#070d1e] sm:h-[390px]"
      aria-label="Interactive 3D Forecourt Training Scene"
    />
  );
}

