import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function Dashboard() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/"); // redirect to Auth page
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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          minHeight: "60vh",
          background: "white",
          borderRadius: "15px",
          padding: "2rem",
          boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c3e50", marginBottom: "1rem" }}>
          Welcome {user?.email ? user.email : "Player"} 👋
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#34495e", marginBottom: "2rem" }}>
          Use the quick links below to manage players and view stats.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <Link
            to="/players"
            style={{
              display: "block",
              background: "#3498db",
              color: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.2rem",
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
              transition: "0.2s",
            }}
          >
            ⚾ Players
          </Link>

          <Link
            to="/add-stats"
            style={{
              display: "block",
              background: "#27ae60",
              color: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.2rem",
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
              transition: "0.2s",
            }}
          >
            ➕ Add Stats
          </Link>

          <Link
            to="/view-stats"
            style={{
              display: "block",
              background: "#f39c12",
              color: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.2rem",
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
              transition: "0.2s",
            }}
          >
            📊 View Stats
          </Link>

          <Link
            to="/graphs"
            style={{
              display: "block",
              background: "#e67e22",
              color: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.2rem",
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
              transition: "0.2s",
            }}
          >
            📈 Graphs
          </Link>

          <Link
            to="/export"
            style={{
              display: "block",
              background: "#16a085",
              color: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.2rem",
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
              transition: "0.2s",
            }}
          >
            📥 Export
          </Link>

          <Link
            to="/settings"
            style={{
              display: "block",
              background: "#9b59b6",
              color: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "1.2rem",
              boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
              transition: "0.2s",
            }}
          >
            ⚙️ Settings
          </Link>
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleSignOut}
            style={{
              marginTop: "2rem",
              background: "#e74c3c",
              color: "white",
              padding: "1rem 2rem",
              border: "none",
              borderRadius: "10px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 5px 15px rgba(231,76,60,0.3)",
              transition: "all 0.3s ease",
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}