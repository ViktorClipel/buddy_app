import os
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List, Iterator
from models.models import Message


class GeminiService:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        self.is_model_initialized = False
        self.generation_config = genai.types.GenerationConfig(
            temperature=1.0,
            top_p=0.95,
            top_k=40
        )
        self.system_instruction = (
            "Você é o Buddy, um companheiro de IA de desktop. Sua personalidade é prestativa e amigável. "
            "Responda ao usuário de forma concisa. Após sua resposta, adicione uma linha com o separador '%%FACTS%%'. "
            "Abaixo do separador, analise a última mensagem do usuário. Se ela contiver um fato novo e importante sobre o usuário "
            "(como nome, projetos, preferências), extraia-o em formato JSON. Exemplo: {\"nome_usuario\": \"João\"}. "
            "Se não houver nenhum fato novo, escreva 'null' abaixo do separador."
        )

    def initialize_model(self):
        if not self.api_key:
            raise ValueError("A variável de ambiente GOOGLE_API_KEY não foi definida.")

        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(
                'gemini-1.5-flash',
                system_instruction=self.system_instruction
            )
            self.is_model_initialized = True
            print("Backend: Modelo de IA carregado com sucesso.")
        except Exception as e:
            self.is_model_initialized = False
            print(f"Backend Erro: Não foi possível inicializar o modelo de IA. Detalhes: {e}")
            raise e

    # ✨ A função agora retorna um 'Iterator[str]' em vez de uma 'str' ✨
    def generate_response_stream(self, messages: List[Message]) -> Iterator[str]:
        if not self.model:
            self.initialize_model()
            if not self.model:
                raise Exception("Modelo de IA não pôde ser inicializado.")

        history_as_dicts = [message.model_dump() for message in messages]

        # ✨ A chamada agora usa 'stream=True' ✨
        response_stream = self.model.generate_content(
            history_as_dicts,
            generation_config=self.generation_config,
            stream=True
        )

        # Retorna um gerador que produz o texto de cada pedaço (chunk)
        for chunk in response_stream:
            if chunk.text:
                yield chunk.text


gemini_service = GeminiService()