import React, { useState } from 'react';

interface PlayerStats {
  hits: number;
  atBats: number;
  homeRuns: number;
  walks: number;
}

function Stats() {
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hits: 0,
    atBats: 0,
    homeRuns: 0,
    walks: 0,
  });
  const [message, setMessage] = useState('');

  // Batting Average
  const calcBattingAverage = () => {
    if (!playerStats.atBats || playerStats.atBats === 0) return '0.000';
    return (playerStats.hits / playerStats.atBats).toFixed(3);
  };

  // Slugging %
  const calcSlugging = () => {
    if (!playerStats.atBats || playerStats.atBats === 0) return '0.000';
    const singles = playerStats.hits - playerStats.homeRuns;
    const totalBases = singles * 1 + playerStats.homeRuns * 4;
    return (totalBases / playerStats.atBats).toFixed(3);
  };

  // On-base %
  const calcOBP = () => {
    const denom = playerStats.atBats + playerStats.walks;
    if (denom === 0) return '0.000';
    return ((playerStats.hits + playerStats.walks) / denom).toFixed(3);
  };

  // OPS = OBP + SLG
  const calcOPS = () => {
    const obp = parseFloat(calcOBP());
    const slg = parseFloat(calcSlugging());
    return (obp + slg).toFixed(3);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlayerStats((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Stats updated successfully!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h2 style={{ color: '#2a5298', marginBottom: '1.5rem' }}>📊 Player Stats</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '500px',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#2a5298', fontWeight: 600 }}>Hits:</label>
          <input
            type="number"
            name="hits"
            value={playerStats.hits}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginTop: '0.5rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#2a5298', fontWeight: 600 }}>At-Bats:</label>
          <input
            type="number"
            name="atBats"
            value={playerStats.atBats}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginTop: '0.5rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#2a5298', fontWeight: 600 }}>Home Runs:</label>
          <input
            type="number"
            name="homeRuns"
            value={playerStats.homeRuns}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginTop: '0.5rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#2a5298', fontWeight: 600 }}>Walks:</label>
          <input
            type="number"
            name="walks"
            value={playerStats.walks}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginTop: '0.5rem',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '0.75rem',
            backgroundColor: '#2a5298',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 600,
          }}
        >
          Update Stats
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: '1rem',
            background: '#43e97b',
            color: '#222',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            fontWeight: 500,
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          marginTop: '2rem',
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '500px',
        }}
      >
        <h3 style={{ color: '#2a5298', marginBottom: '1rem' }}>📈 Calculated Stats</h3>
        <div style={{ color: '#2a5298', fontWeight: 700, fontSize: '1.15rem' }}>
          Batting Average: <span style={{ color: '#ff6b35' }}>{calcBattingAverage()}</span>
        </div>
        <div style={{ color: '#2a5298', fontWeight: 700, fontSize: '1.15rem', marginTop: '0.5rem' }}>
          Slugging %: <span style={{ color: '#ff6b35' }}>{calcSlugging()}</span>
        </div>
        <div style={{ color: '#2a5298', fontWeight: 700, fontSize: '1.15rem', marginTop: '0.5rem' }}>
          On-base %: <span style={{ color: '#ff6b35' }}>{calcOBP()}</span>
        </div>
        <div style={{ color: '#2a5298', fontWeight: 700, fontSize: '1.15rem', marginTop: '0.5rem' }}>
          OPS: <span style={{ color: '#ff6b35' }}>{calcOPS()}</span>
        </div>
      </div>
    </div>
  );
}

export default Stats;
