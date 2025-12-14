import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { apiFetch } from '../utils/api';

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
            const res = await apiFetch(`/api/branches?repository=${encodeURIComponent(repository)}`);
            if (!res.ok) {
                throw new Error('Failed to fetch branches');
            }
            const data = await res.json();
            setBranches(data.branches || []);
            setFromCache(data.from_cache || false);

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
        <div className="mb-3">
            <Form.Label>
                📌 Branch: {fromCache && <small className="text-muted">(from cache)</small>}
            </Form.Label>
            <Form.Select
                value={selectedBranch}
                onChange={(e) => onBranchChange(e.target.value)}
                disabled={loading || branches.length === 0}
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
            </Form.Select>
            {error && <Form.Text className="text-danger">⚠️ {error}</Form.Text>}
        </div>
    );
};

export default BranchSelector;
