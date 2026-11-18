import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Plane, Raycaster, Vector2, Vector3 } from "three";

type Furniture = {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
};

type ColorTheme = "sage" | "terracotta" | "ocean";

// Shared palette values keep the 3D room coordinated with the selected UI theme.
const roomPalettes: Record<
  ColorTheme,
  {
    background: string;
    floor: string;
    backWall: string;
    leftWall: string;
    rightWall: string;
  }
> = {
  sage: {
    background: "#f3f1e9",
    floor: "#d9c8ac",
    backWall: "#eee5d8",
    leftWall: "#e3d7c8",
    rightWall: "#d5c5b2",
  },
  terracotta: {
    background: "#f8eee7",
    floor: "#ddc0a6",
    backWall: "#f4ddd2",
    leftWall: "#e7cabb",
    rightWall: "#d5b39f",
  },
  ocean: {
    background: "#eaf3f4",
    floor: "#c3d6d6",
    backWall: "#e0eeee",
    leftWall: "#cfe0e0",
    rightWall: "#b9d1d4",
  },
};

function Room({ colorTheme }: { colorTheme: ColorTheme }) {
  const colors = roomPalettes[colorTheme];

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color={colors.floor} />
      </mesh>

      <mesh position={[0, 2, -4]}>
        <boxGeometry args={[10, 4, 0.2]} />
        <meshStandardMaterial color={colors.backWall} />
      </mesh>

      <mesh position={[-5, 2, 0]}>
        <boxGeometry args={[0.2, 4, 8]} />
        <meshStandardMaterial color={colors.leftWall} />
      </mesh>

      <mesh position={[5, 2, 0]}>
        <boxGeometry args={[0.2, 4, 8]} />
        <meshStandardMaterial color={colors.rightWall} />
      </mesh>
    </>
  );
}

function useGroundDrag(
  position: [number, number, number],
  setPosition: (position: [number, number, number]) => void,
  onDragChange: (isDragging: boolean) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const { camera, gl } = useThree();
  // A horizontal plane lets pointer movement continue over the room floor,
  // even when the pointer leaves the furniture mesh itself.
  const groundPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));
  // Preserve the offset from where the user grabbed the object.
  const dragOffset = useRef<[number, number]>([0, 0]);
  const activePointerId = useRef<number | null>(null);

  useEffect(() => {
    if (!isDragging) return;

    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const intersection = new Vector3();
    const canvas = gl.domElement;

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== activePointerId.current) return;

      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);

      if (raycaster.ray.intersectPlane(groundPlane.current, intersection)) {
        setPosition([
          Math.max(-3.6, Math.min(3.6, intersection.x + dragOffset.current[0])),
          0,
          Math.max(-3, Math.min(3, intersection.z + dragOffset.current[1])),
        ]);
      }
    }

    function stopDragging(event: PointerEvent) {
      if (event.pointerId !== activePointerId.current) return;
      activePointerId.current = null;
      setIsDragging(false);
      onDragChange(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [camera, gl, isDragging, onDragChange, setPosition]);

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const point = event.ray.intersectPlane(groundPlane.current, new Vector3());
    if (!point) return;

    dragOffset.current = [position[0] - point.x, position[2] - point.z];
    activePointerId.current = event.pointerId;
    setIsDragging(true);
    onDragChange(true);
  }

  return onPointerDown;
}

function Sofa({
  position,
  setPosition,
  onDragChange,
  rotation,
  setRotation,
}: {
  position: [number, number, number];
  setPosition: (position: [number, number, number]) => void;
  onDragChange: (isDragging: boolean) => void;
  rotation: number;
  setRotation: Dispatch<SetStateAction<number>>;
}) {
  const onPointerDown = useGroundDrag(position, setPosition, onDragChange);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "r") {
        setRotation((previousRotation) => previousRotation + Math.PI / 4);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setRotation]);

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onPointerDown={onPointerDown}
    >
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.5, 0.4, 1]} />
        <meshStandardMaterial color="#8b6f5c" />
      </mesh>

      <mesh position={[0, 1.2, -0.4]}>
        <boxGeometry args={[2.5, 1, 0.2]} />
        <meshStandardMaterial color="#a08068" />
      </mesh>

      <mesh position={[-1.2, 0.9, 0]}>
        <boxGeometry args={[0.2, 0.8, 1]} />
        <meshStandardMaterial color="#8b6f5c" />
      </mesh>

      <mesh position={[1.2, 0.9, 0]}>
        <boxGeometry args={[0.2, 0.8, 1]} />
        <meshStandardMaterial color="#8b6f5c" />
      </mesh>
    </group>
  );
}

