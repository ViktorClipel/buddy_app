import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from models.models import Message, ChatRequest
from services.gemini_service import gemini_service
from services.memory_service import MemoryService

memory_service = MemoryService()
router = APIRouter()


@router.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    model_status = "loaded" if gemini_service.is_model_initialized else "error"
    await websocket.send_text(json.dumps({
        "type": "handshake",
        "model_status": model_status
    }))

    try:
        while True:
            data = await websocket.receive_text()
            chat_request_data = json.loads(data)
            chat_request = ChatRequest(**chat_request_data)

            known_facts = memory_service.load_facts()

            if known_facts:
                facts_as_string = json.dumps(known_facts, ensure_ascii=False)
                memory_context = (
                    "--- CONTEXTO DE MEMÓRIA (Fatos que você já sabe sobre o usuário) ---\n"
                    f"{facts_as_string}\n"
                    "--- FIM DO CONTEXTO DE MEMÓRIA ---\n"
                    "Use esses fatos para informar sua resposta."
                )
                memory_message = Message(role="user", parts=[memory_context])
                chat_request.messages.insert(0, memory_message)

            try:
                full_streamed_text = ""
                separator = "%%FACTS%%"

                # Itera sobre o fluxo de texto do serviço da IA
                for chunk in gemini_service.generate_response_stream(chat_request.messages):
                    # Acumula o texto completo para processar os fatos no final
                    full_streamed_text += chunk

                    # ✨ LÓGICA DE LIMPEZA EM TEMPO REAL ✨
                    # Limpa o chunk ANTES de enviá-lo para o frontend.
                    # O método partition() divide a string em 3 partes: antes do separador, o separador, e depois.
                    # Nós só nos importamos com a parte 'antes'.
                    clean_chunk, _, _ = chunk.partition(separator)

                    # Envia o chunk limpo apenas se ele não estiver vazio
                    if clean_chunk:
                        await websocket.send_text(json.dumps({
                            "type": "stream_chunk",
                            "payload": clean_chunk
                        }))

                # Sinaliza para o frontend que o fluxo terminou
                await websocket.send_text(json.dumps({"type": "stream_end"}))

                # Agora, com o texto completo, processa os fatos
                facts_part = None
                if separator in full_streamed_text:
                    # Usamos partition de novo para pegar apenas a parte DEPOIS do separador
                    _, _, facts_part = full_streamed_text.partition(separator)
                    facts_part = facts_part.strip()

                if facts_part and facts_part.lower() != 'null':
                    try:
                        extracted_facts = json.loads(facts_part)
                        memory_service.add_fact(extracted_facts)
                    except json.JSONDecodeError:
                        print(f"[Memória]: Erro ao decodificar o JSON de fatos: {facts_part}")

            except Exception as e:
                await websocket.send_text(json.dumps({"error": str(e)}))

    except WebSocketDisconnect:
        print("Frontend desconectado.")
    except Exception as e:
        print(f"Ocorreu um erro no WebSo    cket: {e}")
        await websocket.close(code=1011)