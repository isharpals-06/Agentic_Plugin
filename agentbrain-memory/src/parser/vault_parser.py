import os
import re
from typing import List, Dict, Any

class VaultParser:
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def parse_file(self, file_path: str, base_dir: str) -> List[Dict[str, Any]]:
        """
        Parses a single markdown/text file, strips frontmatter, and returns chunked sections.
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception:
            # Skip unreadable files
            return []

        # Strip frontmatter (yaml header enclosed by --- at the top of the file)
        frontmatter_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
        content_clean = frontmatter_pattern.sub('', content)

        # Basic chunking logic
        rel_path = os.path.relpath(file_path, base_dir).replace('\\', '/')
        title = os.path.splitext(os.path.basename(file_path))[0]
        
        chunks = []
        start = 0
        text_len = len(content_clean)
        
        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            
            # Try to break at a paragraph/newline boundary if possible
            if end < text_len:
                next_newline = content_clean.find('\n', end - 100, end + 100)
                if next_newline != -1:
                    end = next_newline

            chunk_text = content_clean[start:end].strip()
            if len(chunk_text) > 50:  # Skip tiny fragments
                chunks.append({
                    "text": chunk_text,
                    "metadata": {
                        "source": rel_path,
                        "title": title,
                        "chunk_index": len(chunks)
                    }
                })
            
            start += self.chunk_size - self.chunk_overlap
            if start >= text_len or end >= text_len:
                break
                
        return chunks

    def parse_directory(self, directory_path: str) -> List[Dict[str, Any]]:
        """
        Walks a directory and parses all markdown and text files.
        """
        all_chunks = []
        if not os.path.exists(directory_path):
            return []

        for root, _, files in os.walk(directory_path):
            # Ignore hidden directories like .git or .obsidian
            if any(part.startswith('.') for part in root.split(os.sep)):
                continue
                
            for file in files:
                if file.endswith(('.md', '.txt')):
                    file_path = os.path.join(root, file)
                    all_chunks.extend(self.parse_file(file_path, directory_path))
                    
        return all_chunks