function CoffeeTable({
  position,
  setPosition,
  onDragChange,
}: {
  position: [number, number, number];
  setPosition: (position: [number, number, number]) => void;
  onDragChange: (isDragging: boolean) => void;
}) {
  const onPointerDown = useGroundDrag(position, setPosition, onDragChange);

  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
    >
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 0.15, 1]} />
        <meshStandardMaterial color="#9b7653" />
      </mesh>

      {[-0.7, 0.7].map((x) =>
        [-0.35, 0.35].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.32, z]}>
            <boxGeometry args={[0.12, 0.6, 0.12]} />
            <meshStandardMaterial color="#65452e" />
          </mesh>
        ))
      )}
    </group>
  );
}


function FloorLamp({
  position,
  setPosition,
  onDragChange,
}: {
  position: [number, number, number];
  setPosition: (position: [number, number, number]) => void;
  onDragChange: (isDragging: boolean) => void;
}) {
  const onPointerDown = useGroundDrag(position, setPosition, onDragChange);

  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
    >
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.15, 32]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 16]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.25, 0.45, 0.4, 32]} />
        <meshStandardMaterial color="#e8c77b" />
      </mesh>
    </group>
  );
}



function Bookshelf({
  position,
  setPosition,
  onDragChange,
}: {
  position: [number, number, number];
  setPosition: (position: [number, number, number]) => void;
  onDragChange: (isDragging: boolean) => void;
}) {
  const onPointerDown = useGroundDrag(position, setPosition, onDragChange);

  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
    >
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.5, 3, 0.4]} />
        <meshStandardMaterial color="#8b5e3c" />
      </mesh>

      {[0.5, 1.3, 2.1].map((y) => (
        <mesh key={y} position={[0, y, 0.25]}>
          <boxGeometry args={[1.4, 0.08, 0.5]} />
          <meshStandardMaterial color="#bd9b73" />
        </mesh>
      ))}
    </group>
  );
}

function Room3D({
  colorTheme,
  furniture,
  sofaPosition,
  setSofaPosition,
  coffeeTablePosition,
  setCoffeeTablePosition,
  floorLampPosition,
  setFloorLampPosition,
  bookshelfPosition,
  setBookshelfPosition,
  sofaRotation,
  setSofaRotation,
}: {
  colorTheme: ColorTheme;
  furniture: Furniture[];
  sofaPosition: [number, number, number];
  setSofaPosition: (position: [number, number, number]) => void;
  coffeeTablePosition: [number, number, number];
  setCoffeeTablePosition: (position: [number, number, number]) => void;
  floorLampPosition: [number, number, number];
  setFloorLampPosition: (position: [number, number, number]) => void;
  bookshelfPosition: [number, number, number];
  setBookshelfPosition: (position: [number, number, number]) => void;
  sofaRotation: number;
  setSofaRotation: Dispatch<SetStateAction<number>>;
}) {
  const [isDraggingFurniture, setIsDraggingFurniture] = useState(false);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <Canvas camera={{ position: [10, 8, 12], fov: 50 }}>
        <color attach="background" args={[roomPalettes[colorTheme].background]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={2} />

        <Room colorTheme={colorTheme} />

        {furniture.map((item, index) => (
          <group key={`${item.id}-${index}`}>
            {item.name === "Nordic Sofa" && (
              <Sofa
                position={sofaPosition}
                setPosition={setSofaPosition}
                onDragChange={setIsDraggingFurniture}
                rotation={sofaRotation}
                setRotation={setSofaRotation}
              />
            )}
            {item.name === "Coffee Table" && (
              <CoffeeTable
                position={coffeeTablePosition}
                setPosition={setCoffeeTablePosition}
                onDragChange={setIsDraggingFurniture}
              />
            )}
            {item.name === "Floor Lamp" && (
              <FloorLamp
                position={floorLampPosition}
                setPosition={setFloorLampPosition}
                onDragChange={setIsDraggingFurniture}
              />
            )}
            {item.name === "Bookshelf" && (
              <Bookshelf
                position={bookshelfPosition}
                setPosition={setBookshelfPosition}
                onDragChange={setIsDraggingFurniture}
              />
            )}
          </group>
        ))}

        <OrbitControls enabled={!isDraggingFurniture} />
      </Canvas>
    </div>
  );
}

export default Room3D;
