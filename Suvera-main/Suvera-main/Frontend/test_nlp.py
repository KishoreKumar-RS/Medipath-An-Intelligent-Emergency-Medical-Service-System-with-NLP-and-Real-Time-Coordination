# test_nlp.py
from Input_handling import medical_pipeline

# 1. Define Test Cases
test_cases = [
    "I have severe chest pain and sweating",         # Expect: Cardiology, Critical
    "My left arm hurts and I feel dizzy",            # Expect: Cardiology, Critical
    "Sudden inability to move right side",           # Expect: Neurology, Critical (Stroke)
    "I have a bad headache and fever",               # Expect: General, Normal
    "Vomiting blood since morning",                  # Expect: Gastroenterology/Pulmo, Critical
    "Serious car accident huge bleeding"             # Expect: Emergency, Critical
]

print("-" * 60)
print(f"{'INPUT TEXT':<40} | {'STATUS':<10} | {'DEPT'}")
print("-" * 60)

# 2. Run Pipeline
for text in test_cases:
    result = medical_pipeline(text)
    
    status = result["final_status"]
    
    # Get the top department safely
    if status == "Critical":
        # Critical returns a dictionary of depts, we grab the first key
        dept = list(result["critical_departments"].keys())[0] if result["critical_departments"] else "Emergency"
    else:
        dept = result["disease_info"]["top_department"]

    print(f"{text:<40} | {status:<10} | {dept}")

print("-" * 60)