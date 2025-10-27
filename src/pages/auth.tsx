import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f4c75 0%, #3282b8 50%, #bbe1fa 100%)",
        padding: "2rem",
        width: "100vw",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          minHeight: "60vh",
          background: "white",
          borderRadius: "25px",
          padding: "3rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "4px solid #FFD700",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "100px",
              height: "80px",
              background: "linear-gradient(45deg, #e74c3c, #c0392b)",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              boxShadow: "0 8px 20px rgba(231,76,60,0.4)",
            }}
          >
            ⚾
          </div>
          <h1
            style={{
              color: "#2c3e50",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              margin: "0 0 0.5rem 0",
              fontWeight: "bold",
            }}
          >
            STATS TRACKER
          </h1>
          <h2
            style={{
              color: "#7f8c8d",
              fontSize: "clamp(1rem, 2vw, 1.3rem)",
              margin: 0,
              fontWeight: 600,
            }}
          >
            {isRegister ? "Create Your Account" : "Welcome Back"}
          </h2>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fee",
              border: "2px solid #e74c3c",
              color: "#c0392b",
              padding: "1rem",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} onSubmit={handleSubmit}>
          <div>
            <label
              style={{
                display: "block",
                color: "#34495e",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "1rem",
                border: "3px solid #3498db",
                borderRadius: "12px",
                fontSize: "1rem",
                outline: "none",
                backgroundColor: "#f8f9fa",
                color: "#2c3e50",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "#34495e",
                fontWeight: "bold",
                marginBottom: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "1rem",
                border: "3px solid #3498db",
                borderRadius: "12px",
                fontSize: "1rem",
                outline: "none",
                backgroundColor: "#f8f9fa",
                color: "#2c3e50",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "1.2rem",
              background: "linear-gradient(45deg, #e74c3c, #c0392b)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              fontWeight: "bold",
              cursor: "pointer",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              boxShadow: "0 6px 15px rgba(231,76,60,0.4)",
              transition: "all 0.3s ease",
            }}
          >
            {isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            color: "#34495e",
            fontSize: "0.95rem",
            fontWeight: 500,
          }}
        >
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: "#e74c3c", fontWeight: "bold", marginLeft: "0.5rem", cursor: "pointer" }}
          >
            {isRegister ? "Sign in" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}
