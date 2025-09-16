from transformers import pipeline

# Load model once at startup
summarizer = pipeline("text2text-generation", model="google/flan-t5-large")

def generate_ai_summary(prompt: str) -> str:
    try:
        # Encourage longer, more complete output
        result = summarizer(prompt, max_new_tokens=250, min_length=80, temperature=0.7, top_p=0.9, repetition_penalty=1.2, do_sample=True)
        text = result[0]['generated_text'].strip()

        # simple de-duplication
        sentences = text.split(". ")
        seen = []
        filtered = []
        for s in sentences:
            if s not in seen:
                filtered.append(s)
                seen.append(s)
        text = ". ".join(filtered)

        return text
    except Exception as e:
        return f"⚠️ AI model error: {str(e)}"