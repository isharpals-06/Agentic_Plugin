import os
import pickle
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Try importing sentence-transformers for semantic search
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers or numpy not available. Falling back to simple keyword matching retrieval.")

class LocalVectorStore:
    def __init__(self, index_path: str = "data/vector_store.pkl", model_name: str = "all-MiniLM-L6-v2"):
        global SENTENCE_TRANSFORMERS_AVAILABLE
        self.index_path = index_path
        self.model_name = model_name
        self.chunks: List[Dict[str, Any]] = []
        
        self.model = None
        self.embeddings = None
        
        # Ensure data folder exists
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                # Load the model lazily
                self.model = SentenceTransformer(model_name)
            except Exception as e:
                logger.error(f"Error loading SentenceTransformer: {e}")
                SENTENCE_TRANSFORMERS_AVAILABLE = False

    def add_documents(self, chunks: List[Dict[str, Any]]):
        """
        Embed and index a list of document chunks.
        """
        self.chunks = chunks
        if not chunks:
            self.embeddings = None
            return

        if SENTENCE_TRANSFORMERS_AVAILABLE and self.model:
            texts = [c["text"] for c in chunks]
            logger.info(f"Generating embeddings for {len(texts)} chunks...")
            embeddings_list = self.model.encode(texts, show_progress_bar=False)
            self.embeddings = np.array(embeddings_list)
        else:
            # Fallback mode: we just keep the chunks for keyword matching
            self.embeddings = None
            
        self.save()

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Query the index and return top_k matching chunks.
        """
        if not self.chunks:
            return []

        if SENTENCE_TRANSFORMERS_AVAILABLE and self.model and self.embeddings is not None:
            # Embed the query
            query_emb = self.model.encode([query], show_progress_bar=False)[0]
            
            # Compute cosine similarities
            # Cosine similarity = dot(A, B) / (norm(A) * norm(B))
            norms = np.linalg.norm(self.embeddings, axis=1)
            query_norm = np.linalg.norm(query_emb)
            
            if query_norm == 0 or (norms == 0).any():
                similarities = np.zeros(len(self.chunks))
            else:
                similarities = np.dot(self.embeddings, query_emb) / (norms * query_norm)
                
            # Get top_k indices sorted descending
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                score = float(similarities[idx])
                results.append({
                    **self.chunks[idx],
                    "score": score
                })
            return results
        else:
            # Keyword fallback search: Simple BM25-like scoring based on word intersection
            logger.info("Performing keyword search fallback...")
            query_words = set(query.lower().split())
            results = []
            
            for chunk in self.chunks:
                chunk_words = chunk["text"].lower().split()
                # Count matches
                matches = sum(1 for w in query_words if w in chunk_words)
                score = matches / (len(query_words) + len(chunk_words) + 1e-9)
                if matches > 0:
                    results.append({
                        **chunk,
                        "score": score
                    })
                    
            # Sort by score descending
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:top_k]

    def save(self):
        """Save vector store index to file."""
        try:
            with open(self.index_path, 'wb') as f:
                pickle.dump({
                    "chunks": self.chunks,
                    "embeddings": self.embeddings if SENTENCE_TRANSFORMERS_AVAILABLE else None
                }, f)
            logger.info(f"Vector store saved to {self.index_path}")
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")

    def load(self) -> bool:
        """Load vector store index from file if it exists."""
        if not os.path.exists(self.index_path):
            return False
            
        try:
            with open(self.index_path, 'rb') as f:
                data = pickle.load(f)
                self.chunks = data.get("chunks", [])
                
                loaded_embs = data.get("embeddings")
                if SENTENCE_TRANSFORMERS_AVAILABLE and loaded_embs is not None:
                    self.embeddings = np.array(loaded_embs)
                else:
                    self.embeddings = None
                    
            logger.info(f"Loaded {len(self.chunks)} chunks from vector store.")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store from {self.index_path}: {e}")
            return False
