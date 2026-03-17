from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List

#chunking of the text embeddings using langchain.....
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)


def chunk_text(text: str) -> List[str]:
    raw_chunks = _splitter.split_text(text)
    return [c.strip() for c in raw_chunks if len(c.strip()) > 80]
