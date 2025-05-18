import json
import re
import sys

# Read file path passed as argument
file_path = sys.argv[1]
with open(file_path, "r", encoding="utf-8") as f:
    raw_input = f.read()

# Parse spoken script lines
script_lines = re.findall(r'🔲\s*[“"](.+?)[”"]', raw_input)

# Parse objection blocks
objections_raw = re.split(r"⛔", raw_input)[1:]
objections = []

for block in objections_raw:
    lines = block.strip().split("\n")
    title = lines[0].strip('“”"')
    trigger_line = next((l for l in lines if "Trigger" in l), "")
    response_start = next((i for i, l in enumerate(lines) if "✅ Response" in l), -1)
    response_text = "\n".join(lines[response_start + 1 :]).strip("“”")

    triggers = re.findall(r"“(.*?)”", trigger_line)

    objections.append(
        {
            "title": title,
            "triggers": triggers,
            "sample_objection": triggers[0] if triggers else "",
            "response": response_text,
        }
    )

result = {"script_lines": script_lines, "objections": objections, "script": raw_input}
print(json.dumps(result))
