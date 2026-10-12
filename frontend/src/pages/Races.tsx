import { useEffect, useRef, useState } from "react";

import RaceScene from "../game/RaceScene";
import BettingTablet, { type Bet } from "../components/BettingTablet";

import {
  placeBookieBet,
  payBookieWinnings,
  getBookieBalance,
} from "../services/bookie";

const HORSE_NAMES = ["Brown", "Black", "White", "Red", "Blue"];

const HORSE_COLORS = [
  "#8B4513",
  "#111111",
  "#FFFFFF",
  "#FF0000",
  "#0000FF",
];

const TOTAL_LAPS = 3;

export default function Races() {
  // ==========================================
  // RACE STATE
  // ==========================================

  const [running, setRunning] = useState(false);

  const [laps, setLaps] = useState<number[]>([0, 0, 0, 0, 0]);

  const [finishingOrder, setFinishingOrder] = useState<number[]>([]);

  const finishingOrderRef = useRef<number[]>([]);

  const [raceId, setRaceId] = useState(0);

  // ==========================================
  // BETTING STATE
  // ==========================================

  const [balance, setBalance] = useState<number>(() => {
    const storedUser = sessionStorage.getItem("bookieUser");

    if (!storedUser) {
      return 0;
    }

    try {
      const user = JSON.parse(storedUser);

      return Number(user.balance) || 0;
    } catch {
      return 0;
    }
  });

  const [username] = useState<string>(() => {
    try {
      const storedUser = sessionStorage.getItem("bookieUser");

      return storedUser
        ? JSON.parse(storedUser).username
        : "Guest";
    } catch {
      return "Guest";
    }
  });

  const [bet, setBet] = useState<Bet | null>(null);

  // ==========================================
  // API TRANSACTION STATE
  // ==========================================

  const [placingBet, setPlacingBet] = useState(false);

  const [processingPayout, setProcessingPayout] = useState(false);

  const [payoutError, setPayoutError] = useState<string | null>(null);

  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [loadingBalance, setLoadingBalance] = useState(true);

  // Prevent duplicate transactions
  const betRef = useRef<Bet | null>(null);

  const placingBetRef = useRef(false);

  const payoutProcessedRef = useRef(false);

  const payoutPendingRef = useRef(false);

  const raceFinished =
    finishingOrder.length === HORSE_NAMES.length;

  // ==========================================
  // BALANCE HELPERS
  // ==========================================

  // Update React state and sessionStorage together
  const updateBalance = (newBalance: number) => {
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      console.error("Invalid Bookie balance:", newBalance);
      return;
    }

    setBalance(newBalance);

    const storedUser = sessionStorage.getItem("bookieUser");

    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      sessionStorage.setItem(
        "bookieUser",
        JSON.stringify({
          ...user,
          balance: newBalance,
        })
      );
    } catch (error) {
      console.error("Failed to save balance:", error);
    }
  };

  // Get the actual balance from Bookie
  const refreshBalance = async (): Promise<number> => {
    const actualBalance = await getBookieBalance();

    updateBalance(actualBalance);

    setBalanceError(null);

    console.log("💰 Actual Bookie balance:", actualBalance);

    return actualBalance;
  };

  // ==========================================
  // FETCH BALANCE ON PAGE LOAD
  // ==========================================

  useEffect(() => {
    let active = true;

    const loadBalance = async () => {
      try {
        const actualBalance = await getBookieBalance();

        if (!active) {
          return;
        }

        updateBalance(actualBalance);

        setBalanceError(null);

        console.log(
          "💰 Loaded Bookie balance:",
          actualBalance
        );
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "❌ Failed to load Bookie balance:",
          error
        );

        setBalanceError(
          "Unable to load your balance from Bookie."
        );
      } finally {
        if (active) {
          setLoadingBalance(false);
        }
      }
    };

    void loadBalance();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // LAP COUNTER
  // ==========================================

  const handleLapComplete = (lane: number, lap: number) => {
    setLaps((previous) => {
      const updated = [...previous];

      updated[lane] = lap;

      return updated;
    });
  };

  // ==========================================
  // HORSE FINISHING
  // ==========================================

  const handleFinish = (lane: number) => {
    // Ignore duplicate finish events
    if (finishingOrderRef.current.includes(lane)) {
      return;
    }

    const updatedOrder = [
      ...finishingOrderRef.current,
      lane,
    ];

    finishingOrderRef.current = updatedOrder;

    setFinishingOrder(updatedOrder);

    const position = updatedOrder.length;

    console.log(
      `🏁 ${HORSE_NAMES[lane]} finished in position ${position}`
    );

    // Wait until all five horses finish
    if (updatedOrder.length !== HORSE_NAMES.length) {
      return;
    }

    console.log("🏆 Race finished!");

    setRunning(false);

    const currentBet = betRef.current;

    // Only process the result once
    if (!currentBet || payoutProcessedRef.current) {
      return;
    }

    payoutProcessedRef.current = true;

    const winningHorse = updatedOrder[0];

    // ==========================================
    // LOSING BET
    // ==========================================

    if (currentBet.horse !== winningHorse) {
      console.log(
        `💀 ${HORSE_NAMES[currentBet.horse]} lost!`
      );

      console.log(
        `💸 Lost ${currentBet.amount} credits.`
      );

      // No payout is needed for a losing bet.
      // The stake was already transferred when betting.

      return;
    }

    // ==========================================
    // WINNING BET
    // ==========================================

    // 4/1 odds = original stake + 4x profit
    const payout =
      currentBet.amount * (currentBet.odds + 1);

    console.log(
      `🏆 WINNER! ${HORSE_NAMES[currentBet.horse]} won!`
    );

    console.log(
      `💰 Sending ${payout} credits through Bookie API...`
    );

    payoutPendingRef.current = true;

    setProcessingPayout(true);

    setPayoutError(null);

    // Transfer winnings through the real Bookie API
    void payBookieWinnings(payout)
      .then(async () => {
        console.log(
          `✅ Bookie confirmed payout of ${payout} credits!`
        );

        // Fetch the real balance after the payout
        try {
          const actualBalance = await refreshBalance();

          console.log(
            `💰 Updated Bookie balance: ${actualBalance}`
          );
        } catch (error) {
          console.error(
            "❌ Payout succeeded, but balance refresh failed:",
            error
          );

          setBalanceError(
            "Payout succeeded, but your balance could not be refreshed."
          );
        }
      })
      .catch((error) => {
        console.error(
          "❌ Bookie payout failed:",
          error
        );

        setPayoutError(
          "Your horse won, but the Bookie payout failed."
        );
      })
      .finally(() => {
        payoutPendingRef.current = false;

        setProcessingPayout(false);
      });
  };

  // ==========================================
  // PLACE A BET
  // ==========================================

  const handlePlaceBet = async (newBet: Bet) => {
    // Prevent duplicate bets
    if (
      running ||
      placingBetRef.current ||
      betRef.current !== null ||
      finishingOrderRef.current.length > 0 ||
      loadingBalance ||
      balanceError
    ) {
      return;
    }

    // Validate horse
    if (
      !Number.isInteger(newBet.horse) ||
      newBet.horse < 0 ||
      newBet.horse >= HORSE_NAMES.length
    ) {
      alert("Invalid horse selected.");
      return;
    }

    // Validate amount
    if (
      !Number.isSafeInteger(newBet.amount) ||
      newBet.amount < 1 ||
      newBet.amount > balance
    ) {
      alert(
        "Invalid bet amount or insufficient balance."
      );
      return;
    }

    placingBetRef.current = true;

    setPlacingBet(true);

    try {
      console.log(
        `💸 ${username} is betting ${newBet.amount} credits on ${HORSE_NAMES[newBet.horse]}`
      );

      // Transfer stake from player to Horse
      await placeBookieBet(newBet.amount);

      console.log(
        "✅ Bookie confirmed the bet transaction!"
      );

      // Save bet only after Bookie confirms the transfer
      betRef.current = newBet;

      setBet(newBet);

      // Refresh actual balance from Bookie
      try {
        const actualBalance = await refreshBalance();

        console.log(
          `💰 Balance after bet: ${actualBalance}`
        );
      } catch (error) {
        console.error(
          "❌ Bet succeeded, but balance refresh failed:",
          error
        );

        setBalanceError(
          "Bet placed, but your balance could not be refreshed."
        );
      }
    } catch (error) {
      console.error(
        "❌ Bookie bet failed:",
        error
      );

      alert(
        "Failed to place bet. Check your Bookie balance and try again."
      );
    } finally {
      placingBetRef.current = false;

      setPlacingBet(false);
    }
  };

  // ==========================================
  // START RACE
  // ==========================================

  const startRace = () => {
    if (
      running ||
      placingBetRef.current ||
      betRef.current === null ||
      finishingOrderRef.current.length > 0
    ) {
      return;
    }

    setRunning(true);

    console.log("🏇 Race started!");
  };

  // ==========================================
  // RESET RACE
  // ==========================================

  const resetRace = () => {
    // Cannot reset during a race or API transaction
    if (
      running ||
      placingBetRef.current ||
      payoutPendingRef.current
    ) {
      return;
    }

    // Cannot discard a bet before running the race
    if (
      betRef.current &&
      finishingOrderRef.current.length === 0
    ) {
      alert(
        "You've already placed a bet! Start the race before resetting."
      );

      return;
    }

    // Cannot reset a partially finished race
    if (
      finishingOrderRef.current.length > 0 &&
      finishingOrderRef.current.length < HORSE_NAMES.length
    ) {
      return;
    }

    setRunning(false);

    setLaps([0, 0, 0, 0, 0]);

    setFinishingOrder([]);

    finishingOrderRef.current = [];

    // Clear previous bet
    setBet(null);

    betRef.current = null;

    payoutProcessedRef.current = false;

    setPayoutError(null);

    // Reset horses to starting positions
    setRaceId((previous) => previous + 1);

    // Refresh balance for the next race
    void refreshBalance().catch((error) => {
      console.error(
        "Failed to refresh balance after reset:",
        error
      );

      setBalanceError(
        "Unable to refresh your Bookie balance."
      );
    });

    console.log("🔄 Race reset!");
  };

  // ==========================================
  // POSITION HELPERS
  // ==========================================

  const getPosition = (lane: number) => {
    const position = finishingOrder.indexOf(lane);

    if (position === -1) {
      return null;
    }

    return position + 1;
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 1:
        return "🥇 1st";

      case 2:
        return "🥈 2nd";

      case 3:
        return "🥉 3rd";

      case 4:
        return "4th";

      case 5:
        return "5th";

      default:
        return `${position}th`;
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 75px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 3D horse racing scene */}
      <RaceScene
        running={running}
        raceId={raceId}
        onLapComplete={handleLapComplete}
        onFinish={handleFinish}
      />

      {/* ======================================
          RACE INFORMATION PANEL
      ====================================== */}

      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(0,0,0,0.85)",
          color: "white",
          padding: 20,
          borderRadius: 10,
          minWidth: 260,
          zIndex: 10,
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.3)",
        }}
      >
        <h2>🏇 Horse Racing</h2>

        {/* Race status */}
        <p
          style={{
            marginTop: 15,
            color: raceFinished
              ? "#facc15"
              : running
                ? "#4ade80"
                : "#d1d5db",
            fontWeight: "bold",
          }}
        >
          {processingPayout
            ? "💰 Processing Winnings..."
            : placingBet
              ? "💸 Placing Bet..."
              : raceFinished
                ? "🏆 Race Finished"
                : running
                  ? "🟢 Race Running"
                  : bet
                    ? "🎟️ Ready to Race"
                    : "⏳ Waiting for Bets"}
        </p>

        {/* Logged-in player */}
        <p
          style={{
            marginTop: 10,
            color: "#d1d5db",
            fontSize: 13,
          }}
        >
          👤 Player: {username}
        </p>

        {/* Balance loading */}
        {loadingBalance && (
          <p
            style={{
              marginTop: 10,
              color: "#facc15",
              fontSize: 13,
            }}
          >
            ⏳ Loading Bookie balance...
          </p>
        )}

        {/* Balance error */}
        {balanceError && (
          <div style={{ marginTop: 10 }}>
            <p
              style={{
                color: "#fca5a5",
                fontSize: 13,
              }}
            >
              ⚠️ {balanceError}
            </p>

            <button
              onClick={() => {
                void refreshBalance().catch((error) => {
                  console.error(
                    "Balance refresh failed:",
                    error
                  );
                });
              }}
              style={{
                marginTop: 8,
                padding: "6px 12px",
                background: "#374151",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              🔄 Retry Balance
            </button>
          </div>
        )}

        {/* Reset button */}
        <button
          onClick={resetRace}
          disabled={
            running ||
            placingBet ||
            processingPayout
          }
          style={{
            marginTop: 15,
            padding: "10px 20px",
            background:
              running ||
              placingBet ||
              processingPayout
                ? "#555"
                : "#dc2626",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor:
              running ||
              placingBet ||
              processingPayout
                ? "not-allowed"
                : "pointer",
          }}
        >
          Reset Race
        </button>

        {/* Lap counter */}
        <h3 style={{ marginTop: 20 }}>
          Lap Counter
        </h3>

        {HORSE_NAMES.map((name, index) => {
          const position = getPosition(index);

          return (
            <p
              key={index}
              style={{
                marginTop: 8,
                color: HORSE_COLORS[index],
                fontWeight: "bold",
                textShadow:
                  index === 2
                    ? "0 1px 3px #000"
                    : "none",
              }}
            >
              {name}:{" "}
              {position !== null
                ? `${getPositionLabel(position)} 🏁`
                : `Lap ${Math.min(
                    laps[index] + 1,
                    TOTAL_LAPS
                  )} / ${TOTAL_LAPS}`}
            </p>
          );
        })}

        {/* Live finishing order */}
        {finishingOrder.length > 0 && (
          <div style={{ marginTop: 25 }}>
            <h3>🏁 Finishing Order</h3>

            {finishingOrder.map(
              (horseIndex, index) => (
                <p
                  key={horseIndex}
                  style={{
                    marginTop: 10,
                    fontSize:
                      index < 3 ? 18 : 15,
                    fontWeight:
                      index < 3
                        ? "bold"
                        : "normal",
                  }}
                >
                  {getPositionLabel(index + 1)} —{" "}
                  {HORSE_NAMES[horseIndex]}
                </p>
              )
            )}
          </div>
        )}
      </div>

      {/* ======================================
          BETTING TABLET
      ====================================== */}

      <BettingTablet
        balance={balance}
        running={
          running ||
          placingBet ||
          processingPayout ||
          loadingBalance ||
          Boolean(balanceError)
        }
        raceFinished={raceFinished}
        finishingOrder={finishingOrder}
        bet={bet}
        onPlaceBet={handlePlaceBet}
        onStartRace={startRace}
        onResetRace={resetRace}
      />

      {/* ======================================
          FINAL PODIUM
      ====================================== */}

      {raceFinished && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform:
              "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.92)",
            color: "white",
            padding: "35px 50px",
            borderRadius: 15,
            textAlign: "center",
            zIndex: 20,
            minWidth: 350,
            maxWidth:
              "calc(100% - 40px)",
            boxShadow:
              "0 15px 50px rgba(0,0,0,0.5)",
          }}
        >
          <h1>🏆 Race Results</h1>

          <h2
            style={{
              color: "#facc15",
              marginTop: 25,
            }}
          >
            🥇 1st —{" "}
            {HORSE_NAMES[finishingOrder[0]]}
          </h2>

          <h2
            style={{
              color: "#d1d5db",
              marginTop: 15,
            }}
          >
            🥈 2nd —{" "}
            {HORSE_NAMES[finishingOrder[1]]}
          </h2>

          <h2
            style={{
              color: "#cd7f32",
              marginTop: 15,
            }}
          >
            🥉 3rd —{" "}
            {HORSE_NAMES[finishingOrder[2]]}
          </h2>

          <hr
            style={{
              margin: "25px 0",
              opacity: 0.3,
            }}
          />

          <p>
            4th —{" "}
            {HORSE_NAMES[finishingOrder[3]]}
          </p>

          <p style={{ marginTop: 10 }}>
            5th —{" "}
            {HORSE_NAMES[finishingOrder[4]]}
          </p>

          {/* Betting result */}
          {bet && (
            <div
              style={{
                marginTop: 25,
                padding: 15,
                background:
                  finishingOrder[0] === bet.horse
                    ? "#14532d"
                    : "#7f1d1d",
                borderRadius: 10,
              }}
            >
              {finishingOrder[0] === bet.horse ? (
                <>
                  <h2>💰 YOU WON!</h2>

                  <p style={{ marginTop: 10 }}>
                    Profit: +
                    {bet.amount * bet.odds} Credits
                  </p>

                  {processingPayout && (
                    <p style={{ marginTop: 10 }}>
                      ⏳ Sending winnings to your
                      Bookie account...
                    </p>
                  )}

                  {payoutError && (
                    <p
                      style={{
                        marginTop: 10,
                        color: "#fca5a5",
                      }}
                    >
                      ❌ {payoutError}
                    </p>
                  )}

                  {!processingPayout &&
                    !payoutError && (
                      <p
                        style={{
                          marginTop: 10,
                          color: "#4ade80",
                        }}
                      >
                        ✅ Winnings processed!
                      </p>
                    )}
                </>
              ) : (
                <>
                  <h2>💀 YOU LOST!</h2>

                  <p style={{ marginTop: 10 }}>
                    Lost: {bet.amount} Credits
                  </p>
                </>
              )}
            </div>
          )}

          <p
            style={{
              marginTop: 15,
              color: "#4ade80",
              fontWeight: "bold",
            }}
          >
            Balance:{" "}
            {balance.toLocaleString()} Credits
          </p>

          <button
            onClick={resetRace}
            disabled={processingPayout}
            style={{
              marginTop: 25,
              padding: "12px 25px",
              background: processingPayout
                ? "#555"
                : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              cursor: processingPayout
                ? "not-allowed"
                : "pointer",
            }}
          >
            {processingPayout
              ? "💰 Processing..."
              : "🏇 Race Again"}
          </button>
        </div>
      )}

      {/* ======================================
          CONTROLS
      ====================================== */}

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: 15,
          borderRadius: 8,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <strong>Controls</strong>

        <p>WASD — Move</p>
        <p>Mouse — Look around</p>
        <p>Shift — Sprint</p>
        <p>Tab — Release mouse</p>
      </div>
    </div>
  );
}