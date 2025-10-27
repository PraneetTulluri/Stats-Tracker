import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import database, { auth } from '../firebase';

export default function ViewStats() {
  const [user] = useAuthState(auth);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [playerData, setPlayerData] = useState<any | null>(null);
  const [, setPlayerGames] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const userPlayersRef = ref(database, `users/${user.uid}/players`);
    const unsubscribe = onValue(userPlayersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPlayers(arr);
      } else {
        setPlayers([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedPlayer) {
      setPlayerData(null);
      setPlayerGames([]);
      return;
    }

    const playerRef = ref(database, `users/${user.uid}/players/${selectedPlayer}`);
    const playerUnsubscribe = onValue(playerRef, (snapshot) => {
      const data = snapshot.val();
      setPlayerData(data);
    });

    const gamesRef = ref(database, `users/${user.uid}/games`);
    const gamesUnsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allGames = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        const playerGames = allGames.filter(game => game.playerId === selectedPlayer);
        setPlayerGames(playerGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        setPlayerGames([]);
      }
    });

    return () => {
      playerUnsubscribe();
      gamesUnsubscribe();
    };
  }, [user, selectedPlayer]);

  const calculateAdvancedStats = () => {
    if (!playerData || !playerData.atBats || playerData.atBats === 0) {
      return {
        battingAverage: '0.000',
        onBasePercentage: '0.000',
        sluggingPercentage: '0.000',
        ops: '0.000',
        totalBases: 0
      };
    }

    const stats = playerData;
    const totalBases = (stats.singles || 0) + (stats.doubles || 0) * 2 + (stats.triples || 0) * 3 + (stats.homeRuns || 0) * 4;
    const battingAverage = stats.hits / stats.atBats;
    const obpDenom = stats.atBats + (stats.walks || 0) + (stats.hitByPitch || 0) + (stats.sacrificeFlies || 0);
    const onBasePercentage = obpDenom > 0 ? (stats.hits + (stats.walks || 0) + (stats.hitByPitch || 0)) / obpDenom : 0;
    const sluggingPercentage = totalBases / stats.atBats;
    const ops = onBasePercentage + sluggingPercentage;

    return {
      battingAverage: battingAverage.toFixed(3),
      onBasePercentage: onBasePercentage.toFixed(3),
      sluggingPercentage: sluggingPercentage.toFixed(3),
      ops: ops.toFixed(3),
      totalBases
    };
  };

  const advancedStats = calculateAdvancedStats();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f4c75 0%, #3282b8 50%, #bbe1fa 100%)',
      padding: '1.5rem 0'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '1.5rem 0',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: 'clamp(2rem, 5vw, 2.5rem)',
          textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
          margin: '0 0 0.5rem 0',
          fontWeight: 'bold'
        }}>
          PLAYER STATISTICS
        </h1>
        <p style={{
          color: '#e8f4fd',
          fontSize: 'clamp(1rem, 2vw, 1.1rem)',
          margin: 0,
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          View detailed performance metrics
        </p>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem'
      }}>
        {/* Player Selector */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          border: '3px solid #FFD700'
        }}>
          <label style={{
            display: 'block',
            color: '#2c3e50',
            fontWeight: 'bold',
            marginBottom: '0.8rem',
            fontSize: '1rem'
          }}>
            Select Player:
          </label>
          <select
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem',
              border: '3px solid #3498db',
              borderRadius: '10px',
              fontSize: '1rem',
              outline: 'none',
              backgroundColor: '#f8f9fa',
              color: '#2c3e50',
              cursor: 'pointer'
            }}
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} - {player.position} (#{player.jerseyNumber})
              </option>
            ))}
          </select>
        </div>

        {playerData && (
          <>
            {/* Player Info */}
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              border: '3px solid #27ae60',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{
                  color: '#2c3e50',
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 'bold'
                }}>
                  {playerData.name}
                </h2>
                <div style={{
                  background: 'linear-gradient(45deg, #27ae60, #2ecc71)',
                  color: 'white',
                  padding: '0.5rem 1.2rem',
                  borderRadius: '10px',
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  fontWeight: 'bold',
                  display: 'inline-block'
                }}>
                  {playerData.position}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                color: 'white',
                padding: '0.6rem 1.5rem',
                borderRadius: '15px',
                fontSize: 'clamp(1.2rem, 2.5vw, 1.3rem)',
                fontWeight: 'bold'
              }}>
                #{playerData.jerseyNumber}
              </div>
            </div>

            {/* Advanced Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {[
                { title: 'AVG', value: advancedStats.battingAverage, label: 'Batting Average', border: '#3498db' },
                { title: 'OBP', value: advancedStats.onBasePercentage, label: 'On-Base %', border: '#3498db' },
                { title: 'SLG', value: advancedStats.sluggingPercentage, label: 'Slugging %', border: '#3498db' },
                { title: 'OPS', value: advancedStats.ops, label: 'On-Base + Slugging', border: '#FFD700', highlight: true }
              ].map(stat => (
                <div key={stat.title} style={{
                  background: stat.highlight ? 'linear-gradient(135deg, #fff9e6, #ffffff)' : 'white',
                  borderRadius: '12px',
                  padding: '1.2rem 0.8rem',
                  textAlign: 'center',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                  border: `3px solid ${stat.border}`
                }}>
                  <h3 style={{
                    color: stat.highlight ? '#f39c12' : '#3498db',
                    fontSize: '0.9rem',
                    margin: '0 0 0.4rem 0',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {stat.title}
                  </h3>
                  <div style={{
                    fontSize: stat.highlight ? 'clamp(1.8rem, 5vw, 2.2rem)' : 'clamp(1.7rem, 5vw, 2rem)',
                    fontWeight: 'bold',
                    color: stat.highlight ? '#e74c3c' : '#2c3e50',
                    marginBottom: '0.2rem'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#7f8c8d',
                    fontWeight: '500'
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Season Totals */}
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '1.5rem',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              border: '3px solid #3498db'
            }}>
              <h3 style={{
                color: '#2c3e50',
                marginBottom: '1.2rem',
                fontSize: 'clamp(1.2rem, 3vw, 1.4rem)',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Season Totals
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '0.8rem'
              }}>
                {[
                  { label: 'GP', value: playerData.gamesPlayed || 0 },
                  { label: 'PA', value: playerData.plateAppearances || 0 },
                  { label: 'AB', value: playerData.atBats || 0 },
                  { label: 'H', value: playerData.hits || 0 },
                  { label: '1B', value: playerData.singles || 0 },
                  { label: '2B', value: playerData.doubles || 0 },
                  { label: '3B', value: playerData.triples || 0 },
                  { label: 'HR', value: playerData.homeRuns || 0 },
                  { label: 'R', value: playerData.runs || 0 },
                  { label: 'RBI', value: playerData.rbis || 0 },
                  { label: 'BB', value: playerData.walks || 0 },
                  { label: 'HBP', value: playerData.hitByPitch || 0 },
                  { label: 'SO', value: playerData.strikeouts || 0 },
                  { label: 'SB', value: playerData.stolenBases || 0 },
                  { label: 'CS', value: playerData.caughtStealing || 0 },
                  { label: 'TB', value: advancedStats.totalBases }
                ].map(stat => (
                  <div key={stat.label} style={{
                    textAlign: 'center',
                    padding: '1rem 0.5rem',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    border: '2px solid #e9ecef'
                  }}>
                    <div style={{
                      fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      marginBottom: '0.2rem'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#7f8c8d',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!selectedPlayer && (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '3px dashed #bdc3c7',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{
              color: '#7f8c8d',
              fontSize: '1.5rem',
              marginBottom: '0.8rem',
              fontWeight: 'bold'
            }}>
              Select a Player Above
            </h3>
            <p style={{ color: '#95a5a6', fontSize: '1.1rem', margin: 0 }}>
              Choose a player to view their statistics and performance metrics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
