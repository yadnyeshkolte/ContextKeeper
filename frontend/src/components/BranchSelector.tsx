import { useState, useEffect } from 'react';
import './BranchSelector.css';

interface Branch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
}

interface BranchSelectorProps {
    repository: string;
    selectedBranch: string;
    onBranchChange: (branch: string) => void;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ repository, selectedBranch, onBranchChange }) => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBranches();
    }, [repository]);

    const fetchBranches = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:3000/api/branches?repository=${encodeURIComponent(repository)}`);
            if (!res.ok) {
                throw new Error('Failed to fetch branches');
            }
            const data = await res.json();
            setBranches(data.branches || []);

            // If no branch is selected and we have branches, select the first one (usually main/master)
            if (!selectedBranch && data.branches && data.branches.length > 0) {
                onBranchChange(data.branches[0].name);
            }
        } catch (err) {
            console.error('Failed to fetch branches:', err);
            setError('Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="branch-selector">
            <label htmlFor="branch-select" className="branch-label">
                📌 Branch:
            </label>
            <select
                id="branch-select"
                value={selectedBranch}
                onChange={(e) => onBranchChange(e.target.value)}
                disabled={loading || branches.length === 0}
                className="branch-select"
            >
                {loading && <option>Loading branches...</option>}
                {!loading && branches.length === 0 && <option>No branches available</option>}
                {!loading && branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                        {branch.name}
                    </option>
                ))}
            </select>
            {error && <span className="branch-error">⚠️ {error}</span>}
        </div>
    );
};

export default BranchSelector;
