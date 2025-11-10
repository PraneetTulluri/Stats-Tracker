import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

// 1. <<< CORRECTION: Import the sound file using the relative path to src/assets
import clickSound from './../assets/effect.mp3'; 

// Note: './../assets/effect.mp3' assumes Dashboard.tsx is in src/pages 
// and the assets folder is in src. Adjust the path if needed!

export default function Dashboard() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  // --------------------------------------------------------
  // Reusable sound player
  const playSound = (soundUrl: string) => {
    // 1. Create a new Audio object using the direct URL
    const audio = new Audio(soundUrl); 
    
    // 2. Play the sound
    audio.play().catch(error => {
      // Catch errors (e.g., if the browser blocks autoplay)
      console.log("Audio playback failed:", error);
    });
  };

  // Unified navigation handler
  const handleNavigation = (path: string, soundUrl: string) => (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default Link navigation immediately
    playSound(soundUrl); // Play the sound
    
    // Use a slight delay before navigating to let the sound start
    setTimeout(() => {
      navigate(path); 
    }, 100); 
  };
  // --------------------------------------------------------

  const handleSignOut = async () => {
    playSound(clickSound); // Use the imported path variable
    await auth.signOut();
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1a472a 0%, #0d2818 50%, #1a472a 100%)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Baseball Field Lines Background (omitted for brevity) */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 100px, rgba(255,255,255,0.03) 101px),
          repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 100px, rgba(255,255,255,0.03) 101px)
        `,
        opacity: 0.3
      }} />

      {/* Stadium Lights Effect (omitted for brevity) */}
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "10%",
        width: "200px",
        height: "200px",
        background: "radial-gradient(circle, rgba(255,244,156,0.2) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(60px)"
      }} />
      <div style={{
        position: "absolute",
        top: "-50%",
        right: "10%",
        width: "200px",
        height: "200px",
        background: "radial-gradient(circle, rgba(255,244,156,0.2) 0%, transparent 70%)",
        borderRadius: "50%",
        filter: "blur(60px)"
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        padding: "3rem 2rem",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Scoreboard Header (omitted for brevity) */}
        <div style={{
          background: "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)",
          borderRadius: "15px",
          padding: "2rem",
          marginBottom: "3rem",
          border: "4px solid #c41e3a",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.1)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* LED Lights Effect (omitted for brevity) */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #c41e3a 0%, #ffd700 50%, #c41e3a 100%)",
            animation: "pulse 2s infinite"
          }} />
          
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <h1 style={{
                color: "#ffd700",
                fontSize: "2.5rem",
                fontWeight: "900",
                margin: 0,
                textShadow: "0 0 20px rgba(255,215,0,0.5), 3px 3px 6px rgba(0,0,0,0.8)",
                letterSpacing: "2px",
                fontFamily: "'Arial Black', sans-serif"
              }}>
                ⚾ WELCOME TO THE BALLPARK
              </h1>
              <p style={{
                color: "#fff",
                fontSize: "1.2rem",
                margin: "0.5rem 0 0 0",
                textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
              }}>
                Coach <span style={{ color: "#ffd700", fontWeight: "bold" }}>
                  {user?.email ? user.email.split('@')[0].toUpperCase() : "MANAGER"}
                </span>
              </p>
            </div>
            
            {/* Baseball Scoreboard Style Stats (omitted for brevity) */}
            <div style={{
              display: "flex",
              gap: "1rem",
              background: "rgba(0,0,0,0.5)",
              padding: "1rem",
              borderRadius: "10px",
              border: "2px solid #ffd700"
            }}>
              <div style={{
                textAlign: "center",
                padding: "0.5rem 1rem",
                borderRight: "2px solid rgba(255,215,0,0.3)"
              }}>
                <div style={{ color: "#ffd700", fontSize: "0.8rem", fontWeight: "bold" }}>INNING</div>
                <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "bold" }}>9th</div>
              </div>
              <div style={{
                textAlign: "center",
                padding: "0.5rem 1rem"
              }}>
                <div style={{ color: "#ffd700", fontSize: "0.8rem", fontWeight: "bold" }}>STATUS</div>
                <div style={{ color: "#4ade80", fontSize: "1.5rem", fontWeight: "bold" }}>LIVE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2rem",
          marginBottom: "3rem",
          position: "relative"
        }}>
          
          {/* Players - Row 1, Column 1 */}
          <Link 
            to="/players" 
            onClick={handleNavigation('/players', clickSound)} 
            style={{
              background: "linear-gradient(135deg, #003087 0%, #0051ba 100%)",
              padding: "2.5rem",
              borderRadius: "20px",
              textDecoration: "none",
              color: "white",
              textAlign: "center",
              border: "5px solid #ffd700",
              boxShadow: "0 10px 30px rgba(0,48,135,0.5), inset 0 2px 10px rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />
            <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>👥</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
              ROSTER
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.3rem" }}>Manage Players</div>
          </Link>

          {/* Add Stats - Row 1, Column 2 */}
          <Link 
            to="/add-stats" 
            onClick={handleNavigation('/add-stats', clickSound)}
            style={{
              background: "linear-gradient(135deg, #0d7c2d 0%, #10b141 100%)",
              padding: "2.5rem",
              borderRadius: "20px",
              textDecoration: "none",
              color: "white",
              textAlign: "center",
              border: "5px solid #ffd700",
              boxShadow: "0 10px 30px rgba(13,124,45,0.5), inset 0 2px 10px rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />
            <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>📝</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
              SCORE
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.3rem" }}>Log Game Stats</div>
          </Link>

          {/* View Stats - Row 1, Column 3 */}
          <Link 
            to="/view-stats" 
            onClick={handleNavigation('/view-stats', clickSound)}
            style={{
              background: "linear-gradient(135deg, #d35400 0%, #e67e22 100%)",
              padding: "2.5rem",
              borderRadius: "20px",
              textDecoration: "none",
              color: "white",
              textAlign: "center",
              border: "5px solid #ffd700",
              boxShadow: "0 10px 30px rgba(211,84,0,0.5), inset 0 2px 10px rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />
            <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>📊</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
              STATS
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.3rem" }}>Player Metrics</div>
          </Link>

          {/* Graphs - Row 2, Column 1 */}
          <Link 
            to="/graphs" 
            onClick={handleNavigation('/graphs', clickSound)}
            style={{
              background: "linear-gradient(135deg, #a21e1e 0%, #c41e3a 100%)",
              padding: "2.5rem",
              borderRadius: "20px",
              textDecoration: "none",
              color: "white",
              textAlign: "center",
              border: "5px solid #ffd700",
              boxShadow: "0 10px 30px rgba(196,30,58,0.5), inset 0 2px 10px rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />
            <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>📈</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
              ANALYTICS
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.3rem" }}>Visual Trends</div>
          </Link>

          {/* Export - Row 2, Column 2 */}
          <Link 
            to="/export" 
            onClick={handleNavigation('/export', clickSound)}
            style={{
              background: "linear-gradient(135deg, #34495e 0%, #4a6278 100%)",
              padding: "2.5rem",
              borderRadius: "20px",
              textDecoration: "none",
              color: "white",
              textAlign: "center",
              border: "5px solid #ffd700",
              boxShadow: "0 10px 30px rgba(52,73,94,0.5), inset 0 2px 10px rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />
            <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>📥</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
              EXPORT
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.3rem" }}>Download Data</div>
          </Link>

          {/* Settings - Row 2, Column 3 */}
          <Link 
            to="/settings" 
            onClick={handleNavigation('/settings', clickSound)}
            style={{
              background: "linear-gradient(135deg, #6c3483 0%, #8e44ad 100%)",
              padding: "2.5rem",
              borderRadius: "20px",
              textDecoration: "none",
              color: "white",
              textAlign: "center",
              border: "5px solid #ffd700",
              boxShadow: "0 10px 30px rgba(108,52,131,0.5), inset 0 2px 10px rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              pointerEvents: "none"
            }} />
            <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>⚙️</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
              SETTINGS
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "0.3rem" }}>Manage Data</div>
          </Link>
        </div>

        {/* Dugout Sign Out Button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleSignOut}
            style={{
              background: "linear-gradient(135deg, #7f0000 0%, #c41e3a 100%)",
              color: "#ffd700",
              padding: "1.2rem 3rem",
              border: "4px solid #ffd700",
              borderRadius: "50px",
              fontSize: "1.3rem",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(196,30,58,0.5), inset 0 2px 10px rgba(255,255,255,0.2)",
              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
              transition: "all 0.3s ease",
              letterSpacing: "2px",
              textTransform: "uppercase"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(196,30,58,0.7)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(196,30,58,0.5)";
            }}
          >
            🚪 EXIT DUGOUT
          </button>
        </div>

        {/* Stadium Info Footer (omitted for brevity) */}
        <div style={{
          marginTop: "3rem",
          padding: "1.5rem",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "15px",
          border: "2px solid rgba(255,215,0,0.3)",
          textAlign: "center"
        }}>
          <p style={{
            color: "#ffd700",
            fontSize: "0.9rem",
            margin: 0,
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
          }}>
            🏟️ STATS TRACKER STADIUM • SEASON 2025 • YOUR COMMAND CENTER FOR BASEBALL EXCELLENCE
          </p>
        </div>
      </div>

      {/* CSS Animation (omitted for brevity) */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        a:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 40px rgba(255,215,0,0.4), inset 0 2px 10px rgba(255,255,255,0.3) !important;
        }
      `}</style>
    </div>
  );
}