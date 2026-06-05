import requests
import json

def check_ollama():
    url = "http://localhost:11434/api/tags"
    try:
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            models = [m['name'] for m in data.get('models', [])]
            print("Ollama is RUNNING.")
            print(f"Available Models ({len(models)}):")
            for m in models:
                print(f" - {m}")
        else:
            print(f"Ollama returned status code: {response.status_code}")
    except Exception as e:
        print(f"Could not connect to Ollama on http://localhost:11434. Error: {e}")

if __name__ == '__main__':
    check_ollama()

