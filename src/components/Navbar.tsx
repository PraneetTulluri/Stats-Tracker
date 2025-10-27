import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "center", 
      gap: "20px", 
      backgroundColor: "#222", 
      padding: "10px" 
    }}>
      <Link to="/dashboard" style={{ color: "white", textDecoration: "none" }}>Dashboard</Link>
      <Link to="/view-stats" style={{ color: "white", textDecoration: "none" }}>View Stats</Link>
      <Link to="/add-stats" style={{ color: "white", textDecoration: "none" }}>Add Stats</Link>
      <Link to="/graphs" style={{ color: "white", textDecoration: "none" }}>Graphs</Link>
      <Link to="/players" style={{ color: "white", textDecoration: "none" }}>Players</Link>
      <Link to="/settings" style={{ color: "white", textDecoration: "none" }}>Settings</Link>
    </nav>
  );
}