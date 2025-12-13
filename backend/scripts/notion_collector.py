import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()

class NotionCollector:
    """Collects recent activity from Notion"""

    def __init__(self):
        self.notion_token = os.getenv("NOTION_TOKEN")
        
        if not self.notion_token:
            # Check for generic NOTION_BS or similar if user used different naming, but for now strict
            raise ValueError("NOTION_TOKEN not found in environment variables.")

        print(f"Initializing Notion client...", file=sys.stderr)
        self.client = Client(auth=self.notion_token)

    def collect_recent_activity(self, hours: int = 24) -> Dict[str, Any]:
        """Collect recent page edits/creations"""
        print(f"Collecting Notion activity for last {hours} hours...", file=sys.stderr)
        
        since = datetime.now() - timedelta(hours=hours)
        since_iso = since.isoformat()

        recent_pages = []
        try:
            # Search for pages updated recently
            # Notion search API sorts by relevance by default, let's sort by last_edited_time
            response = self.client.search(
                sort={
                    "direction": "descending",
                    "timestamp": "last_edited_time"
                },
                page_size=20
            )

            for result in response.get("results", []):
                last_edited_time = datetime.fromisoformat(result["last_edited_time"].replace('Z', '+00:00'))
                
                # Filter locally since search API filter is limited
                if last_edited_time >= since.replace(tzinfo=last_edited_time.tzinfo):
                    title = "Untitled"
                    if "properties" in result:
                        # Extract title (it's tricky in Notion)
                        for prop in result["properties"].values():
                            if prop["id"] == "title":
                                if prop["title"]:
                                    title = prop["title"][0]["plain_text"]
                                break
                    
                    recent_pages.append({
                        "type": "page",
                        "title": title,
                        "url": result["url"],
                        "last_edited": result["last_edited_time"],
                        "object": result["object"]
                    })
        except Exception as e:
            print(f"Error fetching Notion pages: {e}", file=sys.stderr)

        return {
            "source": "notion",
            "period_hours": hours,
            "pages": recent_pages
        }

if __name__ == "__main__":
    try:
        # Check for flag
        if len(sys.argv) > 1 and sys.argv[1] == '--recent-activity':
            collector = NotionCollector()
            result = collector.collect_recent_activity(hours=24)
            print(json.dumps(result))
        else:
            # Default behavior (maybe just list recent 24h anyway for now)
            collector = NotionCollector()
            result = collector.collect_recent_activity(hours=24)
            print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
