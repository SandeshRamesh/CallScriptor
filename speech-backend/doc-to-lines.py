import json
import re
import sys


def extract_keywords_from_triggers(triggers):
    """Extract meaningful, lowercase keywords from trigger phrases."""
    keywords = set()
    for phrase in triggers:
        words = re.findall(
            r"\b[a-zA-Z]{3,}\b", phrase.lower()
        )  # only alphabetic, ≥3 chars
        keywords.update(words)
    return sorted(list(keywords))


# Read file path passed as argument
file_path = sys.argv[1]
with open(file_path, "r", encoding="utf-8") as f:
    raw_input = f.read()

# --- Extract script lines
script_lines = re.findall(r'🔲\s*[“"](.+?)[”"]', raw_input)

# --- Extract objections
objections_raw = re.split(r"⛔", raw_input)[1:]
objections = []

for block in objections_raw:
    lines = block.strip().split("\n")
    title = lines[0].strip('“”" ')

    # Find line with "Trigger:" and extract quotes (curly or straight)
    trigger_line = next((l for l in lines if "Trigger" in l), "")
    triggers = re.findall(r'[“"](.*?)[”"]', trigger_line)

    # Fallback: if no quotes found, try to split on slash
    if not triggers and "Trigger:" in trigger_line:
        triggers = [
            t.strip() for t in trigger_line.split(":", 1)[1].split("/") if t.strip()
        ]

    # Generate keywords directly from trigger words
    keywords = extract_keywords_from_triggers(triggers)

    # Find response block
    response_start = next((i for i, l in enumerate(lines) if "✅ Response" in l), -1)
    response_text = "\n".join(lines[response_start + 1 :]).strip("“”")

    objections.append(
        {
            "label": title.upper(),
            "triggers": triggers,
            "keywords": keywords,
            "response": response_text,
        }
    )

result = {"script_lines": script_lines, "objections": objections, "script": raw_input}

print(json.dumps(result, indent=2))
