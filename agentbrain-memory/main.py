import os
import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.parser.vault_parser import VaultParser
from src.retrieval.vector_store import LocalVectorStore

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AgentBrain Memory & Retrieval API",
    description="A local microservice for indexing files and conducting semantic searches.",
    version="1.0"
)

# Enable CORS for external access (e.g. Obsidian desktop application calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector store
store = LocalVectorStore()
store.load()  # Try to load existing index if present

class IndexRequest(BaseModel):
    vault_path: str
    chunk_size: int = 800
    chunk_overlap: int = 150

@app.get("/status")
def get_status():
    """Return status and document statistics of the index."""
    return {
        "status": "active",
        "total_chunks": len(store.chunks),
        "embeddings_loaded": store.embeddings is not None,
        "index_path": store.index_path
    }

@app.post("/index")
def index_vault(req: IndexRequest):
    """
    Triggers indexing of a vault path on the local filesystem.
    """
    if not os.path.exists(req.vault_path):
        raise HTTPException(status_code=400, detail=f"Vault path '{req.vault_path}' does not exist.")
        
    logger.info(f"Starting indexing of: {req.vault_path}")
    
    try:
        parser = VaultParser(chunk_size=req.chunk_size, chunk_overlap=req.chunk_overlap)
        chunks = parser.parse_directory(req.vault_path)
        
        if not chunks:
            return {
                "success": False,
                "message": "No valid text or markdown files were found to index."
            }
            
        store.add_documents(chunks)
        
        return {
            "success": True,
            "message": f"Successfully indexed {len(chunks)} chunks.",
            "total_chunks": len(store.chunks)
        }
    except Exception as e:
        logger.error(f"Error indexing vault: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/query")
def query_index(
    q: str = Query(..., description="Semantic search query string"),
    top_k: int = Query(5, description="Number of results to retrieve")
):
    """
    Performs vector similarity or keyword retrieval and returns top results.
    """
    try:
        results = store.search(q, top_k=top_k)
        return {
            "success": True,
            "query": q,
            "results": results
        }
    except Exception as e:
        logger.error(f"Error querying index: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
