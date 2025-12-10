import { useState } from 'react';
import './RepositorySelector.css';

interface RepositorySelectorProps {
    repository: string;
    onRepositoryChange: (repo: string) => void;
}

const RepositorySelector = ({ repository, onRepositoryChange }: RepositorySelectorProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempRepo, setTempRepo] = useState(repository);
    const [error, setError] = useState<string | null>(null);

    const validateRepository = (repo: string): boolean => {
        // Validate format: owner/repo
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
        <div className="repository-selector">
            <label className="repo-label">📦 Repository:</label>
            {!isEditing ? (
                <div className="repo-display">
                    <span className="repo-name">{repository}</span>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="edit-button"
                        title="Change repository"
                    >
                        ✏️ Edit
                    </button>
                </div>
            ) : (
                <div className="repo-edit">
                    <input
                        type="text"
                        value={tempRepo}
                        onChange={(e) => setTempRepo(e.target.value)}
                        placeholder="owner/repository"
                        className="repo-input"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                    />
                    <button onClick={handleSave} className="save-button">✓</button>
                    <button onClick={handleCancel} className="cancel-button">✗</button>
                </div>
            )}
            {error && <div className="repo-error">{error}</div>}
        </div>
    );
};

export default RepositorySelector;
