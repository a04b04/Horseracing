import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

export default function PlayerControls() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    camera.position.set(0, 5, -90);

    const keyDown = (event: KeyboardEvent) => {
      if (event.code === "Tab" && document.pointerLockElement) {
        event.preventDefault();
        document.exitPointerLock();
        keys.current = {};
        return;
      }

      keys.current[event.code] = true;
    };

    const keyUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };

    const handleBlur = () => {
      keys.current = {};
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [camera]);

  useFrame((_, delta) => {
    // Only move when the mouse is locked inside the game
    if (!document.pointerLockElement) return;

    const speed = keys.current["ShiftLeft"] ? 20 : 10;

    // Get the direction the camera is facing
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // Remove vertical movement
    forward.y = 0;
    forward.normalize();

    // Calculate the direction to the right
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const movement = new THREE.Vector3();

    if (keys.current["KeyW"]) movement.add(forward);
    if (keys.current["KeyS"]) movement.sub(forward);
    if (keys.current["KeyD"]) movement.add(right);
    if (keys.current["KeyA"]) movement.sub(right);

    // Prevent diagonal movement being faster
    if (movement.lengthSq() > 0) {
      movement.normalize();
      camera.position.addScaledVector(movement, speed * delta);
    }

    // Keep player at ground level
    camera.position.y = 5;
  });

  return <PointerLockControls />;
}