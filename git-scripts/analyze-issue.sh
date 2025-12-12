#!/bin/bash
# Analyze a GitHub issue using Cline CLI

if [ -z "$1" ]; then
    echo "Usage: $0 <github-issue-url> [prompt] [address]"
    echo "Example: $0 https://github.com/owner/repo/issues/123"
    echo "Example: $0 https://github.com/owner/repo/issues/123 'What is the root cause of this issue?'"
    echo "Example: $0 https://github.com/owner/repo/issues/123 'What is the root cause of this issue?' 127.0.0.1:46529"
    exit 1
fi

# Gather the args
ISSUE_URL="$1"
PROMPT="${2:-What is the root cause of this issue?}"
if [ -n "$3" ]; then
    ADDRESS="--address $3"
fi

# Enable verbose execution tracing to debug hanging
set -x

# Ask Cline for its analysis, showing only the summary
echo "Starting analysis with Cline..." >&2

# Check if port is open (debug)
if [ -n "$3" ]; then
    PORT=$(echo $3 | cut -d: -f2)
    echo "Checking connectivity to port $PORT..." >&2
    netstat -an | grep $PORT || echo "Port $PORT not found in netstat" >&2
fi

# Use timeout to prevent hanging, capture output to file to avoid pipe buffering issues
# Reduced timeout to 60s for debugging
if ! timeout 60 cline -y "$PROMPT: $ISSUE_URL" --mode act $ADDRESS -F json > cline_output.txt 2> cline_error.txt; then
    echo "TIMEOUT or ERROR executing Cline." >&2
    echo "--- STDERR ---" >&2
    cat cline_error.txt >&2
    echo "--- STDOUT (partial) ---" >&2
    cat cline_output.txt >&2
    exit 1
fi

echo "Cline finished. Parsing output..." >&2

# Process the output
cat cline_output.txt | \
    sed -n '/^{/,$p' | \
    jq -r 'select(.say == "completion_result") | .text' | \
    sed 's/\\n/\n/g'
