import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://10.151.0.85:3000/api/v1";

interface BookieUser {
  username: string;
  balance: number;
}

interface UsersResponse {
  data: BookieUser[];
  totalPages: number;
}

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Verify credentials with Bookie
      const loginResponse = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Invalid username or password.");
      }

      // Step 2: Find the authenticated user's balance
      let page = 1;
      let foundUser: BookieUser | undefined;

      while (true) {
        const response = await fetch(
          `${API_URL}/users?page=${page}&limit=100`
        );

        if (!response.ok) {
          throw new Error("Unable to retrieve your Bookie balance.");
        }

        const result: UsersResponse = await response.json();

        foundUser = result.data.find(
          (user) => user.username === username.trim()
        );

        if (foundUser || page >= result.totalPages) {
          break;
        }

        page++;
      }

      if (!foundUser) {
        throw new Error("Login succeeded, but your balance was not found.");
      }

      // Step 3: Store basic session information
      sessionStorage.setItem(
        "bookieUser",
        JSON.stringify({
          username: foundUser.username,
          password,
          balance: Number(foundUser.balance),
        })
      );

      console.log("🏇 Logged in as:", foundUser.username);
      console.log("💰 Balance:", foundUser.balance);

      // Step 4: Go to the races
      navigate("/races");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 75px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0b1510",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: 400,
          maxWidth: "100%",
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 20,
          padding: 35,
          color: "white",
          boxShadow: "0 15px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 55 }}>🏇</div>

          <h1 style={{ marginTop: 15, fontSize: 26 }}>
            Grand National Disaster
          </h1>

          <p style={{ color: "#9ca3af", marginTop: 10 }}>
            Alces Bookie
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            htmlFor="username"
            style={{
              display: "block",
              marginBottom: 10,
              fontWeight: "bold",
            }}
          >
            Username
          </label>

          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 15,
              background: "#0b1510",
              border: "1px solid #374151",
              borderRadius: 10,
              color: "white",
              fontSize: 16,
              marginBottom: 20,
            }}
          />

          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: 10,
              fontWeight: "bold",
            }}
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 15,
              background: "#0b1510",
              border: "1px solid #374151",
              borderRadius: 10,
              color: "white",
              fontSize: 16,
              marginBottom: 20,
            }}
          />

          {error && (
            <p
              style={{
                color: "#f87171",
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 16,
              background: loading ? "#374151" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 17,
              fontWeight: "bold",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "🔐 Login"}
          </button>
        </form>
      </div>
    </div>
  );
}