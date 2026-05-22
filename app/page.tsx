'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const url = process.env.NEXT_PUBLIC_DRIVE_JSON_URL;
    
    if (!url) {
      setError('Environment variable NEXT_PUBLIC_DRIVE_JSON_URL not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Loading Iconic Tracker...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ margin: '0 0 10px 0', color: '#e53e3e' }}>Failed to Load Data</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={loadData}
            style={{ 
              backgroundColor: '#14A085', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show success with basic data info
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ backgroundColor: '#14A085', color: 'white', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>🏗️ Iconic Project Tracker</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Acres Foundation</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>✅</div>
          <h2 style={{ textAlign: 'center', color: '#14A085', marginBottom: '30px' }}>App is Live and Working!</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#14A085' }}>
                {data?.tasks?.length || 0}
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>Total Tasks</div>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#14A085' }}>
                {data?.projects?.length || 0}
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>Projects</div>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#14A085' }}>
                {data?.version || '1.0'}
              </div>
              <div style={{ color: '#666', marginTop: '5px' }}>Version</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#e6f7f4', padding: '20px', borderRadius: '6px', borderLeft: '4px solid #14A085' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#14A085' }}>✨ Phase 1 Complete</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
              <li>App deployed successfully ✅</li>
              <li>Environment variables working ✅</li>
              <li>Data loading from Google Drive ✅</li>
              <li>Ready for Phase 2 enhancements ✅</li>
            </ul>
          </div>

          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff8dc', borderRadius: '6px', fontSize: '14px', color: '#666' }}>
            <strong>Last Updated:</strong> {data?.timestamp ? new Date(data.timestamp).toLocaleString('en-IN') : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
