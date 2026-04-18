from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import whisper
import os

# Import the medical pipeline from the OTHER file
from Input_handling import medical_pipeline

app = FastAPI(
    title="Medical Symptom Analyzer API",
    version="1.0"
)

# CORS Setup (Allows React to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model once
print("Loading Whisper model... This may take a moment.")
model = whisper.load_model("small")

# --- TEXT ANALYSIS ENDPOINT ---
@app.post("/analyze-text/")
async def analyze_text(text: str = Form(...)):
    try:
        # Pass text to the pipeline
        result = medical_pipeline(text)
        return {"analysis": result}
    except Exception as e:
        print(f"Error: {str(e)}")
        return {"error": str(e)}

# --- AUDIO ANALYSIS ENDPOINT ---
@app.post("/analyze-audio/")
async def analyze_audio(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Whisper Transcription
        output = model.transcribe(file_path, fp16=False)
        text = output["text"]

        # Pass to pipeline
        result = medical_pipeline(text)

        return {
            "transcribed_text": text,
            "analysis": result
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.get("/")
def home():
    return {"message": "API Running."}