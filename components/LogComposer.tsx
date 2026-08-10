
import React, { useState, useRef, useEffect } from 'react';
import { FoodItem, LogEntry } from '../types';
import { ResultReview } from './ResultReview';

interface Props {
  onLogAdded: (entry: LogEntry) => void;
  selectedDate: string;
  pastItems: Omit<FoodItem, 'id'>[];
}

// Utility to compress image to stay under storage limits (Firestore 1MB, LocalStorage 5MB)
const compressImage = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1024;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64;
  });
};

export const LogComposer: React.FC<Props> = ({ onLogAdded, selectedDate, pastItems }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [draftItems, setDraftItems] = useState<FoodItem[] | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      stopRecording();
    }, 3000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          resetSilenceTimer();
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      recorder.start();
      setIsRecording(true);
      resetSilenceTimer();
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
    if (isRecording) {
      stopRecording();
      return;
    }

    const textToProcess = manualInput !== undefined ? manualInput : input;
    if (!textToProcess.trim() && !image && !audioB64) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/extract-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToProcess,
          imageB64: image || undefined,
          audioB64,
          history: pastItems
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error');
      }

      const data = await response.json();
      setDraftItems(data.items || []);
    } catch (error: any) {
      console.error("Processing error:", error);
      alert(error.message || "Something went wrong analyzing your food.");
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

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-xl border-t border-gray-100 p-5 sm:p-6 z-30 pb-10 sm:pb-12 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
        <div className="max-w-md mx-auto relative">
          {(image || isRecording) && (
            <div className="absolute bottom-full left-0 mb-5 sm:mb-6 flex flex-col gap-3">
              {image && (
                <div className="relative inline-block animate-in slide-in-from-bottom-3 fade-in">
                  <img src={image} className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-3xl border-4 border-white shadow-2xl" alt="Preview" />
                  <button onClick={() => setImage(null)} className="absolute -top-3 -right-3 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-xl">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
              {isRecording && (
                <div className="bg-red-500 text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-pulse">
                  <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
                  <span className="text-xs font-black uppercase tracking-widest">Listening...</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-[40px] px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-100 focus-within:bg-white focus-within:shadow-2xl transition-all">
            <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-emerald-500 p-2 sm:p-3 transition-colors">
              <i className="fa-solid fa-camera text-xl sm:text-2xl"></i>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 sm:p-3 transition-all ${isRecording ? 'text-red-500 scale-125' : 'text-gray-400 hover:text-red-400'}`}
            >
              <i className={`fa-solid ${isRecording ? 'fa-stop-circle' : 'fa-microphone'} text-xl sm:text-2xl`}></i>
            </button>

            <input 
              type="text"
              placeholder="What did you eat?"
              className="flex-1 bg-transparent border-none focus:outline-none py-3 sm:py-4 text-base sm:text-lg font-bold text-gray-700 placeholder:text-gray-300 min-w-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleProcess()}
            />
            
            <button 
              disabled={isProcessing || (!input.trim() && !image && !isRecording)}
              onClick={() => handleProcess()}
              className={`w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
                isProcessing || (!input.trim() && !image && !isRecording) ? 'bg-gray-100 text-gray-300' : 'bg-emerald-500 text-white shadow-xl scale-100 active:scale-90'
              }`}
            >
              {isProcessing ? <i className="fa-solid fa-spinner fa-spin text-lg"></i> : <i className="fa-solid fa-paper-plane text-sm sm:text-base"></i>}
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
