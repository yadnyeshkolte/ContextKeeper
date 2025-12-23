import { useState } from 'react';

interface RepositorySelectorProps {
    repository: string;
    onRepositoryChange: (repo: string) => void;
}

const RepositorySelector = ({ repository, onRepositoryChange }: RepositorySelectorProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempRepo, setTempRepo] = useState(repository);
    const [error, setError] = useState<string | null>(null);

    const validateRepository = (repo: string): boolean => {
        const repoPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
        return repoPattern.test(repo);
    };

    const handleSave = () => {
        if (!tempRepo.trim()) {
            setError('Repository name cannot be empty');
            return;
        }

        if (!validateRepository(tempRepo)) {
            setError('Invalid format. Use: owner/repository');
            return;
        }

        setError(null);
        onRepositoryChange(tempRepo);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempRepo(repository);
        setError(null);
        setIsEditing(false);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📦 Repository:
            </label>
            {!isEditing ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={repository}
                        readOnly
                        disabled
                        className="input-field flex-1 bg-gray-100 dark:bg-slate-700 cursor-not-allowed"
                    />
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary flex items-center gap-2"
                        title="Change repository"
                    >
                        ✏️ Edit
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tempRepo}
                            onChange={(e) => setTempRepo(e.target.value)}
                            placeholder="owner/repository"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                            className={`input-field flex-1 ${error ? 'border-rose-500 focus:ring-rose-500/50' : ''}`}
                        />
                        <button onClick={handleSave} className="btn-success">
                            ✓
                        </button>
                        <button onClick={handleCancel} className="btn-danger">
                            ✗
                        </button>
                    </div>
                    {error && (
                        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default RepositorySelector;
