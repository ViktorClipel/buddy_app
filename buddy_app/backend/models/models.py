# Arquivo: backend/api/models.py
from pydantic import BaseModel
from typing import List, Literal

class Message(BaseModel):
    role: Literal["user", "model"]
    parts: List[str]

class ChatRequest(BaseModel):
    messages: List[Message]