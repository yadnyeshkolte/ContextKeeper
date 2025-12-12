# Kestra Developer Reference Guide

## 1. Introduction to Kestra
Kestra is an open-source orchestration and scheduling platform that allows you to define complex workflows as code. It's designed to build specific data pipelines, conduct ETL processes, and even orchestrate microservices.

### Core Concepts
- **Flow**: A workflow definition in YAML. It describes a sequence of tasks to be executed.
- **Task**: An atomic unit of work in a flow (e.g., run a script, fetch a file, call an API).
- **Trigger**: A mechanism to start a flow (e.g., Schedule, Webhook, File Watcher).
- **Execution**: A single run of a flow.

## 2. Using Kestra Locally (Docker)
Since you are running Kestra via Docker, follow these steps to interact with the UI and run your flows.

### Step 1: Access the UI
1.  Open your browser and navigate to **[http://localhost:8081](http://localhost:8081)**.
2.  You will see the Kestra Dashboard.

### Step 2: Create the AI Flow
1.  In the left sidebar, click on **Flows**.
2.  Click the **+ Create** button in the top right.
3.  Copy and paste the content of the `ai-summarizer.yaml` file (found in your `kestra/flows/` directory or below) into the editor.

**Important**: Ensure you replace `{{ env('HUGGINGFACE_API_KEY') }}` with your actual key key string if you haven't set up environment variables in your Docker compose, OR make sure you add the key to your `docker-compose.yml` environment section or Kestra Secrets.

#### Simplified Flow for Copy-Paste:
```yaml
id: ai-summarizer
namespace: contextkeeper

variables:
  github_update: "New PR #42: Feature/AI-Agent - Implements basic Kestra flow structure."
  slack_update: "Channel #general: @user1 asked about the new deployment schedule."
  notion_update: "Page 'Q3 Roadmap': Added 'AI Integration' to priority list."

tasks:
  - id: aggregate-data
    type: io.kestra.core.tasks.debugs.Return
    format: |
      Here is the daily digest from your tools:
      GITHUB: {{ vars.github_update }}
      SLACK: {{ vars.slack_update }}
      NOTION: {{ vars.notion_update }}

  - id: summarize-updates
    type: io.kestra.plugin.huggingface.Inference
    apiKey: "hf_YOUR_ACTUAL_API_KEY_HERE" 
    model: google/flan-t5-large 
    inputs: |
      Summarize the following project updates into a concise daily briefing:
      {{ outputs.aggregate_data.value }}
    parameters:
      max_length: 200

  - id: log-summary
    type: io.kestra.core.tasks.log.Log
    message: |
      --- AI GENERATED SUMMARY ---
      {{ outputs.summarize_updates.generated_text }}
      ----------------------------
```
*(Replace `hf_YOUR_ACTUAL_API_KEY_HERE` with your real key before saving)*

4.  Click **Save**.

### Step 3: Run the Flow
1.  Click the **Execute** button (play icon) at the top of the flow page.
2.  This will trigger a new **Execution**.

### Step 4: Visualize and Verify
1.  You will be redirected to the **Execution** page.
2.  **Topology**: Click on the **Topology** tab to see the visual graph of your flow performing tasks step-by-step.
3.  **Logs**: Click on the **Logs** tab. Scroll down to look for the output of the `log-summary` task. You should see the AI-generated summary printed there.
4.  **Outputs**: Click on the **Outputs** tab to see the raw data returned by the tasks (e.g., the JSON from Hugging Face).

## 3. Creating Your First Flow (General)
*(Previous content remains...)*

## 4. Integrating AI Agents (Hugging Face)
*(Previous content remains...)*

## 5. Decision Making with AI
*(Previous content remains...)*

## 6. Integrating Data Sources
*(Previous content remains...)*

## 7. Resources
*(Previous content remains...)*
