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

# Ask Cline for its analysis, showing only the summary
echo "Starting analysis with Cline..."
# Use timeout to prevent hanging, capture output to file to avoid pipe buffering issues
if ! timeout 300 cline -y "$PROMPT: $ISSUE_URL" --mode act $ADDRESS -F json > cline_output.txt 2> cline_error.txt; then
    echo "TIMEOUT or ERROR executing Cline."
    echo "--- STDERR ---"
    cat cline_error.txt
    echo "--- STDOUT (partial) ---"
    cat cline_output.txt
    exit 1
fi

echo "Cline finished. Parsing output..."

# Process the output
cat cline_output.txt | \
    sed -n '/^{/,$p' | \
    jq -r 'select(.say == "completion_result") | .text' | \
    sed 's/\\n/\n/g'
