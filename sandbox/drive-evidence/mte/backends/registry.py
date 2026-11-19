from typing import Dict, Type, Any
from .base import BaseLLMBackend
from .vertex_ai import VertexAIBackend

_REGISTRY: Dict[str, Type[BaseLLMBackend]] = {
    "vertex": VertexAIBackend,
}

def register_backend(name: str, backend_cls: Type[BaseLLMBackend]) -> None:
    _REGISTRY[name.lower()] = backend_cls

def get_backend(name: str = "vertex", **kwargs: Any) -> BaseLLMBackend:
    name_lower = name.lower()
    if name_lower not in _REGISTRY:
        raise ValueError(f"Unknown LLM backend: '{name}'. Available: {list(_REGISTRY.keys())}")
    return _REGISTRY[name_lower](**kwargs)
