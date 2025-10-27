import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import database, { auth } from '../firebase';

interface Game {
  id: string;
  playerId: string;
  playerName?: string;
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
  createdAt: string;
  batchId?: string;
}

export default function Settings() {
  const [user] = useAuthState(auth);
  const [, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [lastManualGame, setLastManualGame] = useState<Game | null>(null);
  const [lastCsvBatch, setLastCsvBatch] = useState<Game[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedGame, setEditedGame] = useState<Game | null>(null);

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
        }));
        setPlayers(arr);
      } else {
        setPlayers([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Load all games
  useEffect(() => {
    if (!user) return;
    const gamesRef = ref(database, `users/${user.uid}/games`);
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by createdAt descending
        arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Add player names
        arr.forEach(game => {
          const player = players.find(p => p.id === game.playerId);
          if (player) {
            game.playerName = `${player.name} (#${player.jerseyNumber})`;
          }
        });
        
        setGames(arr);

        // Find last manual entry (no batchId)
        const manualGames = arr.filter(g => !g.batchId);
        if (manualGames.length > 0) {
          setLastManualGame(manualGames[0]);
        }

        // Find last CSV batch
        if (arr.length > 0 && arr[0].batchId) {
          const lastBatch = arr.filter(g => g.batchId === arr[0].batchId);
          setLastCsvBatch(lastBatch);
        }
      } else {
        setGames([]);
        setLastManualGame(null);
        setLastCsvBatch([]);
      }
    });
    return () => unsubscribe();
  }, [user, players]);

  const numOrZero = (val: string | number) => val === '' || val === null || val === undefined ? 0 : Number(val);

  const undoLastManualEntry = async () => {
    if (!user || !lastManualGame) return;

    if (!window.confirm('Are you sure you want to delete the last manually entered game?')) {
      return;
    }

    try {
      // Get the game stats
      const game = lastManualGame;

      // Update player totals (subtract)
      const playerRef = ref(database, `users/${user.uid}/players/${game.playerId}`);
      const playerSnapshot = await new Promise((resolve) => {
        onValue(playerRef, resolve, { onlyOnce: true });
      });
      const currentPlayer = (playerSnapshot as any).val();

      const updatedTotals = {
        gamesPlayed: Math.max(0, (currentPlayer.gamesPlayed || 0) - 1),
        plateAppearances: Math.max(0, (currentPlayer.plateAppearances || 0) - game.plateAppearances),
        atBats: Math.max(0, (currentPlayer.atBats || 0) - game.atBats),
        hits: Math.max(0, (currentPlayer.hits || 0) - game.hits),
        singles: Math.max(0, (currentPlayer.singles || 0) - game.singles),
        doubles: Math.max(0, (currentPlayer.doubles || 0) - game.doubles),
        triples: Math.max(0, (currentPlayer.triples || 0) - game.triples),
        homeRuns: Math.max(0, (currentPlayer.homeRuns || 0) - game.homeRuns),
        runs: Math.max(0, (currentPlayer.runs || 0) - game.runs),
        rbis: Math.max(0, (currentPlayer.rbis || 0) - game.rbis),
        walks: Math.max(0, (currentPlayer.walks || 0) - game.walks),
        hitByPitch: Math.max(0, (currentPlayer.hitByPitch || 0) - game.hitByPitch),
        strikeouts: Math.max(0, (currentPlayer.strikeouts || 0) - game.strikeouts),
        stolenBases: Math.max(0, (currentPlayer.stolenBases || 0) - game.stolenBases),
        caughtStealing: Math.max(0, (currentPlayer.caughtStealing || 0) - game.caughtStealing),
        errors: Math.max(0, (currentPlayer.errors || 0) - game.errors),
        sacrificeFlies: Math.max(0, (currentPlayer.sacrificeFlies || 0) - game.sacrificeFlies),
        sacrificeBunts: Math.max(0, (currentPlayer.sacrificeBunts || 0) - game.sacrificeBunts)
      };

      await update(playerRef, updatedTotals);

      // Delete the game
      const gameRef = ref(database, `users/${user.uid}/games/${game.id}`);
      await remove(gameRef);

      setMessage('✅ Last manual game entry deleted successfully!');
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error undoing manual entry:', error);
      setMessage('❌ Error undoing manual entry. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const undoLastCsvBatch = async () => {
    if (!user || lastCsvBatch.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete the last CSV batch of ${lastCsvBatch.length} games?`)) {
      return;
    }

    try {
      // Group games by player
      const gamesByPlayer = new Map<string, Game[]>();
      lastCsvBatch.forEach(game => {
        if (!gamesByPlayer.has(game.playerId)) {
          gamesByPlayer.set(game.playerId, []);
        }
        gamesByPlayer.get(game.playerId)!.push(game);
      });

      // Update each player's totals
      for (const [playerId, playerGames] of gamesByPlayer.entries()) {
        const playerRef = ref(database, `users/${user.uid}/players/${playerId}`);
        const playerSnapshot = await new Promise((resolve) => {
          onValue(playerRef, resolve, { onlyOnce: true });
        });
        const currentPlayer = (playerSnapshot as any).val();

        // Calculate totals to subtract
        const totalsToSubtract = playerGames.reduce((acc, game) => ({
          gamesPlayed: acc.gamesPlayed + 1,
          plateAppearances: acc.plateAppearances + game.plateAppearances,
          atBats: acc.atBats + game.atBats,
          hits: acc.hits + game.hits,
          singles: acc.singles + game.singles,
          doubles: acc.doubles + game.doubles,
          triples: acc.triples + game.triples,
          homeRuns: acc.homeRuns + game.homeRuns,
          runs: acc.runs + game.runs,
          rbis: acc.rbis + game.rbis,
          walks: acc.walks + game.walks,
          hitByPitch: acc.hitByPitch + game.hitByPitch,
          strikeouts: acc.strikeouts + game.strikeouts,
          stolenBases: acc.stolenBases + game.stolenBases,
          caughtStealing: acc.caughtStealing + game.caughtStealing,
          errors: acc.errors + game.errors,
          sacrificeFlies: acc.sacrificeFlies + game.sacrificeFlies,
          sacrificeBunts: acc.sacrificeBunts + game.sacrificeBunts
        }), {
          gamesPlayed: 0, plateAppearances: 0, atBats: 0, hits: 0, singles: 0,
          doubles: 0, triples: 0, homeRuns: 0, runs: 0, rbis: 0, walks: 0,
          hitByPitch: 0, strikeouts: 0, stolenBases: 0, caughtStealing: 0,
          errors: 0, sacrificeFlies: 0, sacrificeBunts: 0
        });

        const updatedTotals = {
          gamesPlayed: Math.max(0, (currentPlayer.gamesPlayed || 0) - totalsToSubtract.gamesPlayed),
          plateAppearances: Math.max(0, (currentPlayer.plateAppearances || 0) - totalsToSubtract.plateAppearances),
          atBats: Math.max(0, (currentPlayer.atBats || 0) - totalsToSubtract.atBats),
          hits: Math.max(0, (currentPlayer.hits || 0) - totalsToSubtract.hits),
          singles: Math.max(0, (currentPlayer.singles || 0) - totalsToSubtract.singles),
          doubles: Math.max(0, (currentPlayer.doubles || 0) - totalsToSubtract.doubles),
          triples: Math.max(0, (currentPlayer.triples || 0) - totalsToSubtract.triples),
          homeRuns: Math.max(0, (currentPlayer.homeRuns || 0) - totalsToSubtract.homeRuns),
          runs: Math.max(0, (currentPlayer.runs || 0) - totalsToSubtract.runs),
          rbis: Math.max(0, (currentPlayer.rbis || 0) - totalsToSubtract.rbis),
          walks: Math.max(0, (currentPlayer.walks || 0) - totalsToSubtract.walks),
          hitByPitch: Math.max(0, (currentPlayer.hitByPitch || 0) - totalsToSubtract.hitByPitch),
          strikeouts: Math.max(0, (currentPlayer.strikeouts || 0) - totalsToSubtract.strikeouts),
          stolenBases: Math.max(0, (currentPlayer.stolenBases || 0) - totalsToSubtract.stolenBases),
          caughtStealing: Math.max(0, (currentPlayer.caughtStealing || 0) - totalsToSubtract.caughtStealing),
          errors: Math.max(0, (currentPlayer.errors || 0) - totalsToSubtract.errors),
          sacrificeFlies: Math.max(0, (currentPlayer.sacrificeFlies || 0) - totalsToSubtract.sacrificeFlies),
          sacrificeBunts: Math.max(0, (currentPlayer.sacrificeBunts || 0) - totalsToSubtract.sacrificeBunts)
        };

        await update(playerRef, updatedTotals);
      }

      // Delete all games in the batch
      for (const game of lastCsvBatch) {
        const gameRef = ref(database, `users/${user.uid}/games/${game.id}`);
        await remove(gameRef);
      }

      setMessage(`✅ Successfully deleted ${lastCsvBatch.length} games from last CSV batch!`);
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error undoing CSV batch:', error);
      setMessage('❌ Error undoing CSV batch. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const startEditMode = () => {
    if (lastManualGame) {
      setEditedGame({ ...lastManualGame });
      setEditMode(true);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedGame(null);
  };

  const saveEdit = async () => {
    if (!user || !editedGame || !lastManualGame) return;

    try {
      // Calculate the difference in stats
      const statDiff = {
        plateAppearances: editedGame.plateAppearances - lastManualGame.plateAppearances,
        atBats: editedGame.atBats - lastManualGame.atBats,
        hits: editedGame.hits - lastManualGame.hits,
        singles: editedGame.singles - lastManualGame.singles,
        doubles: editedGame.doubles - lastManualGame.doubles,
        triples: editedGame.triples - lastManualGame.triples,
        homeRuns: editedGame.homeRuns - lastManualGame.homeRuns,
        runs: editedGame.runs - lastManualGame.runs,
        rbis: editedGame.rbis - lastManualGame.rbis,
        walks: editedGame.walks - lastManualGame.walks,
        hitByPitch: editedGame.hitByPitch - lastManualGame.hitByPitch,
        strikeouts: editedGame.strikeouts - lastManualGame.strikeouts,
        stolenBases: editedGame.stolenBases - lastManualGame.stolenBases,
        caughtStealing: editedGame.caughtStealing - lastManualGame.caughtStealing,
        errors: editedGame.errors - lastManualGame.errors,
        sacrificeFlies: editedGame.sacrificeFlies - lastManualGame.sacrificeFlies,
        sacrificeBunts: editedGame.sacrificeBunts - lastManualGame.sacrificeBunts
      };

      // Update the game in Firebase
      const gameRef = ref(database, `users/${user.uid}/games/${editedGame.id}`);
      await update(gameRef, {
        date: editedGame.date,
        opponent: editedGame.opponent,
        plateAppearances: editedGame.plateAppearances,
        atBats: editedGame.atBats,
        hits: editedGame.hits,
        singles: editedGame.singles,
        doubles: editedGame.doubles,
        triples: editedGame.triples,
        homeRuns: editedGame.homeRuns,
        runs: editedGame.runs,
        rbis: editedGame.rbis,
        walks: editedGame.walks,
        hitByPitch: editedGame.hitByPitch,
        strikeouts: editedGame.strikeouts,
        stolenBases: editedGame.stolenBases,
        caughtStealing: editedGame.caughtStealing,
        errors: editedGame.errors,
        sacrificeFlies: editedGame.sacrificeFlies,
        sacrificeBunts: editedGame.sacrificeBunts
      });

      // Update player totals with the difference
      const playerRef = ref(database, `users/${user.uid}/players/${editedGame.playerId}`);
      const playerSnapshot = await new Promise((resolve) => {
        onValue(playerRef, resolve, { onlyOnce: true });
      });
      const currentPlayer = (playerSnapshot as any).val();

      const updatedTotals = {
        plateAppearances: (currentPlayer.plateAppearances || 0) + statDiff.plateAppearances,
        atBats: (currentPlayer.atBats || 0) + statDiff.atBats,
        hits: (currentPlayer.hits || 0) + statDiff.hits,
        singles: (currentPlayer.singles || 0) + statDiff.singles,
        doubles: (currentPlayer.doubles || 0) + statDiff.doubles,
        triples: (currentPlayer.triples || 0) + statDiff.triples,
        homeRuns: (currentPlayer.homeRuns || 0) + statDiff.homeRuns,
        runs: (currentPlayer.runs || 0) + statDiff.runs,
        rbis: (currentPlayer.rbis || 0) + statDiff.rbis,
        walks: (currentPlayer.walks || 0) + statDiff.walks,
        hitByPitch: (currentPlayer.hitByPitch || 0) + statDiff.hitByPitch,
        strikeouts: (currentPlayer.strikeouts || 0) + statDiff.strikeouts,
        stolenBases: (currentPlayer.stolenBases || 0) + statDiff.stolenBases,
        caughtStealing: (currentPlayer.caughtStealing || 0) + statDiff.caughtStealing,
        errors: (currentPlayer.errors || 0) + statDiff.errors,
        sacrificeFlies: (currentPlayer.sacrificeFlies || 0) + statDiff.sacrificeFlies,
        sacrificeBunts: (currentPlayer.sacrificeBunts || 0) + statDiff.sacrificeBunts
      };

      await update(playerRef, updatedTotals);

      setMessage('✅ Game updated successfully!');
      setEditMode(false);
      setEditedGame(null);
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Error updating game:', error);
      setMessage('❌ Error updating game. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    if (editedGame) {
      setEditedGame({ ...editedGame, [field]: value });
    }
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
          SETTINGS
        </h1>
        <p style={{
          color: '#e8f4fd',
          fontSize: '1.3rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Manage your recent entries
        </p>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {message && (
          <div style={{
            background: message.includes('❌') ? '#e74c3c' : '#27ae60',
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

        {/* Last Manual Entry Section */}
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '4px solid #FFD700'
        }}>
          <h2 style={{
            color: '#2c3e50',
            fontSize: '1.8rem',
            marginBottom: '1.5rem',
            fontWeight: 'bold'
          }}>
            Last Manual Entry
          </h2>

          {lastManualGame ? (
            editMode && editedGame ? (
              <div>
                <div style={{
                  padding: '1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '15px',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontWeight: 'bold' }}>
                    Edit Game Details
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <label style={labelStyle}>Player</label>
                      <input
                        type="text"
                        value={editedGame.playerName || ''}
                        disabled
                        style={{ ...inputStyle, background: '#e9ecef', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Date</label>
                      <input
                        type="date"
                        value={editedGame.date}
                        onChange={(e) => handleEditChange('date', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Opponent</label>
                      <input
                        type="text"
                        value={editedGame.opponent}
                        onChange={(e) => handleEditChange('opponent', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <h4 style={{ color: '#2c3e50', marginTop: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                    Statistics
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '1rem'
                  }}>
                    {[
                      { field: 'plateAppearances', label: 'PA' },
                      { field: 'atBats', label: 'AB' },
                      { field: 'hits', label: 'H' },
                      { field: 'singles', label: '1B' },
                      { field: 'doubles', label: '2B' },
                      { field: 'triples', label: '3B' },
                      { field: 'homeRuns', label: 'HR' },
                      { field: 'runs', label: 'R' },
                      { field: 'rbis', label: 'RBI' },
                      { field: 'walks', label: 'BB' },
                      { field: 'hitByPitch', label: 'HBP' },
                      { field: 'strikeouts', label: 'SO' },
                      { field: 'stolenBases', label: 'SB' },
                      { field: 'caughtStealing', label: 'CS' },
                      { field: 'errors', label: 'E' },
                      { field: 'sacrificeFlies', label: 'SF' },
                      { field: 'sacrificeBunts', label: 'SH' }
                    ].map(stat => (
                      <div key={stat.field}>
                        <label style={labelStyle}>{stat.label}</label>
                        <input
                          type="number"
                          value={(editedGame as any)[stat.field]}
                          onChange={(e) => handleEditChange(stat.field, numOrZero(e.target.value))}
                          min="0"
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={saveEdit}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'linear-gradient(45deg, #27ae60, #229954)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(39,174,96,0.4)'
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '15px',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#2c3e50' }}>Player:</strong> {lastManualGame.playerName}
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#2c3e50' }}>Date:</strong> {lastManualGame.date}
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#2c3e50' }}>Opponent:</strong> {lastManualGame.opponent}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#34495e'
                  }}>
                    <div>PA: {lastManualGame.plateAppearances}</div>
                    <div>AB: {lastManualGame.atBats}</div>
                    <div>H: {lastManualGame.hits}</div>
                    <div>1B: {lastManualGame.singles}</div>
                    <div>2B: {lastManualGame.doubles}</div>
                    <div>3B: {lastManualGame.triples}</div>
                    <div>HR: {lastManualGame.homeRuns}</div>
                    <div>R: {lastManualGame.runs}</div>
                    <div>RBI: {lastManualGame.rbis}</div>
                    <div>BB: {lastManualGame.walks}</div>
                    <div>HBP: {lastManualGame.hitByPitch}</div>
                    <div>SO: {lastManualGame.strikeouts}</div>
                    <div>SB: {lastManualGame.stolenBases}</div>
                    <div>CS: {lastManualGame.caughtStealing}</div>
                    <div>E: {lastManualGame.errors}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={startEditMode}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'linear-gradient(45deg, #3498db, #2980b9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(52,152,219,0.4)'
                    }}
                  >
                    Edit Game
                  </button>
                  <button
                    onClick={undoLastManualEntry}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(231,76,60,0.4)'
                    }}
                  >
                    Delete Game
                  </button>
                </div>
              </div>
            )
          ) : (
            <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
              No manual entries found.
            </p>
          )}
        </div>

        {/* Last CSV Batch Section */}
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '4px solid #FFD700'
        }}>
          <h2 style={{
            color: '#2c3e50',
            fontSize: '1.8rem',
            marginBottom: '1.5rem',
            fontWeight: 'bold'
          }}>
            Last CSV Import
          </h2>

          {lastCsvBatch.length > 0 ? (
            <div>
              <div style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '15px',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  color: '#2c3e50',
                  fontSize: '1.1rem',
                  marginBottom: '1rem',
                  fontWeight: 'bold'
                }}>
                  {lastCsvBatch.length} games imported
                </p>
                
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '1rem',
                  background: 'white'
                }}>
                  <table style={{
                    width: '100%',
                    fontSize: '0.9rem',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ background: '#e9ecef' }}>
                        <th style={tableHeaderStyle}>Player</th>
                        <th style={tableHeaderStyle}>Date</th>
                        <th style={tableHeaderStyle}>Opponent</th>
                        <th style={tableHeaderStyle}>Stats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastCsvBatch.map((game, idx) => (
                        <tr key={game.id} style={{
                          borderBottom: '1px solid #e9ecef',
                          background: idx % 2 === 0 ? 'white' : '#f8f9fa'
                        }}>
                          <td style={tableCellStyle}>{game.playerName}</td>
                          <td style={tableCellStyle}>{game.date}</td>
                          <td style={tableCellStyle}>{game.opponent}</td>
                          <td style={tableCellStyle}>
                            {game.atBats} AB, {game.hits} H, {game.homeRuns} HR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={undoLastCsvBatch}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(231,76,60,0.4)'
                }}
              >
                Delete Entire CSV Batch ({lastCsvBatch.length} games)
              </button>
            </div>
          ) : (
            <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
              No recent CSV imports found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#34495e',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  fontSize: '0.85rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem',
  border: '2px solid #3498db',
  borderRadius: '8px',
  fontSize: '0.9rem',
  outline: 'none',
  backgroundColor: 'white',
  color: '#2c3e50',
  boxSizing: 'border-box'
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  fontWeight: 'bold',
  color: '#2c3e50',
  borderBottom: '2px solid #dee2e6'
};

const tableCellStyle: React.CSSProperties = {
  padding: '0.75rem',
  color: '#34495e'
};