import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import StatusChip from '@/components/StatusChip';
import DataTable from '@/components/DataTable';

interface Finisher {
  id: string;
  rank: number;
  bibNumber: string;
  finishTime: string;
  racerName?: string;
}

// Mock data for demonstration
const mockFinishers: Finisher[] = [
  { id: '1', rank: 1, bibNumber: '001', finishTime: '2:45:32' },
  { id: '2', rank: 2, bibNumber: '156', finishTime: '2:47:18' },
  { id: '3', rank: 3, bibNumber: '089', finishTime: '2:51:05' },
  { id: '4', rank: 4, bibNumber: '234', finishTime: '2:53:41' },
  { id: '5', rank: 5, bibNumber: '067', finishTime: '2:56:12' },
];

const Index = () => {
  const [finishers, setFinishers] = useState<Finisher[]>(mockFinishers);
  const [totalFinishers, setTotalFinishers] = useState(5);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate WebSocket connection for real-time updates
    const interval = setInterval(() => {
      // Simulate new finisher arriving
      if (Math.random() > 0.8) {
        const newRank = finishers.length + 1;
        const newFinisher: Finisher = {
          id: `${newRank}`,
          rank: newRank,
          bibNumber: String(Math.floor(Math.random() * 999) + 1).padStart(3, '0'),
          finishTime: `${Math.floor(Math.random() * 2) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        };
        
        setFinishers(prev => [...prev, newFinisher]);
        setTotalFinishers(prev => prev + 1);
        setLastUpdated(new Date());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [finishers.length]);

  const columns = [
    { key: 'rank', title: 'Rank', width: '80px', align: 'center' as const },
    { key: 'bibNumber', title: 'Bib #', width: '100px', align: 'center' as const },
    { key: 'finishTime', title: 'Finish Time', align: 'center' as const },
  ];

  const renderRow = (finisher: Finisher, index: number) => (
    <tr key={finisher.id} className={index >= mockFinishers.length ? 'new-entry' : ''}>
      <td className="text-center font-mono">
        {finisher.rank <= 3 ? (
          <div className="flex items-center justify-center gap-1">
            <span className="material-icon text-warning">
              {finisher.rank === 1 ? 'workspace_premium' : 'emoji_events'}
            </span>
            <span>{finisher.rank}</span>
          </div>
        ) : (
          finisher.rank
        )}
      </td>
      <td className="text-center font-mono font-medium">{finisher.bibNumber}</td>
      <td className="text-center font-mono text-lg font-medium">{finisher.finishTime}</td>
    </tr>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">2024 Marathon Championship</h1>
          <p className="text-muted-foreground">Live race results updated in real-time</p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-8">
          <StatusChip 
            label="Total Finishers" 
            value={totalFinishers} 
            variant="success"
            icon="flag"
          />
          <StatusChip 
            label="Last Updated" 
            value={lastUpdated.toLocaleTimeString()} 
            variant="live"
            icon="update"
          />
          <StatusChip 
            label="Race Status" 
            value="In Progress" 
            variant="live"
            icon="radio_button_checked"
          />
        </div>

        {/* Results Table */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-icon text-primary">leaderboard</span>
            <h2 className="text-xl font-semibold">Live Results</h2>
          </div>
          
          <DataTable
            columns={columns}
            data={finishers}
            renderRow={renderRow}
            emptyMessage="No finishers yet. Results will appear as runners cross the finish line."
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Results are updated automatically. No refresh required.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
