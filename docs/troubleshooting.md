# Troubleshooting

## Common Issues

### 1. MongoDB Connection Error
**Error**: `MongoNetworkError: failed to connect to server`
**Fix**: Ensure your MongoDB info in `.env` is correct. If running locally, make sure `mongod` is started.

### 2. Hugging Face API Errors
**Error**: `PretrainedModel not found` or 401 Unauthorized
**Fix**: Verify your `HUGGINGFACE_API_KEY` is valid and has read permissions. Ensure you have access to Llama-3 (some models require accepting terms).

### 3. ChromaDB Version Mismatch
**Error**: SQLite version errors.
**Fix**: Using ChromaDB requires a newer version of SQLite. On GitHub Actions or Linux, this is usually handled. On Windows, ensure you have the necessary build tools.

### 4. Kestra Flows Failing
**Error**: Task failed status.
**Fix**: Check the "Logs" tab in Kestra UI for the specific execution. It often highlights missing environment variables or network timeouts.
