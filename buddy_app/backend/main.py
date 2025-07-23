import uvicorn
import argparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config # Importa nosso novo arquivo de config

# --- Lógica de argumentos ---
# Esta seção AGORA roda ANTES de importar o resto da aplicação
parser = argparse.ArgumentParser()
parser.add_argument("--data-path", type=str, required=True, help="Caminho para a pasta de dados do Buddy")
args = parser.parse_args()

config.BUDDY_DATA_PATH = args.data_path
print(f"[Backend Config]: Caminho dos dados definido como: {config.BUDDY_DATA_PATH}")
# --- Fim da lógica ---

# AGORA sim, importamos o resto dos módulos que dependem da configuração
from api.routes import router as chat_router
from services.gemini_service import gemini_service

app = FastAPI(title="Desktop AI Agent Orchestrator")

@app.on_event("startup")
async def startup_event():
    """Esta função será executada quando o servidor FastAPI iniciar."""
    print("[Backend]: Servidor iniciado. Tentando inicializar o modelo de IA...")
    gemini_service.initialize_model()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)