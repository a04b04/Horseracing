import * as THREE from "three";

export default function RaceTrack() {
  const outerRadius = 80;
  const innerRadius = 45;
  const straightLength = 160;

  const createOval = (radius: number) => {
    const shape = new THREE.Shape();

    shape.moveTo(-straightLength / 2, -radius);
    shape.lineTo(straightLength / 2, -radius);

    shape.absarc(
      straightLength / 2,
      0,
      radius,
      -Math.PI / 2,
      Math.PI / 2,
      false
    );

    shape.lineTo(-straightLength / 2, radius);

    shape.absarc(
      -straightLength / 2,
      0,
      radius,
      Math.PI / 2,
      (3 * Math.PI) / 2,
      false
    );

    return shape;
  };

  const trackShape = createOval(outerRadius);
  const innerShape = createOval(innerRadius);

  trackShape.holes.push(innerShape);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, 0.02]}>
        <shapeGeometry args={[trackShape]} />
        <meshStandardMaterial color="#c48e54" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}