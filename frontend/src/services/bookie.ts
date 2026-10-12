const API_URL = "http://10.151.0.85:3000/api/v1";

const SERVICE_TOKEN = import.meta.env.VITE_BOOKIE_SERVICE_TOKEN;

interface BookieUser {
  username: string;
  password: string;
  balance: number;
}

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
  recipient: string,
  amount: number
): Promise<void> {
  const user = getLoggedInUser();

  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error("Invalid transaction amount.");
  }

  const response = await fetch(
    `${API_URL}/transactions/service/${encodeURIComponent(recipient)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: user.username,
        password: user.password,
        serviceToken: SERVICE_TOKEN,
        amount,
      }),
    }
  );

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

// Player → HorseBetting
export async function placeBookieBet(amount: number): Promise<void> {
  await transferCredits("Horse", amount);
}

// HorseBetting → Player
export async function payBookieWinnings(amount: number): Promise<void> {
  const user = getLoggedInUser();
  await transferCredits(user.username, amount);
}


export async function getBookieBalance(): Promise<number> {
  const user = getLoggedInUser();

  let page = 1;

  while (true) {
    const response = await fetch(
      `${API_URL}/users?page=${page}&limit=100`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Bookie balance.");
    }

    const result = await response.json();

    const foundUser = result.data.find(
      (account: { username: string; balance: string | number }) =>
        account.username === user.username
    );

    if (foundUser) {
      return Number(foundUser.balance);
    }

    if (page >= result.totalPages) {
      throw new Error("Bookie account not found.");
    }

    page++;
  }
}