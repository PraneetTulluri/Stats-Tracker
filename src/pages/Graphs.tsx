import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import database, { auth } from '../firebase';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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
}

export default function Graphs() {
  const [user] = useAuthState(auth);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedGraph, setSelectedGraph] = useState<string>('batting-trend');
  const [comparePlayer, setComparePlayer] = useState('');

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

  const getPlayerGames = (playerId: string) => {
    return games
      .filter(g => g.playerId === playerId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const calculateAdvancedStats = (player: Player) => {
    if (!player.atBats || player.atBats === 0) {
      return {
        avg: 0,
        obp: 0,
        slg: 0,
        ops: 0,
        iso: 0,
        babip: 0,
        kRate: 0,
        bbRate: 0,
        hrRate: 0
      };
    }

    const totalBases = (player.singles || 0) + (player.doubles || 0) * 2 + (player.triples || 0) * 3 + (player.homeRuns || 0) * 4;
    const avg = player.hits / player.atBats;
    const obpDenom = player.atBats + (player.walks || 0) + (player.hitByPitch || 0) + (player.sacrificeFlies || 0);
    const obp = obpDenom > 0 ? (player.hits + (player.walks || 0) + (player.hitByPitch || 0)) / obpDenom : 0;
    const slg = totalBases / player.atBats;
    const ops = obp + slg;
    const iso = slg - avg;
    
    const ballsInPlay = player.atBats - player.strikeouts - player.homeRuns + (player.sacrificeFlies || 0);
    const babip = ballsInPlay > 0 ? (player.hits - player.homeRuns) / ballsInPlay : 0;
    
    const kRate = player.plateAppearances > 0 ? (player.strikeouts / player.plateAppearances) * 100 : 0;
    const bbRate = player.plateAppearances > 0 ? (player.walks / player.plateAppearances) * 100 : 0;
    const hrRate = player.atBats > 0 ? (player.homeRuns / player.atBats) * 100 : 0;

    return { avg, obp, slg, ops, iso, babip, kRate, bbRate, hrRate };
  };

  // Batting Average Trend
  const getBattingTrendData = () => {
    if (!selectedPlayer) return [];
    const playerGames = getPlayerGames(selectedPlayer);
    let cumulativeHits = 0;
    let cumulativeABs = 0;
    
    return playerGames.map(game => {
      cumulativeHits += game.hits;
      cumulativeABs += game.atBats;
      const avg = cumulativeABs > 0 ? cumulativeHits / cumulativeABs : 0;
      return {
        date: game.date,
        avg: parseFloat(avg.toFixed(3)),
        opponent: game.opponent
      };
    });
  };

  // Hit Distribution
  const getHitDistribution = () => {
    if (!selectedPlayer) return [];
    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return [];

    return [
      { name: 'Singles', value: player.singles || 0, color: '#3498db' },
      { name: 'Doubles', value: player.doubles || 0, color: '#27ae60' },
      { name: 'Triples', value: player.triples || 0, color: '#f39c12' },
      { name: 'Home Runs', value: player.homeRuns || 0, color: '#e74c3c' }
    ].filter(item => item.value > 0);
  };

  // Performance by Opponent
  const getPerformanceByOpponent = () => {
    if (!selectedPlayer) return [];
    const playerGames = getPlayerGames(selectedPlayer);
    
    const opponentStats = playerGames.reduce((acc, game) => {
      if (!acc[game.opponent]) {
        acc[game.opponent] = { hits: 0, atBats: 0, homeRuns: 0 };
      }
      acc[game.opponent].hits += game.hits;
      acc[game.opponent].atBats += game.atBats;
      acc[game.opponent].homeRuns += game.homeRuns;
      return acc;
    }, {} as Record<string, { hits: number; atBats: number; homeRuns: number }>);

    return Object.entries(opponentStats).map(([opponent, stats]) => ({
      opponent,
      avg: stats.atBats > 0 ? parseFloat((stats.hits / stats.atBats).toFixed(3)) : 0,
      homeRuns: stats.homeRuns
    }));
  };

  // Player Comparison Radar
  const getComparisonData = () => {
    if (!selectedPlayer || !comparePlayer) return [];
    
    const player1 = players.find(p => p.id === selectedPlayer);
    const player2 = players.find(p => p.id === comparePlayer);
    
    if (!player1 || !player2) return [];

    const stats1 = calculateAdvancedStats(player1);
    const stats2 = calculateAdvancedStats(player2);

    return [
      { metric: 'AVG', player1: stats1.avg * 1000, player2: stats2.avg * 1000 },
      { metric: 'OBP', player1: stats1.obp * 1000, player2: stats2.obp * 1000 },
      { metric: 'SLG', player1: stats1.slg * 1000, player2: stats2.slg * 1000 },
      { metric: 'ISO', player1: stats1.iso * 1000, player2: stats2.iso * 1000 },
      { metric: 'HR Rate', player1: stats1.hrRate * 10, player2: stats2.hrRate * 10 },
      { metric: 'BB Rate', player1: stats1.bbRate, player2: stats2.bbRate }
    ];
  };

  // Type for advanced stats bar chart
  interface AdvancedStatData {
    name: string;
    value: number;
  }

  // Advanced Stats Comparison
  const getAdvancedStatsComparison = () => {
    if (!selectedPlayer) return [];
    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return [];
    
    const stats = calculateAdvancedStats(player);
    
    return [
      { name: 'AVG', value: parseFloat((stats.avg * 1000).toFixed(0)) },
      { name: 'OBP', value: parseFloat((stats.obp * 1000).toFixed(0)) },
      { name: 'SLG', value: parseFloat((stats.slg * 1000).toFixed(0)) },
      { name: 'OPS', value: parseFloat((stats.ops * 1000).toFixed(0)) },
      { name: 'ISO', value: parseFloat((stats.iso * 1000).toFixed(0)) },
      { name: 'BABIP', value: parseFloat((stats.babip * 1000).toFixed(0)) }
    ];
  };

  // Home Run Trend
  const getHomeRunTrend = () => {
    if (!selectedPlayer) return [];
    const playerGames = getPlayerGames(selectedPlayer);
    let cumulativeHRs = 0;
    
    return playerGames.map(game => {
      cumulativeHRs += game.homeRuns;
      return {
        date: game.date,
        homeRuns: cumulativeHRs,
        opponent: game.opponent
      };
    });
  };

  // Strikeout vs Walk Rate
  const getKBBData = () => {
    if (!selectedPlayer) return [];
    const playerGames = getPlayerGames(selectedPlayer);
    
    return playerGames.map(game => {
      const kRate = game.plateAppearances > 0 ? (game.strikeouts / game.plateAppearances) * 100 : 0;
      const bbRate = game.plateAppearances > 0 ? (game.walks / game.plateAppearances) * 100 : 0;
      return {
        date: game.date,
        kRate: parseFloat(kRate.toFixed(1)),
        bbRate: parseFloat(bbRate.toFixed(1)),
        opponent: game.opponent
      };
    });
  };

  const selectedPlayerData = players.find(p => p.id === selectedPlayer);
  const comparePlayerData = players.find(p => p.id === comparePlayer);

  const graphOptions = [
    { value: 'batting-trend', label: '📈 Batting Average Trend', description: 'Track AVG over season' },
    { value: 'hit-distribution', label: '🥧 Hit Distribution', description: 'Singles, 2B, 3B, HR breakdown' },
    { value: 'opponent-performance', label: '🎯 Performance by Opponent', description: 'Stats vs each team' },
    { value: 'advanced-stats', label: '📊 Advanced Metrics', description: 'AVG, OBP, SLG, OPS, ISO, BABIP' },
    { value: 'homerun-trend', label: '💥 Home Run Accumulation', description: 'HR count over time' },
    { value: 'k-bb-rate', label: '⚖️ K% vs BB% Trend', description: 'Strikeout and walk rates' },
    { value: 'player-comparison', label: '🆚 Player Comparison', description: 'Compare two players' }
  ];

  const renderGraph = () => {
    switch (selectedGraph) {
      case 'batting-trend':
        const trendData = getBattingTrendData();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} tickFormatter={(val: number) => val.toFixed(3)} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avg" stroke="#3498db" strokeWidth={3} name="Batting Average" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'hit-distribution':
        const hitData = getHitDistribution();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={hitData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {hitData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'opponent-performance':
        const opponentData = getPerformanceByOpponent();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={opponentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="opponent" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="avg" fill="#3498db" name="Batting Average" />
              <Bar yAxisId="right" dataKey="homeRuns" fill="#e74c3c" name="Home Runs" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'advanced-stats':
        const advData = getAdvancedStatsComparison();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
                data={advData as AdvancedStatData[]}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: string | number | (string | number)[]) => {
                  if (typeof value === 'number') {
                    return (value / 1000).toFixed(3);
                  }
                  return value;
                }} />
                <Legend />
                <Bar dataKey="value" fill="#27ae60" name="Value (scaled)" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'homerun-trend':
        const hrData = getHomeRunTrend();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={hrData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="homeRuns" stroke="#e74c3c" strokeWidth={3} name="Total Home Runs" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'k-bb-rate':
        const kbbData = getKBBData();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={kbbData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="kRate" stroke="#e74c3c" strokeWidth={2} name="K%" />
              <Line type="monotone" dataKey="bbRate" stroke="#27ae60" strokeWidth={2} name="BB%" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'player-comparison':
        if (!comparePlayer) {
          return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7f8c8d' }}>
              <p style={{ fontSize: '1.2rem' }}>Select a second player to compare</p>
            </div>
          );
        }
        const compData = getComparisonData();
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={compData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar name={selectedPlayerData?.name} dataKey="player1" stroke="#3498db" fill="#3498db" fillOpacity={0.6} />
              <Radar name={comparePlayerData?.name} dataKey="player2" stroke="#e74c3c" fill="#e74c3c" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Calculate advanced insights
  const getInsights = () => {
    if (!selectedPlayerData) return [];
    const stats = calculateAdvancedStats(selectedPlayerData);
    const insights = [];

    if (stats.avg >= 0.300) insights.push({ type: '🔥', text: `Elite batting average of ${stats.avg.toFixed(3)}!` });
    if (stats.ops >= 0.900) insights.push({ type: '⭐', text: `Outstanding OPS of ${stats.ops.toFixed(3)}!` });
    if (stats.iso >= 0.200) insights.push({ type: '💪', text: `Excellent power with ISO of ${stats.iso.toFixed(3)}!` });
    if (stats.kRate < 15) insights.push({ type: '👁️', text: `Great plate discipline with ${stats.kRate.toFixed(1)}% K rate!` });
    if (stats.bbRate > 10) insights.push({ type: '🎯', text: `Strong eye with ${stats.bbRate.toFixed(1)}% walk rate!` });
    if (selectedPlayerData.stolenBases > 10) insights.push({ type: '⚡', text: `Speed threat with ${selectedPlayerData.stolenBases} stolen bases!` });

    return insights;
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
          ADVANCED ANALYTICS
        </h1>
        <p style={{
          color: '#e8f4fd',
          fontSize: '1.3rem',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Visualize performance trends and compare players
        </p>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {/* Player Selection */}
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '4px solid #FFD700'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Select Player
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedGraph === 'player-comparison' ? '1fr 1fr' : '1fr',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', color: '#34495e', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Primary Player
              </label>
              <select
                value={selectedPlayer}
                onChange={e => setSelectedPlayer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  border: '2px solid #3498db',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">Choose a player...</option>
                {players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} (#{player.jerseyNumber})
                  </option>
                ))}
              </select>
            </div>

            {selectedGraph === 'player-comparison' && (
              <div>
                <label style={{ display: 'block', color: '#34495e', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Compare With
                </label>
                <select
                  value={comparePlayer}
                  onChange={e => setComparePlayer(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    border: '2px solid #e74c3c',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Choose a player...</option>
                  {players.filter(p => p.id !== selectedPlayer).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} (#{player.jerseyNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Graph Type Selection */}
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '4px solid #FFD700'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Choose Visualization
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {graphOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedGraph(option.value)}
                style={{
                  padding: '1rem',
                  background: selectedGraph === option.value ? 'linear-gradient(45deg, #3498db, #2980b9)' : '#f8f9fa',
                  color: selectedGraph === option.value ? 'white' : '#2c3e50',
                  border: selectedGraph === option.value ? 'none' : '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedGraph === option.value ? '0 4px 15px rgba(52,152,219,0.4)' : 'none'
                }}
              >
                <div style={{ marginBottom: '0.3rem' }}>{option.label}</div>
                <div style={{
                  fontSize: '0.85rem',
                  opacity: 0.8,
                  fontWeight: 'normal'
                }}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedPlayer && selectedPlayerData && (
          <>
            {/* Insights Panel */}
            {getInsights().length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '25px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '4px solid #27ae60'
              }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  💡 Performance Insights
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {getInsights().map((insight, idx) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #e8f8f5, #d5f4e6)',
                      borderRadius: '10px',
                      border: '2px solid #27ae60'
                    }}>
                      <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{insight.type}</span>
                      <span style={{ color: '#2c3e50', fontWeight: '600' }}>{insight.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graph Display */}
            <div style={{
              background: 'white',
              borderRadius: '25px',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '4px solid #FFD700'
            }}>
              <h3 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {graphOptions.find(g => g.value === selectedGraph)?.label}
              </h3>
              {renderGraph()}
            </div>
          </>
        )}

        {!selectedPlayer && (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '25px',
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '3px dashed #bdc3c7',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
            <h3 style={{
              color: '#7f8c8d',
              fontSize: '1.5rem',
              marginBottom: '0.8rem',
              fontWeight: 'bold'
            }}>
              Select a Player to Begin
            </h3>
            <p style={{ color: '#95a5a6', fontSize: '1.1rem', margin: 0 }}>
              Choose a player above to visualize their performance data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}