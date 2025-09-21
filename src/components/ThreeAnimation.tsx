import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeAnimationProps {
  concept: string;
  width?: number;
  height?: number;
}

export default function ThreeAnimation({ concept, width = 400, height = 300 }: ThreeAnimationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create animation based on concept
    let animatedObjects: THREE.Object3D[] = [];

    switch (concept.toLowerCase()) {
      case 'atom':
        animatedObjects = createAtomAnimation(scene);
        break;
      case 'solar system':
      case 'planets':
        animatedObjects = createSolarSystemAnimation(scene);
        break;
      case 'molecule':
      case 'water':
        animatedObjects = createMoleculeAnimation(scene);
        break;
      case 'geometry':
      case 'shapes':
        animatedObjects = createGeometryAnimation(scene);
        break;
      default:
        animatedObjects = createDefaultAnimation(scene);
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Rotate objects
      animatedObjects.forEach((obj, index) => {
        obj.rotation.x += 0.005 + index * 0.002;
        obj.rotation.y += 0.01 + index * 0.003;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = () => { isDragging = true; };
    const handleMouseUp = () => { isDragging = false; };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        previousMousePosition = { x: e.clientX, y: e.clientY };
        return;
      }

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      animatedObjects.forEach(obj => {
        obj.rotation.y += deltaMove.x * 0.01;
        obj.rotation.x += deltaMove.y * 0.01;
      });

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleWheel = (e: WheelEvent) => {
      camera.position.z += e.deltaY * 0.01;
      camera.position.z = Math.max(2, Math.min(10, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [concept, width, height]);

  return (
    <div 
      ref={mountRef} 
      className="rounded-lg overflow-hidden border shadow-sm"
      style={{ width, height }}
    />
  );
}

function createAtomAnimation(scene: THREE.Scene): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];

  // Nucleus
  const nucleusGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const nucleusMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  scene.add(nucleus);
  objects.push(nucleus);

  // Electron orbits
  const orbitRadius = [1, 1.5, 2];
  orbitRadius.forEach((radius, index) => {
    const electronGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const electronMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff });
    const electron = new THREE.Mesh(electronGeometry, electronMaterial);
    
    const orbitGroup = new THREE.Group();
    electron.position.x = radius;
    orbitGroup.add(electron);
    orbitGroup.rotation.z = (index * Math.PI) / 3;
    
    scene.add(orbitGroup);
    objects.push(orbitGroup);
  });

  return objects;
}

function createSolarSystemAnimation(scene: THREE.Scene): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];

  // Sun
  const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sunMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xffaa00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);
  objects.push(sun);

  // Planets
  const planetData = [
    { radius: 0.1, distance: 1.2, color: 0x8c7853 },
    { radius: 0.15, distance: 1.8, color: 0x4444ff },
    { radius: 0.12, distance: 2.5, color: 0xff4444 }
  ];

  planetData.forEach((planet, index) => {
    const planetGeometry = new THREE.SphereGeometry(planet.radius, 16, 16);
    const planetMaterial = new THREE.MeshPhongMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    
    const orbitGroup = new THREE.Group();
    planetMesh.position.x = planet.distance;
    orbitGroup.add(planetMesh);
    
    scene.add(orbitGroup);
    objects.push(orbitGroup);
  });

  return objects;
}

function createMoleculeAnimation(scene: THREE.Scene): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];

  // Water molecule (H2O)
  const oxygenGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const oxygenMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
  const oxygen = new THREE.Mesh(oxygenGeometry, oxygenMaterial);
  scene.add(oxygen);
  objects.push(oxygen);

  // Hydrogen atoms
  const hydrogenGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const hydrogenMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  
  const hydrogen1 = new THREE.Mesh(hydrogenGeometry, hydrogenMaterial);
  hydrogen1.position.set(0.8, 0.6, 0);
  scene.add(hydrogen1);
  objects.push(hydrogen1);

  const hydrogen2 = new THREE.Mesh(hydrogenGeometry, hydrogenMaterial);
  hydrogen2.position.set(0.8, -0.6, 0);
  scene.add(hydrogen2);
  objects.push(hydrogen2);

  // Bonds
  const bondGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
  const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
  
  const bond1 = new THREE.Mesh(bondGeometry, bondMaterial);
  bond1.position.set(0.4, 0.3, 0);
  bond1.rotation.z = -Math.PI / 6;
  scene.add(bond1);

  const bond2 = new THREE.Mesh(bondGeometry, bondMaterial);
  bond2.position.set(0.4, -0.3, 0);
  bond2.rotation.z = Math.PI / 6;
  scene.add(bond2);

  return objects;
}

function createGeometryAnimation(scene: THREE.Scene): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];

  // Various geometric shapes
  const shapes = [
    { geometry: new THREE.BoxGeometry(0.8, 0.8, 0.8), color: 0xff4444, position: [-2, 0, 0] },
    { geometry: new THREE.SphereGeometry(0.5, 32, 32), color: 0x44ff44, position: [0, 0, 0] },
    { geometry: new THREE.ConeGeometry(0.5, 1, 8), color: 0x4444ff, position: [2, 0, 0] }
  ];

  shapes.forEach(shape => {
    const material = new THREE.MeshPhongMaterial({ color: shape.color });
    const mesh = new THREE.Mesh(shape.geometry, material);
    mesh.position.set(shape.position[0], shape.position[1], shape.position[2]);
    mesh.castShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  });

  return objects;
}

function createDefaultAnimation(scene: THREE.Scene): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];

  // Default cube animation
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({ color: 0x4f46e5 });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  scene.add(cube);
  objects.push(cube);

  return objects;
}