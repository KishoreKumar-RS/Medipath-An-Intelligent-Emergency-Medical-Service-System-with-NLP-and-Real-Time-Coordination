import React, { useState, useRef, useEffect } from 'react';
import '../../styles/Chatbot.css';

const MedicalChatbot = () => {
    // 🔴 YOUR KEY
    const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

    const [messages, setMessages] = useState([
        { 
            id: 1, 
            text: "Hello! I am Suvera - your Personal Doc. <br> How can I help you today?", 
            sender: 'bot', 
            isHtml: true 
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (textOverride = null) => {
        const text = textOverride || input.trim();
        if (!text) return;

        const userMsg = { id: Date.now(), text: text, sender: 'user', isHtml: false };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        const lowerInput = text.toLowerCase();
        if (lowerInput === "hi" || lowerInput === "hello") {
            setTimeout(() => {
                addBotMessage("Hello! Please describe your symptoms.");
                setIsLoading(false);
            }, 600);
            return;
        }

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { 
                            role: "system", 
                            // 👇 UPDATED BRAIN: STRICTER MEDICAL RULES
                            content: `You are Suvera, an expert Medical AI Assistant. 
                            1. ANALYZE symptoms carefully.
                            2. IF CRITICAL (Heart attack, Stroke, TB, Severe Burns): Start with "⚠️ **CRITICAL WARNING**" and advise immediate doctor visit.
                            3. STRICT RESPONSE FORMAT:
                               - **Condition:** [Name of disease]
                               - **Home Remedy:** [Immediate relief steps only. If serious, say 'Medical attention required']
                               - **Dos:** [Actionable advice starting with verbs, e.g., 'Wear a mask', 'Isolate', 'Drink water']
                               - **Donts:** [What to avoid, e.g., 'Don't share food', 'Avoid cold water']
                            4. NEVER list time durations (like '6 months') under 'Dos'. Dos must be ACTIONS.
                            5. Keep it concise.`
                        },
                        { role: "user", content: text }
                    ]
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                const errMsg = data.error?.message || "API Error";
                throw new Error(errMsg);
            }

            const aiText = data.choices[0].message.content;
            const formattedText = formatResponse(aiText);
            const isCritical = aiText.includes("CRITICAL") || aiText.includes("WARNING");

            addBotMessage(formattedText, isCritical);

        } catch (error) {
            console.error(error);
            addBotMessage(`❌ Connection Error: ${error.message}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const addBotMessage = (text, isCritical = false) => {
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            text: text, 
            sender: 'bot', 
            isHtml: true,
            isCritical: isCritical
        }]);
    };

    const formatResponse = (text) => {
        let cleanText = text.replace(/\n/g, "<br>");
        
        // Bold formatting
        cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); 
        
        // Organize Sections with Icons
        cleanText = cleanText.replace(/Condition:/gi, "<strong>🏥 Condition:</strong>");
        cleanText = cleanText.replace(/Home Remed/gi, "<br><strong>💊 Home Remedy</strong>");
        cleanText = cleanText.replace(/Do:/g, "<br><strong>✅ Do:</strong>");
        cleanText = cleanText.replace(/Dos:/g, "<br><strong>✅ Do:</strong>");
        cleanText = cleanText.replace(/Avoid:/g, "<br><strong>❌ Avoid:</strong>");
        cleanText = cleanText.replace(/Donts:/g, "<br><strong>❌ Avoid:</strong>");
        
        if (text.includes("CRITICAL") || text.includes("WARNING")) {
            return `<div class="warning-box">${cleanText}</div>`;
        }
        return cleanText;
    };

    return (
        <div className="content-card" style={{ height: 'calc(100vh - 100px)', padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            
            <div className="chatbot-container">
                
                {/* --- HEADER --- */}
                <div className="chat-header">
                    <div className="bot-avatar-circle">
                        🩺
                    </div>
                    <div className="header-info">
                        <h3>Suvera</h3>
                        <p><span className="online-dot"></span> Personal Doc</p>
                    </div>
                </div>

                {/* --- CHAT HISTORY --- */}
                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}-message ${msg.isCritical ? 'critical-msg' : ''}`}>
                            {msg.isHtml ? <div dangerouslySetInnerHTML={{ __html: msg.text }} /> : msg.text}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message bot-message typing-indicator">
                            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                        </div>
                    )}
                </div>

                {/* --- QUICK CHIPS --- */}
                <div className="quick-actions">
                    <div className="chip" onClick={() => handleSend('I have a bad headache')}>🤕 Headache</div>
                    <div className="chip" onClick={() => handleSend('I burned my hand')}>🔥 Burn</div>
                    <div className="chip" onClick={() => handleSend('Stomach pain')}>🤢 Stomach</div>
                    <div className="chip" onClick={() => handleSend('Cold and cough')}>🤧 Flu</div>
                </div>

                {/* --- INPUT AREA --- */}
                <div className="chat-input-area">
                    <input 
                        type="text" 
                        placeholder="Type symptoms here..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn" onClick={() => handleSend()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicalChatbot;