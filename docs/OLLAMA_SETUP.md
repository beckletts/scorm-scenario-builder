# Local AI with Ollama (No CORS Issues)

## Why Use Ollama?
- ✅ No CORS restrictions
- ✅ Free to use
- ✅ Works offline
- ✅ No API key required
- ✅ Privacy-focused

## Installation

### macOS/Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows:
Download from: https://ollama.ai/download

## Setup

1. **Start Ollama:**
```bash
ollama serve
```

2. **Download a model:**
```bash
# Lightweight model (good for testing)
ollama pull llama3.2:1b

# Better quality model  
ollama pull llama3.2:3b

# High quality model (requires more RAM)
ollama pull llama3.1:8b
```

3. **Configure in your app:**
   - Provider: "ollama"
   - Model: "llama3.2:3b" (or whichever you downloaded)
   - URL: "http://localhost:11434" (default)

## Models Comparison

| Model | Size | RAM Needed | Quality | Speed |
|-------|------|------------|---------|--------|
| llama3.2:1b | 1.3GB | 4GB | Good | Fast |
| llama3.2:3b | 2.0GB | 8GB | Better | Medium |
| llama3.1:8b | 4.7GB | 16GB | Best | Slower |

## Usage in App

1. In AI Configuration modal:
   - Select "Ollama (Local)"
   - Leave API key empty
   - Test connection

2. Generate content locally with no CORS issues!

## Troubleshooting

- **Connection failed**: Make sure `ollama serve` is running
- **Model not found**: Run `ollama pull <model-name>` first
- **Slow responses**: Try a smaller model or check system resources