import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  User, 
  HelpCircle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { translations } from '../data/translations';
import { CROPS } from '../data/cropsData';

export default function AIAssistant({ activeField, currentLang, audioEnabled }) {
  const t = translations[currentLang] || translations.en;
  
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: currentLang === 'mr'
        ? `नमस्कार! मी आपला SQUADX कृषी मित्र आहे. आपल्या ${activeField.name} शेतातील मातीचा प्रकार (${activeField.soilType}) आणि सद्य पीक (${activeField.currentCrop}) लक्षात घेऊन मी पीक फेरपालट, खत नियोजन आणि हवामान धोक्यावर मार्गदर्शन करू शकतो. आपण बोलून किंवा लिहून प्रश्न विचारू शकता!`
        : currentLang === 'hi'
        ? `नमस्ते! मैं SQUADX का नियम-आधारित फसल मार्गदर्शक हूँ। यहाँ मिट्टी और फसल की जानकारी उदाहरण हो सकती है; सलाह सामान्य है, खेत की जांच नहीं।`
        : `Hello! I am your SQUADX crop guide. I provide preset rule-based guidance for ${activeField.name}; soil and crop details may be demo data. Ask via voice or text!`
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set recognition language
      if (currentLang === 'mr') recognition.lang = 'mr-IN';
      else if (currentLang === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.warn('Speech recognition error', e);
        setIsListening(false);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          handleSendQuery(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [currentLang]);

  // Handle Speech Synthesis
  const speakText = (text) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    if (currentLang === 'mr') utterance.lang = 'mr-IN';
    else if (currentLang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendQuery = (customText) => {
    const query = (customText || inputQuery).trim();
    if (!query) return;

    // Add user message
    const userMsg = { sender: 'user', text: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');

    // Generate intelligent agronomy response
    setTimeout(() => {
      const reply = generateAgronomyReply(query, activeField, currentLang);
      setMessages([...newMessages, { sender: 'ai', text: reply }]);
      speakText(reply);
    }, 600);
  };

  function generateAgronomyReply(q, field, lang) {
    const lower = q.toLowerCase();

    // Check for Marathi queries
    if (lang === 'mr' || lower.includes('मका') || lower.includes('सोयाबीन') || lower.includes('हरभरा') || lower.includes('पीक')) {
      if (lower.includes('मका') || lower.includes('काढणीनंतर') || lower.includes('नंतर')) {
        return `मक्याच्या काढणीनंतर आपल्या ${field.soilType} जमिनीसाठी 'सोयाबीन' किंवा 'हरभरा' हे सर्वात फायदेशीर पीक ठरेल. मक्याने जमिनीतील नायट्रोजन मोठ्या प्रमाणावर शोषून घेतलेला असतो. हरभरा किंवा सोयाबीन लागवड केल्यास ते वातावरणातील ४० ते ५५ किलो नैसर्गिक नत्र जमिनीत साठवून पुढील हंगामासाठी खताचा खर्च ३५% वाचवते.`;
      }
      if (lower.includes('पाणी') || lower.includes('सिंचन')) {
        return `या सहाय्यकामध्ये तुमच्या शेताची सिंचन व्यवस्था किंवा प्रत्यक्ष मातीतील ओलावा मोजलेला नाही. पीक व सिंचनाचा निर्णय स्थानिक पाऊस, मातीची चाचणी आणि पीक अवस्थेनुसार घ्या.`;
      }
      return `आपल्या ${field.name} साठी माती चाचणी किंवा लाईव्ह NDVI डेटा या सहाय्यकामध्ये जोडलेला नाही. पीक फेरपालटीबद्दल सामान्य माहिती देऊ शकतो; खतांचा निर्णय स्थानिक माती चाचणीवर घ्या.`;
    }

    // Check for Hindi queries
    if (lang === 'hi' || lower.includes('फसल') || lower.includes('गेहूं') || lower.includes('खाद') || lower.includes('पानी')) {
      if (lower.includes('गेहूं') || lower.includes('बाद')) {
        return `गेहूं की कटाई के बाद 60 दिन की अल्पकालिक 'मूंग' (ग्रीष्मकालीन) सबसे उत्तम विकल्प है। यह खेत में 35-40 किलो जैविक नाइट्रोजन जोड़ती है, जिससे अगली खरीफ फसल में यूरिया की आवश्यकता 40% कम हो जाती है।`;
      }
      if (lower.includes('पानी') || lower.includes('सिंचाई')) {
        return `इस सहायक में खेत की मिट्टी की नमी या सिंचाई का माप उपलब्ध नहीं है। फसल और सिंचाई का निर्णय स्थानीय वर्षा, मिट्टी की जांच और फसल अवस्था के आधार पर लें।`;
      }
      return `इस सहायक में ${field.name} के लिए लाइव NDVI या मिट्टी जांच का डेटा जुड़ा नहीं है। फसल चक्र की जानकारी सामान्य है; उर्वरक निर्णय के लिए स्थानीय मिट्टी जांच कराएं।`;
    }

    // Default English response
    if (lower.includes('rotation') || lower.includes('after') || lower.includes('next crop')) {
      return `Based on ${field.name}'s ${field.soilType} and current ${field.currentCrop} harvest: We strongly recommend rotating into a legume like Soybean or Chickpea. This fixes 50+ kg N/ha into your soil, breaking pest cycles and reducing chemical urea expenses by up to ₹3,500/acre.`;
    }
    if (lower.includes('water') || lower.includes('irrigation') || lower.includes('drought')) {
      return `NASA POWER का हाल का ऐतिहासिक मौसम डेटा पूर्वानुमान नहीं है, और यह सहायक खेत का सूखा माप नहीं करता। सिंचाई या बुवाई का निर्णय स्थानीय वर्षा, मिट्टी की नमी और फसल अवस्था देखकर लें।`;
    }
    if (lower.includes('soil') || lower.includes('fertilizer') || lower.includes('carbon')) {
      return `This assistant does not have a verified soil test for ${field.name}. Soil and fertilizer advice here is general; use a local laboratory report for field-specific recommendations.`;
    }

    return `For ${field.name}, this assistant does not have verified soil-test or live NDVI results. Its crop-rotation guidance is rule-based and general; confirm crop choices with local agronomic advice and field data.`;
  }

  // Quick prompt chips
  const starterPrompts = currentLang === 'mr' ? [
    "मक्या नंतर कोणतं पीक घ्यावं?",
    "कमी पाण्यात जास्त नफा देणारे पीक कोणते?",
    "मातीची सुपीकता कशी सुधारावी?",
    "खताचा खर्च ४०% कसा वाचवावा?"
  ] : currentLang === 'hi' ? [
    "गेहूं के बाद कौन सी दाल लगाएं?",
    "कम पानी में सबसे अच्छी फसल कौन सी है?",
    "मिट्टी की उर्वरता कैसे बढ़ाएं?",
    "नासा उपग्रह डेटा से कैसे लाभ लें?"
  ] : [
    "What should I plant after Maize?",
    "How to reduce chemical fertilizer by 40%?",
    "Which crop has lowest water requirement?",
    "How to improve field soil recovery score?"
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bot className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              {t.aiAdvisor} — Voice & Multilingual Agronomist
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Prewritten rule-based guidance (not a connected AI model); soil, price, and field details may be examples. Voice input and speech output depend on browser support.
          </p>
        </div>

        {/* Voice status badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? t.listening : 'Speak Voice Input'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Chat Window */}
      <div className="glass-panel-glow rounded-2xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
        {/* Chat Messages Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={idx}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-xl p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-md' 
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner'
                }`}>
                  <p>{msg.text}</p>

                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>SQUADX Field Intelligence</span>
                      <button 
                        onClick={() => speakText(msg.text)}
                        className="hover:text-emerald-400 flex items-center gap-1"
                        title="Listen to response"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Suggested:
          </span>
          {starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(prompt)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Voice Input"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder={isListening ? t.listening : t.askAssistant}
            className="flex-1 bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-500"
          />

          <button
            onClick={() => handleSendQuery()}
            disabled={!inputQuery.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
