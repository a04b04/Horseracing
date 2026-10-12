import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";

import RaceTrack from "./RaceTrack";
import PlayerControls from "./PlayerControls";
import Horse from "./Horse";
import FinishLine from "./FinishLine";

// Five horse colours
const HORSE_COLORS = [
  "#8B4513", // Brown
  "#111111", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#0000FF", // Blue
];

interface RaceSceneProps {
  running: boolean;
  raceId: number;
  onLapComplete: (lane: number, lap: number) => void;
  onFinish: (lane: number) => void;
}

export default function RaceScene({
  running,
  raceId,
  onLapComplete,
  onFinish,
}: RaceSceneProps) {
  return (
    <Canvas camera={{ position: [0, 5, -90], fov: 75 }}>
      {/* Lighting */}
      <ambientLight intensity={1.5} />

      <directionalLight
        position={[20, 50, 20]}
        intensity={2}
      />

      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* Grass */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#3d7a35" />
      </mesh>

      {/* Racetrack */}
      <RaceTrack />

      {/* Finish line */}
      <FinishLine />

      {/* Five horses */}
      {HORSE_COLORS.map((color, index) => (
        <Horse
          key={`${raceId}-${index}`}
          lane={index}
          running={running}
          speed={45}
          scale={0.05}
          color={color}
          totalLaps={3}
          onLapComplete={onLapComplete}
          onFinish={onFinish}
        />
      ))}

      {/* First-person controls */}
      <PlayerControls />
    </Canvas>
  );
}