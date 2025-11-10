import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import database, { auth } from '../firebase';

interface Player {
  id: string;
  name: string;
  jerseyNumber: string;
  position: string;
  gamesPlayed: number;
  plateAppearances: number;
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runs: number;
  rbis: number;
  walks: number;
  hitByPitch: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  errors: number;
  sacrificeFlies: number;
  sacrificeBunts: number;
}

interface Game {
  id: string;
  playerId: string;
  date: string;
  opponent: string;
  plateAppearances: number;
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runs: number;
  rbis: number;
  walks: number;
  hitByPitch: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  errors: number;
  sacrificeFlies: number;
  sacrificeBunts: number;
}

export default function Export() {
  const [user] = useAuthState(auth);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Load players
  useEffect(() => {
    if (!user) return;
    const userPlayersRef = ref(database, `users/${user.uid}/players`);
    const unsubscribe = onValue(userPlayersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as Player[];
        setPlayers(arr);
      } else {
        setPlayers([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Load games
  useEffect(() => {
    if (!user) return;
    const gamesRef = ref(database, `users/${user.uid}/games`);
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as Game[];
        setGames(arr);
      } else {
        setGames([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const calculateAdvancedStats = (player: Player) => {
    if (!player.atBats || player.atBats === 0) {
      return { avg: '0.000', obp: '0.000', slg: '0.000', ops: '0.000' };
    }

    const totalBases = (player.singles || 0) + (player.doubles || 0) * 2 + (player.triples || 0) * 3 + (player.homeRuns || 0) * 4;
    const avg = player.hits / player.atBats;
    const obpDenom = player.atBats + (player.walks || 0) + (player.hitByPitch || 0) + (player.sacrificeFlies || 0);
    const obp = obpDenom > 0 ? (player.hits + (player.walks || 0) + (player.hitByPitch || 0)) / obpDenom : 0;
    const slg = totalBases / player.atBats;
    const ops = obp + slg;

    return {
      avg: avg.toFixed(3),
      obp: obp.toFixed(3),
      slg: slg.toFixed(3),
      ops: ops.toFixed(3)
    };
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // Export single player stats
  const exportPlayerStats = () => {
    if (!selectedPlayer) {
      showMessage('⚠️ Please select a player first');
      return;
    }

    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;

    const stats = calculateAdvancedStats(player);
    
    const csv = `Player Statistics Export\n\n` +
      `Name,${player.name}\n` +
      `Jersey Number,${player.jerseyNumber}\n` +
      `Position,${player.position}\n\n` +
      `Season Totals\n` +
      `Games Played,${player.gamesPlayed || 0}\n` +
      `Plate Appearances,${player.plateAppearances || 0}\n` +
      `At Bats,${player.atBats || 0}\n` +
      `Hits,${player.hits || 0}\n` +
      `Singles,${player.singles || 0}\n` +
      `Doubles,${player.doubles || 0}\n` +
      `Triples,${player.triples || 0}\n` +
      `Home Runs,${player.homeRuns || 0}\n` +
      `Runs,${player.runs || 0}\n` +
      `RBIs,${player.rbis || 0}\n` +
      `Walks,${player.walks || 0}\n` +
      `Hit By Pitch,${player.hitByPitch || 0}\n` +
      `Strikeouts,${player.strikeouts || 0}\n` +
      `Stolen Bases,${player.stolenBases || 0}\n` +
      `Caught Stealing,${player.caughtStealing || 0}\n` +
      `Errors,${player.errors || 0}\n\n` +
      `Advanced Metrics\n` +
      `Batting Average,${stats.avg}\n` +
      `On-Base Percentage,${stats.obp}\n` +
      `Slugging Percentage,${stats.slg}\n` +
      `OPS,${stats.ops}\n`;

    downloadFile(csv, `${player.name.replace(/\s+/g, '_')}_Stats.csv`, 'text/csv');
    showMessage(`✅ Exported stats for ${player.name}`);
  };

  // Export all players
  const exportAllPlayers = () => {
    if (players.length === 0) {
      showMessage('⚠️ No players to export');
      return;
    }

    let csv = 'Name,Jersey,Position,GP,PA,AB,H,1B,2B,3B,HR,R,RBI,BB,HBP,SO,SB,CS,E,AVG,OBP,SLG,OPS\n';
    
    players.forEach(player => {
      const stats = calculateAdvancedStats(player);
      csv += `${player.name},${player.jerseyNumber},${player.position},` +
        `${player.gamesPlayed || 0},${player.plateAppearances || 0},${player.atBats || 0},` +
        `${player.hits || 0},${player.singles || 0},${player.doubles || 0},${player.triples || 0},` +
        `${player.homeRuns || 0},${player.runs || 0},${player.rbis || 0},${player.walks || 0},` +
        `${player.hitByPitch || 0},${player.strikeouts || 0},${player.stolenBases || 0},` +
        `${player.caughtStealing || 0},${player.errors || 0},` +
        `${stats.avg},${stats.obp},${stats.slg},${stats.ops}\n`;
    });

    downloadFile(csv, 'All_Players_Stats.csv', 'text/csv');
    showMessage(`✅ Exported ${players.length} players`);
  };

  // Export game log for selected player
  const exportPlayerGameLog = () => {
    if (!selectedPlayer) {
      showMessage('⚠️ Please select a player first');
      return;
    }

    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;

    const playerGames = games
      .filter(g => g.playerId === selectedPlayer)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (playerGames.length === 0) {
      showMessage('⚠️ No games found for this player');
      return;
    }

    let csv = `Game Log - ${player.name}\n\n`;
    csv += 'Date,Opponent,PA,AB,H,1B,2B,3B,HR,R,RBI,BB,HBP,SO,SB,CS,E\n';
    
    playerGames.forEach(game => {
      csv += `${game.date},${game.opponent},${game.plateAppearances},${game.atBats},` +
        `${game.hits},${game.singles},${game.doubles},${game.triples},${game.homeRuns},` +
        `${game.runs},${game.rbis},${game.walks},${game.hitByPitch},${game.strikeouts},` +
        `${game.stolenBases},${game.caughtStealing},${game.errors}\n`;
    });

    downloadFile(csv, `${player.name.replace(/\s+/g, '_')}_Game_Log.csv`, 'text/csv');
    showMessage(`✅ Exported ${playerGames.length} games for ${player.name}`);
  };

  // Export all games
  const exportAllGames = () => {
    if (games.length === 0) {
      showMessage('⚠️ No games to export');
      return;
    }

    let csv = 'Player Name,Jersey,Date,Opponent,PA,AB,H,1B,2B,3B,HR,R,RBI,BB,HBP,SO,SB,CS,E\n';
    
    games
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(game => {
        const player = players.find(p => p.id === game.playerId);
        const playerName = player ? player.name : 'Unknown';
        const jersey = player ? player.jerseyNumber : 'N/A';
        
        csv += `${playerName},${jersey},${game.date},${game.opponent},` +
          `${game.plateAppearances},${game.atBats},${game.hits},${game.singles},` +
          `${game.doubles},${game.triples},${game.homeRuns},${game.runs},${game.rbis},` +
          `${game.walks},${game.hitByPitch},${game.strikeouts},${game.stolenBases},` +
          `${game.caughtStealing},${game.errors}\n`;
      });

    downloadFile(csv, 'All_Games_Log.csv', 'text/csv');
    showMessage(`✅ Exported ${games.length} games`);
  };

  // Helper function to download file
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1a472a 0%, #0d2818 50%, #1a472a 100%)',
      padding: '2rem 0',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Stadium Lights */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255,244,156,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255,244,156,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)'
      }} />

      {/* Header Scoreboard */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        padding: '2rem',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        border: '4px solid #c41e3a',
        borderRadius: '15px',
        maxWidth: '1200px',
        margin: '0 auto 3rem auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #c41e3a 0%, #ffd700 50%, #c41e3a 100%)'
        }} />
        <h1 style={{
          color: '#ffd700',
          fontSize: '3rem',
          textShadow: '0 0 20px rgba(255,215,0,0.5), 3px 3px 6px rgba(0,0,0,0.8)',
          marginBottom: '1rem',
          fontWeight: '900',
          letterSpacing: '2px'
        }}>
          📥 EXPORT CENTER
        </h1>
        <p style={{
          color: '#fff',
          fontSize: '1.3rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          margin: 0
        }}>
          Download Your Stats & Reports
        </p>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {message && (
          <div style={{
            background: message.includes('⚠️') ? 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' : 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
            color: 'white',
            padding: '1.5rem 2rem',
            borderRadius: '15px',
            marginBottom: '2rem',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            border: '3px solid #ffd700',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {message}
          </div>
        )}

        {/* Player Selection */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 15px 50px rgba(0,0,0,0.4)',
          border: '4px solid #ffd700'
        }}>
          <h3 style={{
            color: '#003087',
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            🎯 Select Player (Optional)
          </h3>
          <p style={{
            color: '#34495e',
            marginBottom: '1.5rem',
            fontSize: '1rem'
          }}>
            Choose a player for individual exports, or leave blank for team-wide exports
          </p>
          <select
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              border: '3px solid #003087',
              borderRadius: '12px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#2c3e50',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(0,48,135,0.2)'
            }}
          >
            <option value="">🏟️ No player selected (team exports)</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                ⚾ {player.name} (#{player.jerseyNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Individual Player Exports */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 15px 50px rgba(0,0,0,0.4)',
          border: '4px solid #003087'
        }}>
          <h3 style={{
            color: '#003087',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            📊 Individual Player Exports
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            <button
              onClick={exportPlayerStats}
              disabled={!selectedPlayer}
              style={{
                padding: '2rem',
                background: selectedPlayer ? 'linear-gradient(135deg, #003087 0%, #0051ba 100%)' : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                color: 'white',
                border: selectedPlayer ? '4px solid #ffd700' : '4px solid #bdc3c7',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: selectedPlayer ? 'pointer' : 'not-allowed',
                boxShadow: selectedPlayer ? '0 8px 25px rgba(0,48,135,0.4)' : '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📄</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Export Player Stats</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Season totals & advanced metrics
              </div>
            </button>

            <button
              onClick={exportPlayerGameLog}
              disabled={!selectedPlayer}
              style={{
                padding: '2rem',
                background: selectedPlayer ? 'linear-gradient(135deg, #0d7c2d 0%, #10b141 100%)' : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                color: 'white',
                border: selectedPlayer ? '4px solid #ffd700' : '4px solid #bdc3c7',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: selectedPlayer ? 'pointer' : 'not-allowed',
                boxShadow: selectedPlayer ? '0 8px 25px rgba(13,124,45,0.4)' : '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📅</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Export Game Log</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                All games for selected player
              </div>
            </button>
          </div>

          {!selectedPlayer && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(231,76,60,0.1)',
              border: '2px solid #e74c3c',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#c0392b',
                margin: 0,
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                ⚠️ Select a player above to enable individual exports
              </p>
            </div>
          )}
        </div>

        {/* Team-Wide Exports */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 15px 50px rgba(0,0,0,0.4)',
          border: '4px solid #c41e3a'
        }}>
          <h3 style={{
            color: '#c41e3a',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            👥 Team-Wide Exports
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            <button
              onClick={exportAllPlayers}
              disabled={players.length === 0}
              style={{
                padding: '2rem',
                background: players.length > 0 ? 'linear-gradient(135deg, #d35400 0%, #e67e22 100%)' : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                color: 'white',
                border: players.length > 0 ? '4px solid #ffd700' : '4px solid #bdc3c7',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: players.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: players.length > 0 ? '0 8px 25px rgba(211,84,0,0.4)' : '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>👥</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Export All Players</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Complete roster with stats
              </div>
            </button>

            <button
              onClick={exportAllGames}
              disabled={games.length === 0}
              style={{
                padding: '2rem',
                background: games.length > 0 ? 'linear-gradient(135deg, #6c3483 0%, #8e44ad 100%)' : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                color: 'white',
                border: games.length > 0 ? '4px solid #ffd700' : '4px solid #bdc3c7',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: games.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: games.length > 0 ? '0 8px 25px rgba(108,52,131,0.4)' : '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📋</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Export All Games</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Complete game log for all players
              </div>
            </button>
          </div>
        </div>

        {/* Baseball Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '3rem 0'
        }}>
          <div style={{
            flex: 1,
            height: '3px',
            background: 'repeating-linear-gradient(90deg, #c41e3a 0px, #c41e3a 20px, transparent 20px, transparent 30px)',
            opacity: 0.5
          }} />
          <div style={{
            color: '#ffd700',
            fontSize: '2rem',
            textShadow: '0 0 10px rgba(255,215,0,0.5)'
          }}>⚾</div>
          <div style={{
            flex: 1,
            height: '3px',
            background: 'repeating-linear-gradient(90deg, #c41e3a 0px, #c41e3a 20px, transparent 20px, transparent 30px)',
            opacity: 0.5
          }} />
        </div>
      </div>

      <style>{`
        button:not(:disabled):hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 40px rgba(255,215,0,0.4) !important;
        }
      `}</style>
    </div>
  );
}