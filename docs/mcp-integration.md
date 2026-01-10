# MCP (Model Context Protocol) Integration

## What is MCP?

Model Context Protocol allows AI assistants (like Claude, ChatGPT) to interact with your tools and data through standardized interfaces. For your microbiome analysis platform, MCP can expose analysis capabilities to AI assistants.

## Use Cases for Your Application

### 1. AI-Powered Analysis Assistant

```
User: "Analyze my microbiome sample and explain the results"
AI + MCP: 
  1. Calls run_microbiome_analysis(sample_file)
  2. Gets results
  3. Explains bacteria composition in plain language
```

### 2. Interactive Data Exploration

```
User: "Which bacteria are most abundant in my sample?"
AI + MCP:
  1. Calls get_bacteria_composition(job_id)
  2. Returns top bacteria
  3. Provides context about each bacteria
```

### 3. Automated Report Generation

```
User: "Generate a comprehensive report of my microbiome analysis"
AI + MCP:
  1. Fetches analysis results
  2. Retrieves diversity metrics
  3. Generates narrative report with insights
```

---

## Architecture with MCP

```
┌─────────────────┐
│  Claude/GPT     │
│  (AI Assistant) │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│   MCP Server    │ ← Exposes tools
│   (Python)      │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Django Backend │
│  + Nextflow     │
└─────────────────┘
```

---

## MCP Server Implementation

Create `mcp-server/server.py`:

```python
from mcp.server import Server, McpError
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import httpx
import os

# Initialize MCP server
server = Server("microbiome-analysis")

DJANGO_API_URL = os.getenv("DJANGO_API_URL", "http://localhost:8000/api")
API_KEY = os.getenv("DJANGO_API_KEY")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available microbiome analysis tools"""
    return [
        Tool(
            name="run_microbiome_analysis",
            description=(
                "Submit microbiome sequencing data for analysis. "
                "Runs the nf-core/ampliseq pipeline to identify bacteria. "
                "Returns a job_id to track progress."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "project_name": {
                        "type": "string",
                        "description": "Name for this analysis project"
                    },
                    "email": {
                        "type": "string",
                        "description": "Email for notification when complete"
                    },
                    "data_type": {
                        "type": "string",
                        "enum": ["paired-end", "single-end"],
                        "description": "Type of sequencing data"
                    },
                    "use_test_data": {
                        "type": "boolean",
                        "description": "Use test data instead of uploading files"
                    }
                },
                "required": ["project_name", "email", "data_type"]
            }
        ),
        Tool(
            name="get_analysis_status",
            description="Check the status of a microbiome analysis job",
            inputSchema={
                "type": "object",
                "properties": {
                    "job_id": {
                        "type": "string",
                        "description": "The job ID from run_microbiome_analysis"
                    }
                },
                "required": ["job_id"]
            }
        ),
        Tool(
            name="get_bacteria_composition",
            description=(
                "Get the bacteria composition for a completed analysis. "
                "Returns list of bacteria genus, family, phylum, and read counts."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "job_id": {
                        "type": "string",
                        "description": "The job ID of completed analysis"
                    }
                },
                "required": ["job_id"]
            }
        ),
        Tool(
            name="get_diversity_metrics",
            description=(
                "Get diversity metrics (alpha and beta diversity) "
                "for a completed microbiome analysis"
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "job_id": {
                        "type": "string",
                        "description": "The job ID of completed analysis"
                    }
                },
                "required": ["job_id"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Execute microbiome analysis tools"""
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {API_KEY}"}
        
        try:
            if name == "run_microbiome_analysis":
                # Submit analysis job
                response = await client.post(
                    f"{DJANGO_API_URL}/jobs/upload/",
                    json=arguments,
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                
                return [TextContent(
                    type="text",
                    text=f"Analysis job submitted successfully!\n"
                         f"Job ID: {data['job_id']}\n"
                         f"Status: {data['status']}\n"
                         f"Use get_analysis_status to check progress."
                )]
            
            elif name == "get_analysis_status":
                job_id = arguments["job_id"]
                response = await client.get(
                    f"{DJANGO_API_URL}/jobs/{job_id}/status/",
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                
                status_msg = f"Job Status: {data['status']}\n"
                if data['status'] == 'completed':
                    status_msg += "✓ Analysis complete!\n"
                    status_msg += f"Results available at: {data.get('result', {}).get('report_html', 'N/A')}"
                elif data['status'] == 'failed':
                    status_msg += f"✗ Analysis failed: {data.get('error_message', 'Unknown error')}"
                else:
                    status_msg += "⏳ Analysis in progress..."
                
                return [TextContent(type="text", text=status_msg)]
            
            elif name == "get_bacteria_composition":
                job_id = arguments["job_id"]
                response = await client.get(
                    f"{DJANGO_API_URL}/jobs/{job_id}/bacteria/",
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                
                bacteria_list = data.get('bacteria', [])
                result = f"Found {len(bacteria_list)} bacterial taxa:\n\n"
                
                for i, bacteria in enumerate(bacteria_list[:20], 1):
                    result += (
                        f"{i}. {bacteria['genus']}\n"
                        f"   Family: {bacteria['family']}\n"
                        f"   Phylum: {bacteria['phylum']}\n"
                        f"   Reads: {bacteria['total_reads']:,}\n\n"
                    )
                
                return [TextContent(type="text", text=result)]
            
            elif name == "get_diversity_metrics":
                job_id = arguments["job_id"]
                response = await client.get(
                    f"{DJANGO_API_URL}/jobs/{job_id}/status/",
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                
                result = data.get('result', {})
                metrics = result.get('diversity_metrics', {})
                
                if not metrics:
                    return [TextContent(
                        type="text",
                        text="No diversity metrics available yet. Job may not be complete."
                    )]
                
                output = "Diversity Metrics:\n\n"
                output += f"Alpha Diversity: {metrics.get('alpha_diversity', 'N/A')}\n"
                output += f"Beta Diversity: {metrics.get('beta_diversity', 'N/A')}\n"
                
                return [TextContent(type="text", text=output)]
            
            else:
                raise McpError(f"Unknown tool: {name}")
                
        except httpx.HTTPError as e:
            raise McpError(f"API request failed: {str(e)}")


async def main():
    """Run the MCP server"""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## Deployment Options

### Option 1: Local Development (MCP in Claude Desktop)

1. Install MCP server:
```bash
cd mcp-server
pip install mcp httpx
```

2. Configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "microbiome-analysis": {
      "command": "python",
      "args": ["/path/to/mcp-server/server.py"],
      "env": {
        "DJANGO_API_URL": "http://localhost:8000/api",
        "DJANGO_API_KEY": "your-api-key"
      }
    }
  }
}
```

