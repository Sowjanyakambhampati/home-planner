import { useEffect, useState } from "react";
import Room3D from "./Room3D";
import "./App.css";

type Furniture = {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
};

type ColorTheme = "sage" | "terracotta" | "ocean";

function App() {
  // Positions and rotation are kept in the parent so they can be shared with
  // both the 3D scene and the save/load API payload.
  const [colorTheme, setColorTheme] = useState<ColorTheme>("sage");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [selectedItems, setSelectedItems] = useState<Furniture[]>([]);
  const [sofaPosition, setSofaPosition] =
    useState<[number, number, number]>([0, 0, 0]);
  const [coffeeTablePosition, setCoffeeTablePosition] =
    useState<[number, number, number]>([0, 0, 2]);
  const [floorLampPosition, setFloorLampPosition] =
    useState<[number, number, number]>([3, 0, 2]);
  const [bookshelfPosition, setBookshelfPosition] =
    useState<[number, number, number]>([-3, 0, -2]);
  const [sofaRotation, setSofaRotation] = useState<number>(0);
  const [roomWidth, setRoomWidth] = useState<number>(0);
  const [roomLength, setRoomLength] = useState<number>(0);

  const roomArea = roomWidth * roomLength;

  useEffect(() => {
    // Loading the catalogue once keeps it separate from the user's selection
    // state and from furniture movement state.
    fetch("http://localhost:5000/api/furniture")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch furniture");
        }
        return response.json();
      })
      .then((data: Furniture[]) => {
        setFurniture(data);
        setLoading(false);
      })
      .catch((error: Error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  function addToRoom(item: Furniture) {
    setSelectedItems((previousItems) => [...previousItems, item]);
  }

  function removeFromRoom(indexToRemove: number) {
    setSelectedItems((previousItems) =>
      previousItems.filter((_, index) => index !== indexToRemove)
    );
  }

  async function saveRoomDesign() {
    // Store both the selected items and their current scene configuration.
    const design = {
      furniture: selectedItems,
      sofaPosition,
      coffeeTablePosition,
      floorLampPosition,
      bookshelfPosition,
      sofaRotation,
    };

    try {
      const response = await fetch("http://localhost:5000/api/design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(design),
      });

      if (!response.ok) {
        throw new Error("Failed to save design");
      }

      alert("Room design saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Could not save room design.");
    }
  }

  async function loadRoomDesign() {
    try {
      const response = await fetch("http://localhost:5000/api/design");

      if (!response.ok) {
        throw new Error("Failed to load design");
      }

      const design = await response.json();

      // Stored values fall back to defaults for designs created before a
      // particular position or rotation field was introduced.
      setSelectedItems(design.furniture);
      setSofaPosition(design.sofaPosition ?? [0, 0, 0]);
      setCoffeeTablePosition(design.coffeeTablePosition ?? [0, 0, 2]);
      setFloorLampPosition(design.floorLampPosition ?? [3, 0, 2]);
      setBookshelfPosition(design.bookshelfPosition ?? [-3, 0, -2]);
      setSofaRotation(design.sofaRotation ?? 0);

      alert("Room design loaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Could not load room design.");
    }
  }

  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.price,
    0
  );

  return (
    <div className="app" data-theme={colorTheme}>
      <header className="header">
        <div className="hero-copy">
          <span className="eyebrow">HOME PLANNER · ROOM DESIGN</span>
          <h1>Home Planner</h1>
          <p>Design a home that feels like yours.</p>
        </div>
        <div className="hero-note">
          <span>YOUR SPACE, YOUR WAY</span>
          <p>Make room for what matters.</p>
          <div className="theme-picker" role="group" aria-label="Choose a color theme">
            <span>COLOR MOOD</span>
            <div className="theme-swatches">
              <button
                type="button"
                className="theme-swatch"
                data-color="sage"
                aria-label="Sage color theme"
                aria-pressed={colorTheme === "sage"}
                onClick={() => setColorTheme("sage")}
              />
              <button
                type="button"
                className="theme-swatch"
                data-color="terracotta"
                aria-label="Terracotta color theme"
                aria-pressed={colorTheme === "terracotta"}
                onClick={() => setColorTheme("terracotta")}
              />
              <button
                type="button"
                className="theme-swatch"
                data-color="ocean"
                aria-label="Ocean color theme"
                aria-pressed={colorTheme === "ocean"}
                onClick={() => setColorTheme("ocean")}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="catalogue">
          <div className="section-heading">
            <div>
              <span className="section-kicker">START WITH THE PIECES</span>
              <h2>Furniture catalogue</h2>
              <p>Choose the pieces that make your space feel like home.</p>
            </div>
            {!loading && !error && (
              <span className="item-count">{furniture.length} pieces</span>
            )}
          </div>

          {loading && <p>Loading furniture...</p>}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && (
            <div className="product-grid">
              {furniture.map((item) => (
                <div className="product-card" key={item.id}>
                  <div className="product-image">{item.emoji}</div>
                  <h3>{item.name}</h3>
                  <p>{item.category}</p>
                  <strong>€{item.price}</strong>

                  <button type="button" onClick={() => addToRoom(item)}>
                    Add to room
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="room">
          <div className="section-heading">
            <div>
              <span className="section-kicker">MAKE IT YOURS</span>
              <h2>My room</h2>
            </div>
            <span className="item-count">
              {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="room-dimensions">
            <label>
              Room width (metres):
              <input
                type="number"
                value={roomWidth}
                onChange={(event) =>
                  setRoomWidth(Math.max(0, Number(event.target.value)))
                }
                min="0"
              />
            </label>

            <label>
              Room length (metres):
              <input
                type="number"
                value={roomLength}
                onChange={(event) =>
                  setRoomLength(Math.max(0, Number(event.target.value)))
                }
                min="0"
              />
            </label>

            <h3>Room area: {roomArea} m²</h3>
          </div>

          <div className="room-layout">
            <h3>3D room preview</h3>
            <p>Drag pieces to arrange them. Use your mouse or trackpad to explore.</p>
            <Room3D
              colorTheme={colorTheme}
              furniture={selectedItems}
              sofaPosition={sofaPosition}
              setSofaPosition={setSofaPosition}
              coffeeTablePosition={coffeeTablePosition}
              setCoffeeTablePosition={setCoffeeTablePosition}
              floorLampPosition={floorLampPosition}
              setFloorLampPosition={setFloorLampPosition}
              bookshelfPosition={bookshelfPosition}
              setBookshelfPosition={setBookshelfPosition}
              sofaRotation={sofaRotation}
              setSofaRotation={setSofaRotation}
            />
          </div>

          {selectedItems.length === 0 ? (
            <div className="empty-state">
              <span aria-hidden="true">✦</span>
              <div>
                <strong>Your room is ready to take shape</strong>
                <p>Add furniture from the catalogue to start planning.</p>
              </div>
            </div>
          ) : (
            <div
              className="furniture-layout"
              style={{
                aspectRatio:
                  roomWidth > 0 && roomLength > 0
                    ? `${roomWidth} / ${roomLength}`
                    : "5 / 4",
              }}
            >
              {selectedItems.map((item, index) => (
                <div
                  className="furniture-block"
                  key={`${item.id}-${index}`}
                >
                  <span>{item.emoji}</span>
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          )}

          {selectedItems.length > 0 && (
            <div className="selected-items">
              {selectedItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="room-item"
                >
                  <p>
                    {item.emoji} {item.name} — €{item.price}
                  </p>

                  <button type="button" onClick={() => removeFromRoom(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="room-footer">
            <div className="room-total">
              <span>Estimated total</span>
              <strong>€{totalPrice}</strong>
            </div>
            <div className="room-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={loadRoomDesign}
              >
                Load design
              </button>
              <button type="button" onClick={saveRoomDesign}>
                Save design
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
