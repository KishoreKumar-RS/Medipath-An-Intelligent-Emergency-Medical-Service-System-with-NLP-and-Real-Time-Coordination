import re
import nltk
from deep_translator import GoogleTranslator
from langdetect import detect
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from difflib import SequenceMatcher

# -----------------------------------------------------------
# NLTK SETUP (Updated for 2025 compatibility)
# -----------------------------------------------------------
try:
    nltk.data.find('tokenizers/punkt_tab')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    print("Downloading necessary NLTK data...")
    nltk.download('punkt')
    nltk.download('punkt_tab') # ✅ REQUIRED FOR NEW NLTK
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('omw-1.4')

lemmatizer = WordNetLemmatizer()
english_stopwords = set(stopwords.words('english'))

# -----------------------------------------------------------
# 1. HARDCODED DATA
# -----------------------------------------------------------

CRITICAL_SYMPTOMS = [
    "heart attack", "chest pain", "cardiac arrest", "severe chest pressure",
    "left arm pain", "jaw pain", "profuse sweating", "heart",
    "stroke", "face drooping", "arm weakness", "slurred speech",
    "sudden numbness", "vision loss", "severe headache", "unconscious",
    "fainting", "seizure", "paralysis", "confusion",
    "accident", "severe bleeding", "trauma", "fracture", "head injury",
    "deep cut", "burn", "gunshot", "stab wound", "road accident",
    "broken bone", "crushed", "amputation", "crash",
    "difficulty breathing", "shortness of breath", "choking", 
    "severe asthma", "not breathing", "blue lips",
    "severe pain", "poisoning", "anaphylaxis", "severe allergic reaction",
    "vomiting blood", "labor pain", "suicide attempt"
]

CRITICAL_DEPT_MAP = {
    "heart": "Cardiology", "chest": "Cardiology", "cardiac": "Cardiology", "sweating": "Cardiology",
    "stroke": "Neurology", "face": "Neurology", "arm": "Neurology", "speech": "Neurology",
    "paralysis": "Neurology", "seizure": "Neurology", "unconscious": "Neurology", "headache": "Neurology", "faint": "Neurology",
    "accident": "Emergency", "bleed": "Emergency", "trauma": "Emergency", "fracture": "Emergency",
    "burn": "Emergency", "injury": "Emergency", "cut": "Emergency", "wound": "Emergency", "broken": "Emergency", "crash": "Emergency",
    "breath": "Pulmonology", "chok": "Pulmonology", "asthma": "Pulmonology",
    "vomit": "Gastroenterology", "poison": "Emergency", "stomach": "Gastroenterology", "abdominal": "Gastroenterology"
}

DOCTOR_MAP = {
    "Cardiology": "Cardiologist",
    "Neurology": "Neurologist",
    "Emergency": "Emergency Physician",
    "Pulmonology": "Pulmonologist",
    "Gastroenterology": "Gastroenterologist",
    "General": "General Physician"
}

DISEASE_MAP = {
    "Neurology": { "paralysis": "Stroke / Paralysis", "speech": "Stroke", "headache": "Severe Migraine", "seizure": "Epilepsy", "unconscious": "Loss of Consciousness" },
    "Cardiology": { "chest": "Myocardial Infarction", "heart": "Cardiac Arrest", "arm": "Angina", "faint": "Cardiac Syncope" },
    "Emergency": { "accident": "Trauma", "bleed": "Hemorrhage", "burn": "Severe Burns", "fracture": "Bone Fracture" },
    "Pulmonology": { "breath": "Respiratory Failure", "chok": "Obstruction" },
    "Gastroenterology": { "vomit": "GI Bleeding", "pain": "Appendicitis/Acute Abdomen" }
}

# -----------------------------------------------------------
# HELPER FUNCTIONS
# -----------------------------------------------------------

def detect_language(text: str) -> str:
    try:
        return detect(text)
    except:
        return "en"

def translate_to_english(text: str, lang: str) -> str:
    if lang == "en":
        return text
    try:
        return GoogleTranslator(source='auto', target='en').translate(text)
    except:
        return text

def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def medical_pipeline(user_text: str):
    lang = detect_language(user_text)
    english_text = translate_to_english(user_text, lang)
    cleaned_text = preprocess_text(english_text)

    # 1. Determine Status & Department
    status = "Normal"
    department = "General"
    
    # Critical Check Loop
    for keyword, dept in CRITICAL_DEPT_MAP.items():
        if keyword in cleaned_text:
            status = "Critical"
            department = dept
            break  
    
    # 2. Predict Specific Condition
    prediction = "General Checkup Required"
    
    if department in DISEASE_MAP:
        possible_conditions = []
        for keyword, condition in DISEASE_MAP[department].items():
            if keyword in cleaned_text:
                possible_conditions.append(condition)
        
        if possible_conditions:
            prediction = ", ".join(possible_conditions)
        else:
            prediction = f"Critical {department} Issue"
    elif status == "Critical":
        prediction = "Emergency Situation"

    doctor = DOCTOR_MAP.get(department, "General Physician")

    return {
        "original_text": user_text,
        "english_text": english_text,
        "final_status": status,
        "disease_info": {
            "top_department": department,
            "disease_prediction": prediction,
            "recommended_doctor": doctor
        }
    }