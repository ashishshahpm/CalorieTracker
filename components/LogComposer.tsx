import React, { useState, useRef, useEffect } from 'react';
import { extractNutrition } from '../geminiService';
import { FoodItem, LogEntry } from '../types';
import { ResultReview } from './ResultReview';

interface Props {
  onLogAdded: (entry: LogEntry) => void;
  selectedDate: string;
}

export const LogComposer: React.FC<Props> = ({ onLogAdded, selectedDate }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [draftItems, setDraftItems] = useState<FoodItem[] | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Refs for Speech Recognition and Silence Detection
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      console.log("[Mic] Auto-stopping due to 3s silence");
      stopRecording();
    }, 3000); // Updated to 3 seconds per request
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 1. Setup Audio Recording (for Gemini)
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          handleProcess(undefined, reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      // 2. Setup Real-time Speech-to-Text
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
          resetSilenceTimer(); // Reset timer whenever actual speech is detected
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          console.log("[Mic] Recognition ended");
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      recorder.start();
      setIsRecording(true);
      resetSilenceTimer(); // Initial timer start
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Microphone access is needed for voice logging.");
    }
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcess = async (manualInput?: string, audioB64?: string) => {
    // If we are currently recording and the user clicked "Send", stop recording first.
    // The onstop handler will eventually call handleProcess again with the audio data.
    if (isRecording) {
      stopRecording();
      return;
    }

    const textToProcess = manualInput !== undefined ? manualInput : input;
    if (!textToProcess.trim() && !image && !audioB64) return;
    
    setIsProcessing(true);
    try {
      const results = await extractNutrition(textToProcess, image || undefined, audioB64);
      setDraftItems(results);
    } catch (error) {
      console.error("Processing error:", error);
      alert("Something went wrong analyzing your food.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = (finalItems: FoodItem[]) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      date: selectedDate,
      items: finalItems,
      image: image || undefined,
      transcript: input || "[Voice entry]"
    };
    
    onLogAdded(newEntry);
    setDraftItems(null);
    setInput('');
    setImage(null);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 p-5 z-30 pb-10">
        <div className="max-w-md mx-auto relative">
          {(image || isRecording) && (
            <div className="absolute bottom-full left-0 mb-4 flex flex-col gap-2">
              {image && (
                <div className="relative inline-block animate-in slide-in-from-bottom-2 fade-in">
                  <img src={image} className="h-20 w-20 object-cover rounded-2xl border-4 border-white shadow-xl" alt="Preview" />
                  <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] shadow-lg">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
              {isRecording && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Listening...</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 bg-gray-50 rounded-[32px] px-4 py-1.5 border border-gray-100 focus-within:bg-white focus-within:shadow-xl transition-all">
            <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-emerald-500 p-2">
              <i className="fa-solid fa-camera text-xl"></i>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 transition-all ${isRecording ? 'text-red-500 scale-125' : 'text-gray-400 hover:text-red-400'}`}
            >
              <i className={`fa-solid ${isRecording ? 'fa-stop-circle' : 'fa-microphone'} text-xl`}></i>
            </button>

            <input 
              type="text"
              placeholder="What did you eat?"
              className="flex-1 bg-transparent border-none focus:outline-none py-3 text-sm font-semibold text-gray-700 placeholder:text-gray-300"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleProcess()}
            />
            
            <button 
              disabled={isProcessing || (!input.trim() && !image && !isRecording)}
              onClick={() => handleProcess()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isProcessing || (!input.trim() && !image && !isRecording) ? 'bg-gray-100 text-gray-300' : 'bg-emerald-500 text-white shadow-lg'
              }`}
            >
              {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane text-xs"></i>}
            </button>
          </div>
        </div>
      </div>

      {draftItems && (
        <ResultReview items={draftItems} onCancel={() => setDraftItems(null)} onConfirm={handleCommit} />
      )}
    </>
  );
};