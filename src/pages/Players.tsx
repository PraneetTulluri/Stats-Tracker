import { useState, useEffect } from 'react';
import database, { auth } from '../firebase';
import { ref, push, set, onValue, remove } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function Players() {
  const [user] = useAuthState(auth);
  const [playerName, setPlayerName] = useState('');
  const [position, setPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [players, setPlayers] = useState<any[]>([]);

  const positions = [
    'Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base',
    'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Hitter'
  ];

  useEffect(() => {
    if (!user) return;
    const userPlayersRef = ref(database, `users/${user.uid}/players`);
    const unsubscribe = onValue(userPlayersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPlayers(playersArray);
      } else {
        setPlayers([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!user) return;

    const newPlayerRef = push(ref(database, `users/${user.uid}/players`));
    const playerData = {
      name: playerName,
      position,
      jerseyNumber: parseInt(jerseyNumber),
      dateAdded: new Date().toISOString(),
      userId: user.uid,
      gamesPlayed: 0,
      atBats: 0,
      hits: 0,
      runs: 0,
      rbis: 0,
      homeRuns: 0,
      strikeouts: 0
    };

    await set(newPlayerRef, playerData);
    setPlayerName('');
    setPosition('');
    setJerseyNumber('');
    alert('Player added successfully!');
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!user) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${playerName}?`);
    if (!confirmed) return;

    await remove(ref(database, `users/${user.uid}/players/${playerId}`));
    alert(`${playerName} has been deleted.`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      background: 'linear-gradient(135deg, #0f4c75 0%, #3282b8 50%, #bbe1fa 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '1300px'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '25px',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '3rem',
            textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>MY BASEBALL STATS</h1>
          <p style={{
            color: '#e8f4fd',
            fontSize: '1.2rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>Track Your Personal Performance</p>
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start'
        }}>
          {/* Add Player Form */}
          <div style={{
            width: '340px',
            flexShrink: 0,
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '3px solid #FFD700',
            position: 'sticky',
            top: '2rem'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '70px',
                height: '70px',
                background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 8px 20px rgba(231,76,60,0.4)'
              }}>⚾</div>
              <h3 style={{
                color: '#2c3e50',
                fontSize: '1.6rem',
                margin: 0,
                fontWeight: 'bold'
              }}>ADD NEW PLAYER</h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#34495e', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem', 
                  fontSize: '1rem' 
                }}>
                  Player Name
                </label>
                <input 
                  type="text" 
                  value={playerName} 
                  onChange={e => setPlayerName(e.target.value)} 
                  placeholder="Enter player's full name" 
                  required
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    border: '2px solid #3498db', 
                    borderRadius: '10px', 
                    fontSize: '16px', 
                    outline: 'none', 
                    backgroundColor: '#f8f9fa', 
                    color: '#2c3e50', 
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#34495e', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem', 
                  fontSize: '1rem' 
                }}>
                  Primary Position
                </label>
                <select 
                  value={position} 
                  onChange={e => setPosition(e.target.value)} 
                  required
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    border: '2px solid #3498db', 
                    borderRadius: '10px', 
                    fontSize: '16px', 
                    outline: 'none', 
                    backgroundColor: '#f8f9fa', 
                    color: position ? '#2c3e50' : '#7f8c8d', 
                    cursor: 'pointer', 
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Choose position...</option>
                  {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#34495e', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem', 
                  fontSize: '1rem' 
                }}>
                  Jersey Number
                </label>
                <input 
                  type="number" 
                  value={jerseyNumber} 
                  onChange={e => setJerseyNumber(e.target.value)} 
                  placeholder="00-99" 
                  min="0" 
                  max="99" 
                  required
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    border: '2px solid #3498db', 
                    borderRadius: '10px', 
                    fontSize: '16px', 
                    outline: 'none', 
                    backgroundColor: '#f8f9fa', 
                    color: '#2c3e50', 
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button 
                type="submit" 
                style={{
                  width: '100%',
                  padding: '1.2rem',
                  background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 6px 15px rgba(231,76,60,0.4)',
                  marginTop: '0.5rem'
                }}
              >
                ADD PLAYER
              </button>
            </form>
          </div>

          {/* Players Grid */}
          <div style={{
            flex: 1,
            minWidth: 0
          }}>
            {/* Player count header */}
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(10px)', 
              padding: '1.5rem 2rem', 
              borderRadius: '15px', 
              marginBottom: '2rem', 
              border: '2px solid rgba(255,215,0,0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <h2 style={{ 
                color: 'white', 
                fontSize: '2rem', 
                margin: 0, 
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)', 
                fontWeight: 'bold' 
              }}>
                MY PLAYERS
              </h2>
              <div style={{ 
                background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                color: '#2c3e50', 
                padding: '0.8rem 1.5rem', 
                borderRadius: '20px', 
                fontWeight: 'bold', 
                fontSize: '1.1rem', 
                boxShadow: '0 4px 15px rgba(255,215,0,0.4)'
              }}>
                {players.length} Players
              </div>
            </div>

            {players.length === 0 ? (
              <div style={{ 
                background: 'rgba(255,255,255,0.95)', 
                borderRadius: '20px', 
                padding: '4rem 2rem', 
                textAlign: 'center', 
                border: '3px dashed #bdc3c7', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚾</div>
                <h3 style={{ 
                  color: '#7f8c8d', 
                  fontSize: '1.8rem', 
                  marginBottom: '1rem', 
                  fontWeight: 'bold' 
                }}>
                  No Players Added Yet
                </h3>
                <p style={{ 
                  color: '#95a5a6', 
                  fontSize: '1.2rem'
                }}>
                  Add your first player to start tracking their baseball statistics!
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '1.5rem'
              }}>
                {players.map(player => (
                  <div 
                    key={player.id} 
                    style={{ 
                      background: 'white', 
                      borderRadius: '15px', 
                      padding: '1.5rem', 
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)', 
                      border: '2px solid #3498db',
                      position: 'relative'
                    }}
                  >
                    <button 
                      onClick={() => handleDeletePlayer(player.id, player.name)} 
                      style={{ 
                        position: 'absolute', 
                        top: '15px', 
                        right: '15px', 
                        background: '#e74c3c', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '30px', 
                        height: '30px', 
                        cursor: 'pointer', 
                        fontSize: '16px', 
                        fontWeight: 'bold' 
                      }}
                    >
                      ×
                    </button>
                    <h3 style={{ 
                      margin: '0 0 0.5rem 0', 
                      fontSize: '1.4rem', 
                      fontWeight: 'bold', 
                      color: '#2c3e50'
                    }}>
                      {player.name}
                    </h3>
                    <p style={{ 
                      margin: '0.25rem 0', 
                      fontSize: '1rem', 
                      color: '#34495e' 
                    }}>
                      {player.position}
                    </p>
                    <p style={{ 
                      fontWeight: 'bold', 
                      color: '#e74c3c', 
                      fontSize: '1rem',
                      margin: '0.25rem 0'
                    }}>
                      #{player.jerseyNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}