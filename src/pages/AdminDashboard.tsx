import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StatusChip from '@/components/StatusChip';
import DataTable from '@/components/DataTable';
import IconButton from '@/components/IconButton';

interface Finisher {
  id: string;
  rank: number;
  bibNumber: string;
  racerName: string;
  finishTime: string;
  isEditing?: boolean;
}

const mockFinishers: Finisher[] = [
  { id: '1', rank: 1, bibNumber: '001', racerName: 'Sarah Johnson', finishTime: '2:45:32' },
  { id: '2', rank: 2, bibNumber: '156', racerName: 'Mike Chen', finishTime: '2:47:18' },
  { id: '3', rank: 3, bibNumber: '089', racerName: 'Emily Rodriguez', finishTime: '2:51:05' },
  { id: '4', rank: 4, bibNumber: '234', racerName: 'David Wilson', finishTime: '2:53:41' },
  { id: '5', rank: 5, bibNumber: '067', racerName: 'Lisa Thompson', finishTime: '2:56:12' },
];

export default function AdminDashboard() {
  const [finishers, setFinishers] = useState<Finisher[]>(mockFinishers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFinisher, setNewFinisher] = useState({ bibNumber: '', racerName: '', finishTime: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    if (!sessionStorage.getItem('isAdmin')) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = (id: string, updatedData: Partial<Finisher>) => {
    setFinishers(prev => prev.map(f => 
      f.id === id ? { ...f, ...updatedData } : f
    ));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setFinishers(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleAddFinisher = () => {
    if (!newFinisher.bibNumber || !newFinisher.racerName || !newFinisher.finishTime) {
      alert('Please fill in all fields');
      return;
    }

    const newRank = Math.max(...finishers.map(f => f.rank)) + 1;
    const finisher: Finisher = {
      id: Date.now().toString(),
      rank: newRank,
      ...newFinisher
    };

    setFinishers(prev => [...prev, finisher]);
    setNewFinisher({ bibNumber: '', racerName: '', finishTime: '' });
    setShowAddForm(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/admin');
  };

  const columns = [
    { key: 'rank', title: 'Rank', width: '80px', align: 'center' as const },
    { key: 'bibNumber', title: 'Bib #', width: '100px', align: 'center' as const },
    { key: 'racerName', title: 'Racer Name', width: '200px' },
    { key: 'finishTime', title: 'Finish Time', width: '120px', align: 'center' as const },
    { key: 'actions', title: 'Actions', width: '120px', align: 'center' as const },
  ];

  const renderRow = (finisher: Finisher) => {
    const isEditing = editingId === finisher.id;
    
    return (
      <tr key={finisher.id}>
        <td className="text-center font-mono">{finisher.rank}</td>
        <td className="text-center font-mono font-medium">
          {isEditing ? (
            <input
              type="text"
              defaultValue={finisher.bibNumber}
              className="form-input w-20 text-center"
              onBlur={(e) => handleSave(finisher.id, { bibNumber: e.target.value })}
            />
          ) : (
            finisher.bibNumber
          )}
        </td>
        <td>
          {isEditing ? (
            <input
              type="text"
              defaultValue={finisher.racerName}
              className="form-input w-full"
              onBlur={(e) => handleSave(finisher.id, { racerName: e.target.value })}
            />
          ) : (
            finisher.racerName
          )}
        </td>
        <td className="text-center font-mono">
          {isEditing ? (
            <input
              type="text"
              defaultValue={finisher.finishTime}
              className="form-input w-24 text-center"
              onBlur={(e) => handleSave(finisher.id, { finishTime: e.target.value })}
            />
          ) : (
            finisher.finishTime
          )}
        </td>
        <td className="text-center">
          <div className="flex items-center justify-center gap-1">
            {isEditing ? (
              <IconButton
                icon="check"
                onClick={() => setEditingId(null)}
                title="Save changes"
                variant="success"
              />
            ) : (
              <IconButton
                icon="edit"
                onClick={() => handleEdit(finisher.id)}
                title="Edit entry"
              />
            )}
            <IconButton
              icon="delete"
              onClick={() => handleDelete(finisher.id)}
              title="Delete entry"
              variant="destructive"
            />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Race Administration</h1>
            <p className="text-muted-foreground">Manage race results and finisher data</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost">
            <span className="material-icon">logout</span>
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-8">
          <StatusChip 
            label="Total Finishers" 
            value={finishers.length} 
            variant="success"
            icon="flag"
          />
          <StatusChip 
            label="Status" 
            value="Live Updates" 
            variant="live"
            icon="sync"
          />
          <StatusChip 
            label="Last Action" 
            value={new Date().toLocaleTimeString()} 
            icon="schedule"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            <span className="material-icon">add</span>
            Add Finisher
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Finisher</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bib Number</label>
                <input
                  type="text"
                  value={newFinisher.bibNumber}
                  onChange={(e) => setNewFinisher(prev => ({ ...prev, bibNumber: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Racer Name</label>
                <input
                  type="text"
                  value={newFinisher.racerName}
                  onChange={(e) => setNewFinisher(prev => ({ ...prev, racerName: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Finish Time</label>
                <input
                  type="text"
                  value={newFinisher.finishTime}
                  onChange={(e) => setNewFinisher(prev => ({ ...prev, finishTime: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., 2:30:45"
                />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={handleAddFinisher} className="btn-primary">
                  <span className="material-icon">save</span>
                  Save
                </button>
                <button onClick={() => setShowAddForm(false)} className="btn-ghost">
                  <span className="material-icon">close</span>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-icon text-primary">manage_accounts</span>
            <h2 className="text-xl font-semibold">Manage Results</h2>
          </div>
          
          <DataTable
            columns={columns}
            data={finishers}
            renderRow={renderRow}
            emptyMessage="No finishers added yet. Add the first finisher to get started."
          />
        </div>
      </div>
    </Layout>
  );
}