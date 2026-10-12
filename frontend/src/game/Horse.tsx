import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

interface HorseProps {
  running?: boolean;
  speed?: number;
  scale?: number;
  lane?: number;
  color?: string;
  totalLaps?: number;
  onLapComplete?: (lane: number, lap: number) => void;
  onFinish?: (lane: number) => void;
}

// Horse speed settings
const MIN_SPEED = 30;
const MAX_SPEED = 60;
const STARTING_SPEED = 45;

// How often horses receive a new random speed
const SPEED_CHANGE_INTERVAL = 3;

// How quickly horses accelerate/decelerate
const ACCELERATION = 2;

export default function Horse({
  running = false,
  speed = STARTING_SPEED,
  scale = 0.05,
  lane = 0,
  color = "#ff0000",
  totalLaps = 3,
  onLapComplete,
  onFinish,
}: HorseProps) {
  const group = useRef<THREE.Group>(null);

  // Distance travelled by the horse
  const distance = useRef(0);

  // Number of completed laps
  const lastLap = useRef(0);

  // Whether the horse has finished
  const finished = useRef(false);

  // Current movement speed (kept within our new speed range)
  const initialSpeed = THREE.MathUtils.clamp(
    speed,
    MIN_SPEED,
    MAX_SPEED
  );

  const currentSpeed = useRef(initialSpeed);

  // Speed the horse is accelerating/decelerating towards
  const targetSpeed = useRef(initialSpeed);

  // Time since the last random speed change
  const speedTimer = useRef(0);

  // Load horse model
  const { scene, animations } = useGLTF("/models/Horse.glb");

  // Clone the horse and apply its individual colour
  const clonedScene = useMemo(() => {
    const horse = clone(scene);

    horse.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        const newMaterials = materials.map((material) => {
          const newMaterial = material.clone();

          if (newMaterial instanceof THREE.MeshStandardMaterial) {
            // Remove original colour influences
            newMaterial.vertexColors = false;
            newMaterial.map = null;

            // Apply horse colour
            newMaterial.color.set(color);

            // Natural-looking material
            newMaterial.roughness = 0.9;
            newMaterial.metalness = 0;

            newMaterial.needsUpdate = true;
          }

          return newMaterial;
        });

        child.material = Array.isArray(child.material)
          ? newMaterials
          : newMaterials[0];
      }
    });

    return horse;
  }, [scene, color]);

  // Horse animations
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const animation = Object.values(actions)[0];

    if (!animation) return;

    if (running && !finished.current) {
      animation.reset().play();
    } else {
      animation.stop();
    }

    return () => {
      animation.stop();
    };
  }, [actions, running]);

  // Track dimensions
  const radius = 49 + lane * 6;
  const straightLength = 160;
  const halfStraight = straightLength / 2;

  // Total distance around the horse's lane
  const totalLength =
    2 * straightLength + 2 * Math.PI * radius;

  // Calculate position anywhere on the oval track
  const getTrackPosition = (travelled: number) => {
    const d = travelled % totalLength;

    // Bottom straight: left to right
    if (d < straightLength) {
      return new THREE.Vector3(
        -halfStraight + d,
        0,
        -radius
      );
    }

    // Right bend: bottom to top
    if (d < straightLength + Math.PI * radius) {
      const bendDistance = d - straightLength;

      const theta =
        -Math.PI / 2 + bendDistance / radius;

      return new THREE.Vector3(
        halfStraight + radius * Math.cos(theta),
        0,
        radius * Math.sin(theta)
      );
    }

    // Top straight: right to left
    if (d < 2 * straightLength + Math.PI * radius) {
      const straightDistance =
        d - straightLength - Math.PI * radius;

      return new THREE.Vector3(
        halfStraight - straightDistance,
        0,
        radius
      );
    }

    // Left bend: top to bottom
    const bendDistance =
      d - 2 * straightLength - Math.PI * radius;

    const theta =
      Math.PI / 2 + bendDistance / radius;

    return new THREE.Vector3(
      -halfStraight + radius * Math.cos(theta),
      0,
      radius * Math.sin(theta)
    );
  };

  // Move horse around the track
  useFrame((_, delta) => {
    if (!group.current) return;

    // Prevent huge jumps if the browser briefly freezes
    const safeDelta = Math.min(delta, 0.1);

    // Only move while the race is running
    if (running && !finished.current) {
      // Count time until the next random speed change
      speedTimer.current += safeDelta;

      // Every 3 seconds, generate a new random speed
      if (speedTimer.current >= SPEED_CHANGE_INTERVAL) {
        targetSpeed.current =
          MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);

        speedTimer.current -= SPEED_CHANGE_INTERVAL;

        console.log(
          `🐎 Horse ${lane + 1} new target speed: ${targetSpeed.current.toFixed(1)}`
        );
      }

      // Smoothly accelerate/decelerate towards target speed
      currentSpeed.current = THREE.MathUtils.damp(
        currentSpeed.current,
        targetSpeed.current,
        ACCELERATION,
        safeDelta
      );

      // Compensate for different lane lengths
      const adjustedSpeed =
        currentSpeed.current * (totalLength / 700);

      // Increase distance travelled
      distance.current += adjustedSpeed * safeDelta;

      // Match galloping animation to movement speed
      const animation = Object.values(actions)[0];

      if (animation) {
        animation.timeScale = THREE.MathUtils.clamp(
          currentSpeed.current / STARTING_SPEED,
          0.6,
          1.5
        );
      }

      // Calculate completed laps
      const completedLaps = Math.floor(
        distance.current / totalLength
      );

      // Detect when a lap is completed
      if (completedLaps > lastLap.current) {
        lastLap.current = completedLaps;

        console.log(
          `🏁 Horse ${lane + 1} completed lap ${completedLaps}!`
        );

        // Update lap counter in Races.tsx
        onLapComplete?.(lane, completedLaps);
      }

      // Check whether the horse has finished all laps
      if (completedLaps >= totalLaps) {
        finished.current = true;

        // Stop exactly at the finish line
        distance.current = totalLength * totalLaps;

        console.log(
          `🏆 Horse ${lane + 1} finished the race!`
        );

        // Notify Races.tsx
        onFinish?.(lane);
      }
    }

    // Calculate current position
    const currentPosition = getTrackPosition(
      distance.current
    );

    // Calculate the position slightly ahead
    const nextPosition = getTrackPosition(
      distance.current + 0.1
    );

    // Calculate direction of travel
    const direction = new THREE.Vector3()
      .subVectors(nextPosition, currentPosition)
      .normalize();

    // Update horse position
    group.current.position.copy(currentPosition);

    // Rotate horse to face the direction of travel
    group.current.rotation.y = Math.atan2(
      direction.x,
      direction.z
    );
  });

  return (
    <group ref={group} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/models/Horse.glb");