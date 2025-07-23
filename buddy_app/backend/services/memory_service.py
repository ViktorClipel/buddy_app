import json
import os
import config # Importa o nosso novo arquivo de config

class MemoryService:
    def __init__(self, config_filename="buddy_config.json"):
        # --- Lógica de caminho modificada ---
        # Agora ele usa o caminho recebido do main.py através do config
        if config.BUDDY_DATA_PATH is None:
            raise ValueError("O caminho dos dados não foi inicializado no config.")
        
        self.config_path = os.path.join(config.BUDDY_DATA_PATH, config_filename)
        # --- Fim da modificação ---

    def load_facts(self) -> dict:
        """Carrega os fatos conhecidos do arquivo JSON. Retorna um dicionário vazio se o arquivo não existir."""
        if not os.path.exists(self.config_path):
            return {}
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}

    def save_facts(self, facts: dict):
        """Salva o dicionário de fatos no arquivo JSON."""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(facts, f, ensure_ascii=False, indent=4)
        except IOError as e:
            print(f"Erro ao salvar os fatos: {e}")

    def add_fact(self, new_fact: dict):
        """
        Adiciona um novo fato à memória, aplicando o filtro de redundância.
        Retorna True se um fato foi adicionado/atualizado, False caso contrário.
        """
        if not new_fact or not isinstance(new_fact, dict):
            return False

        current_facts = self.load_facts()
        has_changed = False

        for key, value in new_fact.items():
            if key not in current_facts or current_facts[key] != value:
                current_facts[key] = value
                has_changed = True
                print(f"[Memória]: Fato novo/atualizado adicionado -> {key}: {value}")

        if has_changed:
            self.save_facts(current_facts)
        
        return has_changed

memory_service = MemoryService()