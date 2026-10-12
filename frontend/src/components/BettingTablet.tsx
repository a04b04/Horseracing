import { useState } from "react";

const HORSES = [
  { name: "Brown", color: "#8B4513", emoji: "🟤" },
  { name: "Black", color: "#111111", emoji: "⚫" },
  { name: "White", color: "#FFFFFF", emoji: "⚪" },
  { name: "Red", color: "#FF0000", emoji: "🔴" },
  { name: "Blue", color: "#0000FF", emoji: "🔵" },
];

const QUICK_BETS = [5, 10, 25, 50];

// 4/1 odds = stake returned + 4x profit
const ODDS = 4;

export interface Bet {
  horse: number;
  amount: number;
  odds: number;
}

interface BettingTabletProps {
  balance: number;
  running: boolean;
  raceFinished: boolean;
  finishingOrder: number[];
  bet: Bet | null;

  onPlaceBet: (bet: Bet) => void;
  onStartRace: () => void;
  onResetRace: () => void;
}

export default function BettingTablet({
  balance,
  running,
  raceFinished,
  finishingOrder,
  bet,
  onPlaceBet,
  onStartRace,
  onResetRace,
}: BettingTabletProps) {
  const [open, setOpen] = useState(true);

  const [selectedHorse, setSelectedHorse] = useState<number | null>(
    null
  );

  const [stake, setStake] = useState<number>(5);

  const [customStake, setCustomStake] = useState("");

  const [error, setError] = useState("");

  const potentialReturn = stake * (ODDS + 1);

  const winner = finishingOrder[0];

  const won = raceFinished && bet?.horse === winner;

  const handleQuickBet = (amount: number) => {
    setStake(amount);
    setCustomStake("");
    setError("");
  };

  const handleCustomStake = (value: string) => {
    setCustomStake(value);

    const amount = Number(value);

    setStake(amount);
    setError("");
  };

  const handlePlaceBet = () => {
    if (selectedHorse === null) {
      setError("Please select a horse.");
      return;
    }

    if (!Number.isFinite(stake) || stake < 1) {
      setError("Please enter a valid betting amount.");
      return;
    }

    if (stake > balance) {
      setError("You don't have enough credits.");
      return;
    }

    onPlaceBet({
      horse: selectedHorse,
      amount: stake,
      odds: ODDS,
    });

    setError("");
  };

  // Small floating button when tablet is hidden
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          right: 20,
          top: 20,
          zIndex: 30,
          padding: "14px 20px",
          background: "#16a34a",
          color: "white",
          border: "none",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        📱 Open Betting Tablet
      </button>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        right: 20,
        top: 20,
        bottom: 20,
        width: 380,
        maxWidth: "calc(100% - 40px)",
        zIndex: 30,
        background: "#080d0b",
        border: "8px solid #1f2937",
        borderRadius: 24,
        boxShadow: "0 15px 50px rgba(0,0,0,0.6)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Tablet header */}
      <div
        style={{
          padding: "20px",
          background: "#111827",
          borderBottom: "1px solid #374151",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#4ade80",
              letterSpacing: 2,
              fontWeight: "bold",
            }}
          >
            ALCES BOOKIE
          </div>

          <h2
            style={{
              fontSize: 19,
              margin: "6px 0 0",
            }}
          >
            🏇 Grand National Disaster
          </h2>
        </div>

        <button
          onClick={() => setOpen(false)}
          title="Hide tablet"
          style={{
            background: "#374151",
            color: "white",
            border: "none",
            width: 35,
            height: 35,
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable tablet content */}
      <div
        style={{
          padding: 20,
          overflowY: "auto",
          flex: 1,
        }}
      >
        {/* Balance */}
        <div
          style={{
            padding: 18,
            background:
              "linear-gradient(135deg, #14532d, #052e16)",
            borderRadius: 12,
            marginBottom: 25,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#bbf7d0",
              letterSpacing: 1,
            }}
          >
            YOUR BALANCE
          </div>

          <div
            style={{
              fontSize: 30,
              fontWeight: "bold",
              marginTop: 5,
            }}
          >
            💰 {balance.toLocaleString()} Credits
          </div>
        </div>

        {/* Before placing a bet */}
        {!bet && !running && !raceFinished && (
          <>
            <h3
              style={{
                fontSize: 14,
                letterSpacing: 1,
                marginBottom: 15,
              }}
            >
              SELECT YOUR HORSE
            </h3>

            {/* Horse cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 25,
              }}
            >
              {HORSES.map((horse, index) => {
                const selected = selectedHorse === index;

                return (
                  <button
                    key={horse.name}
                    onClick={() => {
                      setSelectedHorse(index);
                      setError("");
                    }}
                    style={{
                      background: selected
                        ? "#14532d"
                        : "#1f2937",
                      border: selected
                        ? "2px solid #4ade80"
                        : "2px solid #374151",
                      borderRadius: 12,
                      padding: "15px 10px",
                      color: "white",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 30 }}>
                      {horse.emoji}
                    </div>

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        marginTop: 8,
                      }}
                    >
                      {horse.name}
                    </div>

                    <div
                      style={{
                        color: "#4ade80",
                        marginTop: 5,
                        fontSize: 14,
                      }}
                    >
                      4/1
                    </div>

                    {selected && (
                      <div
                        style={{
                          color: "#86efac",
                          fontSize: 12,
                          marginTop: 6,
                        }}
                      >
                        ✓ SELECTED
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stake selection */}
            <h3
              style={{
                fontSize: 14,
                letterSpacing: 1,
                marginBottom: 15,
              }}
            >
              YOUR STAKE
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                marginBottom: 15,
              }}
            >
              {QUICK_BETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickBet(amount)}
                  style={{
                    padding: "12px 0",
                    background:
                      stake === amount && !customStake
                        ? "#16a34a"
                        : "#1f2937",
                    color: "white",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "#9ca3af",
                marginBottom: 8,
              }}
            >
              Or enter another amount
            </label>

            <input
              type="number"
              min="1"
              step="1"
              placeholder="Enter credits..."
              value={customStake}
              onChange={(event) =>
                handleCustomStake(event.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 13,
                background: "#111827",
                color: "white",
                border: "1px solid #374151",
                borderRadius: 8,
                fontSize: 16,
                marginBottom: 20,
              }}
            />

            {/* Potential return */}
            <div
              style={{
                padding: 18,
                background: "#111827",
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span style={{ color: "#9ca3af" }}>
                  Odds
                </span>

                <strong>4/1</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#9ca3af" }}>
                  Potential Return
                </span>

                <strong
                  style={{
                    color: "#4ade80",
                    fontSize: 19,
                  }}
                >
                  {potentialReturn.toLocaleString()}
                </strong>
              </div>
            </div>

            {error && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: 13,
                  marginBottom: 15,
                }}
              >
                {error}
              </p>
            )}

            {/* Place bet */}
            <button
              onClick={handlePlaceBet}
              style={{
                width: "100%",
                padding: 17,
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 17,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              💰 PLACE BET
            </button>
          </>
        )}

        {/* Bet confirmed */}
        {bet && !running && !raceFinished && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 55 }}>🎟️</div>

            <h2 style={{ color: "#4ade80" }}>
              BET PLACED!
            </h2>

            <div
              style={{
                background: "#111827",
                padding: 20,
                borderRadius: 12,
                marginTop: 20,
                textAlign: "left",
              }}
            >
              <p>🐎 Horse: {HORSES[bet.horse].name}</p>

              <p style={{ marginTop: 12 }}>
                💰 Stake: {bet.amount} Credits
              </p>

              <p style={{ marginTop: 12 }}>
                📊 Odds: {bet.odds}/1
              </p>

              <p
                style={{
                  marginTop: 12,
                  color: "#4ade80",
                }}
              >
                Potential Return:{" "}
                {bet.amount * (bet.odds + 1)} Credits
              </p>
            </div>

            <button
              onClick={onStartRace}
              style={{
                width: "100%",
                padding: 18,
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 25,
                cursor: "pointer",
              }}
            >
              🏁 START RACE
            </button>
          </div>
        )}

        {/* Race running */}
        {bet && running && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 55 }}>🏇</div>

            <h2 style={{ marginTop: 15 }}>
              RACE IN PROGRESS
            </h2>

            <p
              style={{
                color: "#9ca3af",
                marginTop: 15,
              }}
            >
              Your horse
            </p>

            <h2 style={{ color: "#4ade80" }}>
              {HORSES[bet.horse].emoji}{" "}
              {HORSES[bet.horse].name}
            </h2>

            <p style={{ marginTop: 20 }}>
              Stake: {bet.amount} Credits
            </p>

            <p style={{ marginTop: 10 }}>
              Potential Return:{" "}
              {bet.amount * (bet.odds + 1)} Credits
            </p>

            <p
              style={{
                color: "#86efac",
                marginTop: 30,
              }}
            >
              🏁 Good luck!
            </p>
          </div>
        )}

        {/* Race finished */}
        {bet && raceFinished && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 60 }}>
              {won ? "🏆" : "💀"}
            </div>

            <h1
              style={{
                color: won ? "#4ade80" : "#f87171",
                marginTop: 15,
              }}
            >
              {won ? "YOU WON!" : "YOU LOST!"}
            </h1>

            <div
              style={{
                background: "#111827",
                padding: 20,
                borderRadius: 12,
                marginTop: 20,
              }}
            >
              <p>
                Your Horse: {HORSES[bet.horse].name}
              </p>

              <p style={{ marginTop: 12 }}>
                Position:{" "}
                {finishingOrder.indexOf(bet.horse) + 1}
              </p>

              <p style={{ marginTop: 12 }}>
                Stake: {bet.amount} Credits
              </p>

              {won ? (
                <h2
                  style={{
                    color: "#4ade80",
                    marginTop: 20,
                  }}
                >
                  +{bet.amount * bet.odds} Credits Profit
                </h2>
              ) : (
                <h2
                  style={{
                    color: "#f87171",
                    marginTop: 20,
                  }}
                >
                  -{bet.amount} Credits
                </h2>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedHorse(null);
                setStake(5);
                setCustomStake("");
                setError("");
                onResetRace();
              }}
              style={{
                width: "100%",
                padding: 18,
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 25,
                cursor: "pointer",
              }}
            >
              🏇 RACE AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Tablet footer */}
      <div
        style={{
          padding: 12,
          background: "#111827",
          borderTop: "1px solid #374151",
          textAlign: "center",
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        GRAND NATIONAL DISASTER • VIRTUAL CREDITS ONLY
      </div>
    </div>
  );
}