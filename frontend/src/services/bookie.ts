const API_URL = "http://10.151.0.85:3000/api/v1";

const SERVICE_TOKEN = import.meta.env.VITE_BOOKIE_SERVICE_TOKEN;

interface BookieUser {
  username: string;
  password: string;
  balance: number;
}

type TransactionType = "win" | "loss" | "hold" | "return";

function getLoggedInUser(): BookieUser {
  const stored = sessionStorage.getItem("bookieUser");

  if (!stored) {
    throw new Error("You must log in first.");
  }

  const user = JSON.parse(stored) as BookieUser;

  if (!user.username || !user.password) {
    throw new Error("Please log out and log in again.");
  }

  return user;
}

async function transferCredits(
  type: TransactionType,
  amount: number
): Promise<void> {
  const user = getLoggedInUser();

  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error("Invalid transaction amount.");
  }

  if (!SERVICE_TOKEN) {
    throw new Error("Bookie service token is missing.");
  }

  const response = await fetch(`${API_URL}/services/transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: user.username,
      password: user.password,
      serviceToken: SERVICE_TOKEN,
      amount,
      type,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("Bookie API response:", {
      status: response.status,
      body: errorBody,
    });

    throw new Error(
      `Bookie transaction failed: ${response.status} - ${errorBody}`
    );
  }
}

// Player places a bet
export async function placeBookieBet(amount: number): Promise<void> {
  await transferCredits("loss", amount);
}

// Player receives winnings
export async function payBookieWinnings(amount: number): Promise<void> {
  await transferCredits("win", amount);
}

// Retrieve current player balance
export async function getBookieBalance(): Promise<number> {
  const user = getLoggedInUser();

  const response = await fetch(
    `${API_URL}/users/${encodeURIComponent(user.username)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Bookie balance: ${response.status}`);
  }

  const result = await response.json();

  const balance = Number(result.data?.balance ?? result.balance);

  if (!Number.isFinite(balance)) {
    throw new Error("Invalid balance returned by Bookie API.");
  }

  return balance;
}