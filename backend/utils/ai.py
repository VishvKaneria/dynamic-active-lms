from transformers import pipeline
import re

"""
    If using "microsoft/phi-3-mini-4k-instruct" then change "text-generation" in reasoner.
"""

# "microsoft/phi-3-mini-4k-instruct"
DEFAULT_MODEL = "google/flan-t5-base"

reasoner = pipeline(
    #"text-generation",
    "text2text-generation",
    model=DEFAULT_MODEL,
    device_map="auto",
    torch_dtype="auto"
)

def generate_ai_summary(prompt: str) -> str:
    try:
        result = reasoner(
            prompt,
            max_new_tokens=350,
            temperature=0.5,
            top_p=0.9,
            do_sample=True
        )

        text = result[0]["generated_text"].strip()

        # --- Remove everything between START_PROMPT and END_PROMPT ---
        text = re.sub(r"### START_PROMPT.*?### END_PROMPT", "", text, flags=re.DOTALL).strip()

        # Also strip unwanted closings
        text = re.sub(r"(sincerely|best regards|best,|thank you)[\s\S]*$", "", text, flags=re.IGNORECASE).strip()

        return text

    except Exception as e:
        return f"⚠️ AI model error: {str(e)}"