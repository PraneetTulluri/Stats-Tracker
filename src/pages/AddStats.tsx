import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, update } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import database, { auth } from '../firebase';
import Papa from 'papaparse';

export default function AddStats() {
  const [user] = useAuthState(auth);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [opponent, setOpponent] = useState('');
  const [numGames, setNumGames] = useState(1);
  const [gameStats, setGameStats] = useState({
    plateAppearances: '',
    atBats: '',
    hits: '',
    singles: '',
    doubles: '',
    triples: '',
    homeRuns: '',
    runs: '',
    rbis: '',
    walks: '',
    hitByPitch: '',
    strikeouts: '',
    stolenBases: '',
    caughtStealing: '',
    errors: '',
    sacrificeFlies: '',
    sacrificeBunts: ''
  });
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [, setCsvFile] = useState<File | null>(null);
  

  const numOrZero = (val: string | number) => val === '' || val === null || val === undefined ? 0 : Number(val);

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

  const handleStatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameStats({ ...gameStats, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlayer) return;

    try {
      const gamesRef = ref(database, `users/${user.uid}/games`);
      const newGameRef = push(gamesRef);

      const gameData = {
        playerId: selectedPlayer,
        date: gameDate,
        opponent: opponent,
        plateAppearances: numOrZero(gameStats.plateAppearances),
        atBats: numOrZero(gameStats.atBats),
        hits: numOrZero(gameStats.hits),
        singles: numOrZero(gameStats.singles),
        doubles: numOrZero(gameStats.doubles),
        triples: numOrZero(gameStats.triples),
        homeRuns: numOrZero(gameStats.homeRuns),
        runs: numOrZero(gameStats.runs),
        rbis: numOrZero(gameStats.rbis),
        walks: numOrZero(gameStats.walks),
        hitByPitch: numOrZero(gameStats.hitByPitch),
        strikeouts: numOrZero(gameStats.strikeouts),
        stolenBases: numOrZero(gameStats.stolenBases),
        caughtStealing: numOrZero(gameStats.caughtStealing),
        errors: numOrZero(gameStats.errors),
        sacrificeFlies: numOrZero(gameStats.sacrificeFlies),
        sacrificeBunts: numOrZero(gameStats.sacrificeBunts),
        createdAt: new Date().toISOString()
      };

      await set(newGameRef, gameData);

      const playerRef = ref(database, `users/${user.uid}/players/${selectedPlayer}`);
      const playerSnapshot = await new Promise((resolve) => {
        onValue(playerRef, resolve, { onlyOnce: true });
      });
      const currentPlayer = (playerSnapshot as any).val();

      const updatedTotals = {
        gamesPlayed: (currentPlayer.gamesPlayed || 0) + numGames,
        plateAppearances: (currentPlayer.plateAppearances || 0) + numOrZero(gameStats.plateAppearances) * numGames,
        atBats: (currentPlayer.atBats || 0) + numOrZero(gameStats.atBats) * numGames,
        hits: (currentPlayer.hits || 0) + numOrZero(gameStats.hits) * numGames,
        singles: (currentPlayer.singles || 0) + numOrZero(gameStats.singles) * numGames,
        doubles: (currentPlayer.doubles || 0) + numOrZero(gameStats.doubles) * numGames,
        triples: (currentPlayer.triples || 0) + numOrZero(gameStats.triples) * numGames,
        homeRuns: (currentPlayer.homeRuns || 0) + numOrZero(gameStats.homeRuns) * numGames,
        runs: (currentPlayer.runs || 0) + numOrZero(gameStats.runs) * numGames,
        rbis: (currentPlayer.rbis || 0) + numOrZero(gameStats.rbis) * numGames,
        walks: (currentPlayer.walks || 0) + numOrZero(gameStats.walks) * numGames,
        hitByPitch: (currentPlayer.hitByPitch || 0) + numOrZero(gameStats.hitByPitch) * numGames,
        strikeouts: (currentPlayer.strikeouts || 0) + numOrZero(gameStats.strikeouts) * numGames,
        stolenBases: (currentPlayer.stolenBases || 0) + numOrZero(gameStats.stolenBases) * numGames,
        caughtStealing: (currentPlayer.caughtStealing || 0) + numOrZero(gameStats.caughtStealing) * numGames,
        errors: (currentPlayer.errors || 0) + numOrZero(gameStats.errors) * numGames,
        sacrificeFlies: (currentPlayer.sacrificeFlies || 0) + numOrZero(gameStats.sacrificeFlies) * numGames,
        sacrificeBunts: (currentPlayer.sacrificeBunts || 0) + numOrZero(gameStats.sacrificeBunts) * numGames
      };

      await update(playerRef, updatedTotals);

      setMessage('Game stats saved successfully!');
      setTimeout(() => setMessage(null), 3000);

      setGameStats({
        plateAppearances: '',
        atBats: '',
        hits: '',
        singles: '',
        doubles: '',
        triples: '',
        homeRuns: '',
        runs: '',
        rbis: '',
        walks: '',
        hitByPitch: '',
        strikeouts: '',
        stolenBases: '',
        caughtStealing: '',
        errors: '',
        sacrificeFlies: '',
        sacrificeBunts: ''
      });
      setOpponent('');
      setNumGames(1);

    } catch (error) {
      console.error('Error saving game:', error);
      setMessage('Error saving game stats. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreview(results.data);
      },
      error: (error) => {
        setMessage('Error parsing CSV: ' + error.message);
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const findPlayerByNameAndJersey = (name: string, jersey: string) => {
    return players.find(p => 
      p.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      p.jerseyNumber === jersey.trim()
    );
  };

 const handleCsvImport = async () => {
    if (!user || csvPreview.length === 0) return;

    // If a player is selected in dropdown, filter CSV to only that player
    const rowsToImport = selectedPlayer 
      ? csvPreview.filter(row => {
          const player = findPlayerByNameAndJersey(
            row['Player Name'] || row['PlayerName'], 
            row['Jersey Number'] || row['JerseyNumber']
          );
          return player && player.id === selectedPlayer;
        })
      : csvPreview;

    if (selectedPlayer && rowsToImport.length === 0) {
      setMessage(`No games found in CSV for selected player`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Track players created in this import session
      const createdPlayersMap = new Map<string, any>();

      // Generate a unique batch ID for this CSV import
      const batchId = `csv_${Date.now()}`;

      for (const row of rowsToImport) {
        // Create unique key for player lookup
        const playerKey = `${(row['Player Name'] || row['PlayerName']).toLowerCase().trim()}-${(row['Jersey Number'] || row['JerseyNumber']).trim()}`;
        
        // Find player in existing roster or already-created players
        let player = findPlayerByNameAndJersey(
          row['Player Name'] || row['PlayerName'], 
          row['Jersey Number'] || row['JerseyNumber']
        );
        
        // If not found in roster, check if we already created them in this import
        if (!player && createdPlayersMap.has(playerKey)) {
          player = createdPlayersMap.get(playerKey);
        }
        
        if (!player) {
          // Create the player automatically in Firebase
          try {
            const newPlayerRef = push(ref(database, `users/${user.uid}/players`));
            const newPlayerData = {
              name: (row['Player Name'] || row['PlayerName'] || 'Unknown').toString(),
              jerseyNumber: (row['Jersey Number'] || row['JerseyNumber'] || '').toString(),
              position: (row['Position'] || row['Pos'] || '').toString(),
              createdAt: new Date().toISOString(),
              // Initialize all stats to 0
              gamesPlayed: 0,
              plateAppearances: 0,
              atBats: 0,
              hits: 0,
              singles: 0,
              doubles: 0,
              triples: 0,
              homeRuns: 0,
              runs: 0,
              rbis: 0,
              walks: 0,
              hitByPitch: 0,
              strikeouts: 0,
              stolenBases: 0,
              caughtStealing: 0,
              errors: 0,
              sacrificeFlies: 0,
              sacrificeBunts: 0
            };

            // write new player to database
            await set(newPlayerRef, newPlayerData);

            // get the new player's id and add to local players state (so subsequent rows can find it)
            const newPlayerId = newPlayerRef.key as string;
            const createdPlayer = { id: newPlayerId, ...newPlayerData };
            setPlayers(prev => [...prev, createdPlayer]);

            // Store in our tracking map so we don't create duplicates
            createdPlayersMap.set(playerKey, createdPlayer);

            // use the created player for this row
            player = createdPlayer;
          } catch (createErr) {
            console.error('Error creating player from CSV row:', createErr);
            errorCount++;
            errors.push(`Row ${successCount + errorCount + 1}: Could not create player`);
            continue;
          }
        }

        // Create game record
        const gamesRef = ref(database, `users/${user.uid}/games`);
        const newGameRef = push(gamesRef);

        const gameData = {
          playerId: player.id,
          date: row.Date || row.date,
          opponent: row.Opponent || row.opponent,
          plateAppearances: numOrZero(row.PA),
          atBats: numOrZero(row.AB),
          hits: numOrZero(row.H),
          singles: numOrZero(row['1B']),
          doubles: numOrZero(row['2B']),
          triples: numOrZero(row['3B']),
          homeRuns: numOrZero(row.HR),
          runs: numOrZero(row.R),
          rbis: numOrZero(row.RBI),
          walks: numOrZero(row.BB),
          hitByPitch: numOrZero(row.HBP),
          strikeouts: numOrZero(row.SO),
          stolenBases: numOrZero(row.SB),
          caughtStealing: numOrZero(row.CS),
          errors: numOrZero(row.E),
          sacrificeFlies: numOrZero(row.SF),
          sacrificeBunts: numOrZero(row.SH),
          batchId: batchId,
          createdAt: new Date().toISOString()
        };

        await set(newGameRef, gameData);

        // Update player totals
        const playerRef = ref(database, `users/${user.uid}/players/${player.id}`);
        const playerSnapshot = await new Promise((resolve) => {
          onValue(playerRef, resolve, { onlyOnce: true });
        });
        const currentPlayer = (playerSnapshot as any).val();

        const updatedTotals = {
          gamesPlayed: (currentPlayer.gamesPlayed || 0) + 1,
          plateAppearances: (currentPlayer.plateAppearances || 0) + gameData.plateAppearances,
          atBats: (currentPlayer.atBats || 0) + gameData.atBats,
          hits: (currentPlayer.hits || 0) + gameData.hits,
          singles: (currentPlayer.singles || 0) + gameData.singles,
          doubles: (currentPlayer.doubles || 0) + gameData.doubles,
          triples: (currentPlayer.triples || 0) + gameData.triples,
          homeRuns: (currentPlayer.homeRuns || 0) + gameData.homeRuns,
          runs: (currentPlayer.runs || 0) + gameData.runs,
          rbis: (currentPlayer.rbis || 0) + gameData.rbis,
          walks: (currentPlayer.walks || 0) + gameData.walks,
          hitByPitch: (currentPlayer.hitByPitch || 0) + gameData.hitByPitch,
          strikeouts: (currentPlayer.strikeouts || 0) + gameData.strikeouts,
          stolenBases: (currentPlayer.stolenBases || 0) + gameData.stolenBases,
          caughtStealing: (currentPlayer.caughtStealing || 0) + gameData.caughtStealing,
          errors: (currentPlayer.errors || 0) + gameData.errors,
          sacrificeFlies: (currentPlayer.sacrificeFlies || 0) + gameData.sacrificeFlies,
          sacrificeBunts: (currentPlayer.sacrificeBunts || 0) + gameData.sacrificeBunts
        };

        await update(playerRef, updatedTotals);
        successCount++;
      }

      const playerName = selectedPlayer ? players.find(p => p.id === selectedPlayer)?.name : '';
      const filterMsg = selectedPlayer ? ` for ${playerName}` : '';
      const newPlayersCount = createdPlayersMap.size;
      const newPlayersMsg = newPlayersCount > 0 ? ` (${newPlayersCount} new player${newPlayersCount > 1 ? 's' : ''} created)` : '';

      if (errorCount > 0) {
        setMessage(`Imported ${successCount} games${filterMsg}${newPlayersMsg}. ${errorCount} errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      } else {
        setMessage(`✅ Successfully imported ${successCount} games${filterMsg}${newPlayersMsg}! Check View Stats to see updated totals.`);
      }
      setTimeout(() => setMessage(null), 6000);
      
      // Clear preview
      setCsvPreview([]);
      setCsvFile(null);
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error importing CSV:', error);
      setMessage('Error importing CSV. Please try again.');
      setTimeout(() => setMessage(null), 3000);
    }
  };
  const downloadTemplate = () => {
    // Use actual players from roster if available
    let template = `Player Name,Jersey Number,Date,Opponent,PA,AB,H,1B,2B,3B,HR,R,RBI,BB,HBP,SO,SB,CS,E,SF,SH\n`;
    
    if (players.length > 0) {
      // Use first 3 players from actual roster
      players.slice(0, 3).forEach((player, idx) => {
        const date = new Date();
        date.setDate(date.getDate() - idx);
        const dateStr = date.toISOString().split('T')[0];
        
        // Different stat patterns for variety
        if (idx === 0) {
          template += `${player.name},${player.jerseyNumber},${dateStr},Hawks,4,4,3,1,2,0,0,2,3,0,0,0,1,0,0,0,0\n`;
        } else if (idx === 1) {
          template += `${player.name},${player.jerseyNumber},${dateStr},Tigers,5,4,2,1,0,0,1,2,3,1,0,1,0,0,0,0,0\n`;
        } else {
          template += `${player.name},${player.jerseyNumber},${dateStr},Lions,3,3,1,0,1,0,0,1,1,0,0,1,2,0,1,0,0\n`;
        }
      });
    } else {
      // Fallback template
      template += `John Smith,12,2024-10-15,Eagles,4,3,2,1,1,0,0,1,2,1,0,1,0,0,0,0,0\n`;
      template += `Jane Doe,7,2024-10-15,Eagles,3,3,1,1,0,0,0,0,1,0,0,0,1,0,0,0,0`;
    }
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'baseball_stats_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadSampleData = () => {
    // Generate comprehensive sample with multiple games per player
    let sample = `Player Name,Jersey Number,Date,Opponent,PA,AB,H,1B,2B,3B,HR,R,RBI,BB,HBP,SO,SB,CS,E,SF,SH\n`;
    
    if (players.length > 0) {
      players.slice(0, 2).forEach((player) => {
        // Generate 5 games per player
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const opponents = ['Hawks', 'Tigers', 'Lions', 'Bears', 'Eagles'];
          const opponent = opponents[i];
          
          // Randomize stats a bit for realism
          const stats = [
            [4, 4, 3, 1, 2, 0, 0, 2, 3, 0, 0, 0, 1, 0, 0, 0, 0], // Great game
            [5, 4, 2, 1, 0, 0, 1, 2, 3, 1, 0, 1, 0, 0, 0, 0, 0], // HR game
            [3, 3, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 2, 0, 1, 0, 0], // Avg game
            [4, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0], // Bad game
            [4, 4, 2, 2, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0]  // 2 singles
          ];
          
          const gameStat = stats[i];
          sample += `${player.name},${player.jerseyNumber},${dateStr},${opponent},${gameStat.join(',')}\n`;
        }
      });
    } else {
      // Fallback with example data
      sample += `Mike Johnson,5,2024-10-20,Hawks,4,4,3,1,2,0,0,2,3,0,0,0,1,0,0,0,0\n`;
      sample += `Mike Johnson,5,2024-10-19,Tigers,5,4,2,1,0,0,1,2,3,1,0,1,0,0,0,0,0\n`;
      sample += `Sarah Davis,12,2024-10-20,Hawks,3,3,1,0,1,0,0,1,1,0,0,1,2,0,1,0,0\n`;
      sample += `Sarah Davis,12,2024-10-19,Tigers,4,3,0,0,0,0,0,0,0,1,0,2,0,0,0,0,0\n`;
    }
    
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'baseball_stats_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const fields = [
    { name: 'plateAppearances', label: 'Plate Appearances' },
    { name: 'atBats', label: 'At Bats' },
    { name: 'hits', label: 'Total Hits' },
    { name: 'singles', label: 'Singles' },
    { name: 'doubles', label: 'Doubles' },
    { name: 'triples', label: 'Triples' },
    { name: 'homeRuns', label: 'Home Runs' },
    { name: 'runs', label: 'Runs' },
    { name: 'rbis', label: 'RBIs' },
    { name: 'walks', label: 'Walks' },
    { name: 'hitByPitch', label: 'Hit by Pitch' },
    { name: 'strikeouts', label: 'Strikeouts' },
    { name: 'stolenBases', label: 'Stolen Bases' },
    { name: 'caughtStealing', label: 'Caught Stealing' },
    { name: 'errors', label: 'Errors' },
    { name: 'sacrificeFlies', label: 'Sacrifice Flies' },
    { name: 'sacrificeBunts', label: 'Sacrifice Bunts' }
  ];

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
          ADD GAME STATS
        </h1>
        <p style={{
          color: '#e8f4fd',
          fontSize: '1.3rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Enter statistics manually or import from CSV
        </p>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {message && (
          <div style={{
            background: message.includes('Error') || message.includes('error') ? '#e74c3c' : '#27ae60',
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

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === 'manual' ? 'white' : 'rgba(255,255,255,0.3)',
              color: activeTab === 'manual' ? '#0f4c75' : 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: activeTab === 'manual' ? '0 8px 20px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            style={{
              flex: 1,
              padding: '1rem',
              background: activeTab === 'csv' ? 'white' : 'rgba(255,255,255,0.3)',
              color: activeTab === 'csv' ? '#0f4c75' : 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: activeTab === 'csv' ? '0 8px 20px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            CSV Import
          </button>
        </div>

        {activeTab === 'manual' ? (
          <form onSubmit={handleSubmit} style={{
            background: 'white',
            borderRadius: '25px',
            padding: '3rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '4px solid #FFD700'
          }}>
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '15px',
              border: '2px solid #e9ecef'
            }}>
              <h3 style={{
                color: '#2c3e50',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                Game Information
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={labelStyle}>Player</label>
                  <select
                    value={selectedPlayer}
                    onChange={e => setSelectedPlayer(e.target.value)}
                    required
                    style={selectStyle}
                  >
                    <option value="">Select Player</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} (#{player.jerseyNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Game Date</label>
                  <input
                    type="date"
                    value={gameDate}
                    onChange={(e) => setGameDate(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Opponent</label>
                  <input
                    type="text"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="Team name"
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Number of Games</label>
                  <input
                    type="number"
                    value={numGames}
                    onChange={(e) => setNumGames(Number(e.target.value) || 1)}
                    min="1"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '15px',
              border: '2px solid #e9ecef'
            }}>
              <h3 style={{
                color: '#2c3e50',
                marginBottom: '1.5rem',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                Batting Statistics
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '1rem'
              }}>
                {fields.map((field, idx) => (
                  <div key={field.name}>
                    <label style={labelStyle}>{field.label}</label>
                    <input
                      type="number"
                      name={field.name}
                      value={(gameStats as any)[field.name]}
                      onChange={(e) => {
                        handleStatChange(e);
                        if (e.target.value !== '') {
                          const next = document.querySelectorAll<HTMLInputElement>('input[type="number"]')[idx + 1];
                          if (next) next.focus();
                        }
                      }}
                      min="0"
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '1.5rem',
                background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                boxShadow: '0 8px 20px rgba(231,76,60,0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              SAVE GAME STATS
            </button>
          </form>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '25px',
            padding: '3rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '4px solid #FFD700'
          }}>
            <h3 style={{
              color: '#2c3e50',
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              Import Games from CSV
            </h3>

            {/* Player Filter */}
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#fff3cd',
              borderRadius: '15px',
              border: '2px solid #ffc107'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '1rem', fontWeight: 'bold' }}>
                Optional: Filter Import by Player
              </h4>
              <p style={{ color: '#856404', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Select a player to only import games for that specific player from your CSV. Leave blank to import all players.
              </p>
              <select
                value={selectedPlayer}
                onChange={e => setSelectedPlayer(e.target.value)}
                style={{
                  ...selectStyle,
                  width: '100%',
                  padding: '0.8rem'
                }}
              >
                <option value="">Import All Players from CSV</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} (#{player.jerseyNumber})
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#e8f4fd',
              borderRadius: '15px',
              border: '2px solid #3498db'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '1rem', fontWeight: 'bold' }}>
                CSV Format Instructions:
              </h4>
              <ul style={{ color: '#34495e', lineHeight: '1.8', marginLeft: '1.5rem' }}>
                <li>One game per row</li>
                <li>Required columns: Player Name, Jersey Number, Date, Opponent</li>
                <li>Stat columns: PA, AB, H, 1B, 2B, 3B, HR, R, RBI, BB, HBP, SO, SB, CS, E, SF, SH</li>
                <li>Date format: YYYY-MM-DD (e.g., 2024-10-15)</li>
                <li>Players must already exist in your roster</li>
              </ul>
              <button
                onClick={downloadTemplate}
                style={{
                  marginTop: '1rem',
                  marginRight: '1rem',
                  padding: '0.8rem 1.5rem',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Download Template CSV
              </button>
              <button
                onClick={downloadSampleData}
                style={{
                  marginTop: '1rem',
                  padding: '0.8rem 1.5rem',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Download Sample Data (10 Games)
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                ...labelStyle,
                fontSize: '1rem',
                marginBottom: '1rem'
              }}>
                Upload CSV File
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '3px dashed #3498db',
                  borderRadius: '15px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  background: '#f8f9fa'
                }}
              />
            </div>

            {csvPreview.length > 0 && (
              <>
                <div style={{
                  marginBottom: '2rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '2px solid #e9ecef',
                  borderRadius: '15px',
                  padding: '1rem',
                  background: 'white'
                }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '1rem', fontWeight: 'bold' }}>
                    Preview ({csvPreview.length} games):
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#2c3e50' }}>Player</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#2c3e50' }}>Jersey</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#2c3e50' }}>Date</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#2c3e50' }}>Opponent</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', color: '#2c3e50' }}>Stats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 10).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e9ecef' }}>
                          <td style={{ padding: '0.5rem', color: '#2c3e50' }}>{row['Player Name'] || row['PlayerName']}</td>
                          <td style={{ padding: '0.5rem', color: '#2c3e50' }}>{row['Jersey Number'] || row['JerseyNumber']}</td>
                          <td style={{ padding: '0.5rem', color: '#2c3e50' }}>{row.Date || row.date}</td>
                          <td style={{ padding: '0.5rem', color: '#2c3e50' }}>{row.Opponent || row.opponent}</td>
                          <td style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#2c3e50' }}>
                            {row.AB} AB, {row.H} H, {row.HR} HR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > 10 && (
                    <p style={{ marginTop: '1rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
                      ...and {csvPreview.length - 10} more games
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCsvImport}
                  style={{
                    width: '100%',
                    padding: '1.5rem',
                    background: 'linear-gradient(45deg, #27ae60, #229954)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    boxShadow: '0 8px 20px rgba(39,174,96,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  IMPORT {csvPreview.length} GAMES
                </button>
              </>
            )}
          </div>
        )}
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
};