3. Restart Claude Desktop

### Option 2: Production (MCP Server on EC2)

Deploy alongside your Django backend:
```yaml
# docker-compose.yml
services:
  mcp-server:
    build: ./mcp-server
    ports:
      - "3000:3000"
    environment:
      - DJANGO_API_URL=http://backend:8000/api
      - DJANGO_API_KEY=${DJANGO_API_KEY}
    networks:
      - app-network
```

---

## Example User Interactions

**Scenario 1: Running Analysis**
```
User: "I have microbiome sequencing data from a soil sample. Can you analyze it?"

AI: I can help you analyze your microbiome data! Let me submit it for analysis.
    [Calls run_microbiome_analysis]
    
    ✓ Your analysis has been submitted (Job ID: abc-123)
    The pipeline will identify bacteria in your soil sample.
    I'll check back in a few minutes for results.
```

**Scenario 2: Checking Results**
```
User: "What bacteria did you find in job abc-123?"

AI: [Calls get_bacteria_composition]
    
    Found 45 bacterial taxa in your soil sample! Here are the top 5:
    
    1. Pseudomonas (Gammaproteobacteria) - 12,450 reads
       Common soil bacteria, involved in nutrient cycling
    
    2. Streptomyces (Actinobacteria) - 8,920 reads
       Produces many antibiotics naturally
    
    [... continues ...]
```

**Scenario 3: Interpretation**
```
User: "What does high Pseudomonas mean for soil health?"

AI: High levels of Pseudomonas in soil typically indicate:
    - Active organic matter decomposition
    - Good nitrogen cycling
    - Potential plant growth promotion
    [... continues with context ...]
```

---

## Cost & Complexity

**Development:**
- ~2-4 hours to build MCP server
- Requires MCP protocol knowledge

**Hosting:**
- Runs alongside Django (minimal cost)
- Or serverless function (~$0-5/month)

**Maintenance:**
- Update tools when API changes
- Keep MCP SDK updated

---

## When to Use MCP

✅ **Use MCP if:**
- Building AI assistant interface
- Want conversational analysis interface
- Users prefer chat over forms
- Explaining results in natural language
- Building research assistant features

❌ **Skip MCP if:**
- Traditional web UI is sufficient
- Users aren't using AI assistants
- Simple API is good enough
- Want to minimize complexity

---

## MCP + n8n Together

Powerful combination:
- **MCP**: User-facing AI interface
- **n8n**: Background automation

Example flow:
1. User asks AI to run analysis (via MCP)
2. MCP calls Django API to submit job
3. n8n monitors job completion
4. n8n sends email when done
5. User asks AI for results (via MCP)
6. AI retrieves and explains results

---

## Next Steps

1. **Try MCP locally** with Claude Desktop first
2. **Build 1-2 tools** to test the concept
3. **Deploy n8n** for job automation
4. **Combine both** for full automation + AI interface
