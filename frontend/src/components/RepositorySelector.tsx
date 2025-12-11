import { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

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
        <div className="mb-3">
            <Form.Label>📦 Repository:</Form.Label>
            {!isEditing ? (
                <InputGroup>
                    <Form.Control
                        type="text"
                        value={repository}
                        readOnly
                        disabled
                    />
                    <Button
                        variant="outline-secondary"
                        onClick={() => setIsEditing(true)}
                        title="Change repository"
                    >
                        ✏️ Edit
                    </Button>
                </InputGroup>
            ) : (
                <InputGroup>
                    <Form.Control
                        type="text"
                        value={tempRepo}
                        onChange={(e) => setTempRepo(e.target.value)}
                        placeholder="owner/repository"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        isInvalid={!!error}
                    />
                    <Button variant="success" onClick={handleSave}>✓</Button>
                    <Button variant="danger" onClick={handleCancel}>✗</Button>
                    {error && (
                        <Form.Control.Feedback type="invalid">
                            {error}
                        </Form.Control.Feedback>
                    )}
                </InputGroup>
            )}
        </div>
    );
};

export default RepositorySelector;
