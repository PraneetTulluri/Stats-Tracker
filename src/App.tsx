import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import Auth from "./pages/auth";
import ViewStats from "./pages/ViewStats";
import AddStats from "./pages/AddStats";
import Players from "./pages/Players";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Graphs from "./pages/Graphs";
import Export from "./pages/Export";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Show navbar only when logged in */}
        {user && <Navbar />}

        <Routes>
          {!user ? (
            <>
              <Route path="/" element={<Auth />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/view-stats" element={<ViewStats />} />
              <Route path="/add-stats" element={<AddStats />} />
              <Route path="/graphs" element={<Graphs />} />
              <Route path="/export" element={<Export />} />
              <Route path="/players" element={<Players />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}