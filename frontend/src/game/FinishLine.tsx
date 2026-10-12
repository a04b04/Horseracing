import * as THREE from "three";

export default function FinishLine() {
  const tiles = [];

  const tileSize = 3.5;
  const rows = 10;
  const columns = 2;

  // Track boundaries
  const innerRadius = 45;
  const outerRadius = 80;

  const trackWidth = outerRadius - innerRadius;

  // Centre of the track
  const trackCenter = -(innerRadius + trackWidth / 2);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const isWhite = (row + col) % 2 === 0;

      tiles.push(
        <mesh
          key={`${row}-${col}`}
          position={[
            -80 + col * tileSize,
            0.05,
            trackCenter + (row - rows / 2 + 0.5) * tileSize,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[tileSize, tileSize]} />

          <meshBasicMaterial
            color={isWhite ? "#ffffff" : "#111111"}
            side={THREE.DoubleSide}
          />
        </mesh>
      );
    }
  }

  return <group>{tiles}</group>;
}