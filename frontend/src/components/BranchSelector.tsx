import { useState, useEffect } from 'react';

interface Branch {
    name: string;
    commit?: {
        sha: string;
        url: string;
    };
    protected?: boolean;
    synced?: boolean;
    doc_count?: number;
    cached?: boolean;
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
    const [fromCache, setFromCache] = useState(false);

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
            setFromCache(data.from_cache || false);

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
        <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📌 Branch:
                {fromCache && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(from cache)</span>
                )}
            </label>
            <select
                value={selectedBranch}
                onChange={(e) => onBranchChange(e.target.value)}
                disabled={loading || branches.length === 0}
                className="select-field"
            >
                {loading && <option>Loading branches...</option>}
                {!loading && branches.length === 0 && <option>No branches available</option>}
                {!loading && branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                        {branch.name}
                        {branch.synced && ` ✓ (${branch.doc_count || 0} docs)`}
                        {branch.cached && ' (cached)'}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">⚠️ {error}</p>
            )}
        </div>
    );
};

export default BranchSelector;
