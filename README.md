# AI Medical Assistant 🩺

Hey there! This is a professional-grade Medical RAG (Retrieval-Augmented Generation) system. Think of it as a clinical pharmacist consultant in your pocket! It uses the MedQA dataset from [Huggingface](https://huggingface.co/datasets/medalpaca/medical_meadow_medqa) and Google's Gemini 2.5 Flash to give you solid, evidence-based answers to tricky medical questions.

## 🚀 What can it do?

- **Real-time Streaming**: No waiting around! It uses Server-Sent Events (SSE) to stream answers from Gemini 2.5 Flash as they happen.
- **Smart Medical RAG**: I've grounded the AI in the medical_meadow_medqa dataset. This helps it stay on track and keeps things clinically accurate.
- **Quick Vector Search**: I'm using ChromaDB and HuggingFace Embeddings to find exactly what you're looking for, fast!
- **Easy-to-use UI**: The dashboard is clean and snappy! It's built with Next.js 16, Tailwind CSS, and FastAPI.

## 🛠️ How it's built

### The Backend (Python)

- **Framework**: FastAPI
- **The Brains**: Google Gemini 2.5 Flash
- **The Logic**: LangChain
- **The Library**: ChromaDB
- **Embeddings**: HuggingFace (all-MiniLM-L6-v2) as well (BAAI/bge-small-en-v1.5) inside `bge_ranker` folder

### The Frontend (Next.js)

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **State**: React Hooks
- **Streaming**: We use the native fetch API to handle those live text streams.

## 📋 What you'll need

- Python 3.12 or newer
- Node.js 18 or newer
- A LLM AI API Key for Gemini

## 🔧 Getting it running

### 1. Set up the Backend

Grab the code:
```
git clone langchain-medical-assistant/
cd ai-medical-assistant/backend
```

Install the tools:
```
uv sync
```

Set your API keys:
```
LLM_API_KEY=your-google-api-key-here
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_MODEL=gemini-2.5-flash
SYSTEM_PROMPT=You are a helpful medical assistant. Use the context to answer. Be concise.
CHAT_DB=/app/chat_history.db
HISTORY_WINDOW=6
RETRIEVAL_K=5
EMBED_MODEL=BAAI/bge-small-en-v1.5
EMBED_DEVICE=cpu
```

Fire it up:
```
docker compose up
```

You'll find the API hanging out at `http://localhost:7860`.

### 2. Set up the Frontend

Head over to the frontend folder:
```
cd ../frontend
```

Install everything:
```
npm install
```

Start the dev server:
```
npm run dev
```

Go to `http://localhost:3000` and you're good to go!

## 🔌 API Details

| Method | Where to go         | What it does                      |
|--------|---------------------|-----------------------------------|
| POST   | /                   | Returns the status of backend     |
| POST   | /chat               | Gives you a standard JSON answer. |
| POST   | /chat {stream:true} | Streams the answer live!          |
| POST   | /history/session_id | Returns the chat history          |
| POST   | /clear/session_id   | Clears the session                |

## 🧪 How well does it work?

We've tested this RAG system using some standard metrics on the MedQA dataset, and the results are looking great!

- **MRR (How fast it finds the right answer)**: ~0.77
- **Recall@5 (Did it find the answer in the top 5?)**: ~0.77
- **nDCG@5 (Is the ranking good?)**: ~0.77
- **Keyword Coverage**: ~0.88

## ⚠️ A quick heads-up!

This app is just for learning and research. It's definitely not a replacement for a real doctor or pharmacist. If you have health concerns, always talk to a professional!
