from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class BaseLLMBackend(ABC):
    """Abstract Base Class for LLM Backends."""

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        **kwargs: Any
    ) -> str:
        """Generate response from the LLM given a prompt."""
        pass
