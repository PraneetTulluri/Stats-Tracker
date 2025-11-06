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
      background: 'linear-gradient(135deg, #0f4c75 0%, #3282b8 50%, #bbe1fa 100%)',
      padding: '2rem 0'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        padding: '2rem 0',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '3rem',
          textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
          marginBottom: '1rem',
          fontWeight: 'bold'
        }}>
          EXPORT DATA
        </h1>
        <p style={{
          color: '#e8f4fd',
          fontSize: '1.3rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Download statistics and reports
        </p>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {message && (
          <div style={{
            background: message.includes('⚠️') ? '#f39c12' : '#27ae60',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            {message}
          </div>
        )}

        {/* Player Selection */}
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '4px solid #FFD700'
        }}>
          <h3 style={{
            color: '#2c3e50',
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            Select Player (Optional)
          </h3>
          <p style={{
            color: '#7f8c8d',
            marginBottom: '1.5rem',
            fontSize: '0.95rem'
          }}>
            Choose a player for individual exports, or leave blank for team-wide exports
          </p>
          <select
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem',
              border: '2px solid #3498db',
              borderRadius: '10px',
              fontSize: '1rem',
              cursor: 'pointer',
              backgroundColor: '#f8f9fa'
            }}
          >
            <option value="">No player selected (team exports)</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (#{player.jerseyNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Individual Player Exports */}
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '4px solid #3498db'
        }}>
          <h3 style={{
            color: '#2c3e50',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            📊 Individual Player Exports
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={exportPlayerStats}
              disabled={!selectedPlayer}
              style={{
                padding: '1.5rem',
                background: selectedPlayer ? 'linear-gradient(45deg, #3498db, #2980b9)' : '#bdc3c7',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: selectedPlayer ? 'pointer' : 'not-allowed',
                boxShadow: selectedPlayer ? '0 4px 15px rgba(52,152,219,0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
              Export Player Stats
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
                Season totals & advanced metrics
              </div>
            </button>

            <button
              onClick={exportPlayerGameLog}
              disabled={!selectedPlayer}
              style={{
                padding: '1.5rem',
                background: selectedPlayer ? 'linear-gradient(45deg, #27ae60, #229954)' : '#bdc3c7',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: selectedPlayer ? 'pointer' : 'not-allowed',
                boxShadow: selectedPlayer ? '0 4px 15px rgba(39,174,96,0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              Export Game Log
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
                All games for selected player
              </div>
            </button>
          </div>

          {!selectedPlayer && (
            <p style={{
              color: '#e74c3c',
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              ⚠️ Select a player above to enable individual exports
            </p>
          )}
        </div>

        {/* Team-Wide Exports */}
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '4px solid #e67e22'
        }}>
          <h3 style={{
            color: '#2c3e50',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            👥 Team-Wide Exports
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <button
              onClick={exportAllPlayers}
              disabled={players.length === 0}
              style={{
                padding: '1.5rem',
                background: players.length > 0 ? 'linear-gradient(45deg, #e67e22, #d35400)' : '#bdc3c7',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: players.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: players.length > 0 ? '0 4px 15px rgba(230,126,34,0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              Export All Players
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
                Complete roster with stats
              </div>
            </button>

            <button
              onClick={exportAllGames}
              disabled={games.length === 0}
              style={{
                padding: '1.5rem',
                background: games.length > 0 ? 'linear-gradient(45deg, #9b59b6, #8e44ad)' : '#bdc3c7',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: games.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: games.length > 0 ? '0 4px 15px rgba(155,89,182,0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              Export All Games
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
                Complete game log for all players
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}