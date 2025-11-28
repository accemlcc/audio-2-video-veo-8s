import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, AudioFile } from './types';
import { analyzeAudioForPrompt, generateVeoVideo } from './services/geminiService';
import { Spinner } from './components/Spinner';
import Steps from './components/Steps';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keySelected, setKeySelected] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  // Cleanup blob URL when videoUrl changes or component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Sync audio and video play/pause
  const handleAudioPlay = () => {
    if (videoRef.current) videoRef.current.play();
  };

  const handleAudioPause = () => {
    if (videoRef.current) videoRef.current.pause();
  };

  const checkApiKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setKeySelected(hasKey);
      }
    } catch (e) {
      console.error("Failed to check API key status", e);
    }
  };

  const handleSelectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setKeySelected(true);
      }
    } catch (e) {
      console.error("Failed to select API key", e);
      setError("Failed to select API key. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Size check (limit to 8MB to be safe with base64 and browser limits)
      if (file.size > 8 * 1024 * 1024) {
        setError("File is too large. Please upload an MP3 under 8MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const url = URL.createObjectURL(file);
        setAudioFile({
          name: file.name,
          type: file.type,
          base64,
          url
        });
        setError(null);
        setStatus(AppStatus.ANALYZING);
        performAnalysis(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const performAnalysis = async (base64: string, mimeType: string) => {
    try {
      const prompt = await analyzeAudioForPrompt(base64, mimeType);
      setGeneratedPrompt(prompt);
      setStatus(AppStatus.REVIEW);
    } catch (e) {
      setError("Failed to analyze audio. Please try a different file or check your connection.");
      setStatus(AppStatus.IDLE);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedPrompt) return;
    
    setStatus(AppStatus.GENERATING);
    setError(null);
    
    try {
      const uri = await generateVeoVideo(generatedPrompt);
      setVideoUrl(uri);
      setStatus(AppStatus.COMPLETED);
    } catch (e: any) {
      setError(e.message || "Failed to generate video.");
      setStatus(AppStatus.REVIEW); // Go back to review step
    }
  };

  const handleReset = () => {
    // Note: useEffect handles revoking the current videoUrl blob
    setStatus(AppStatus.IDLE);
    setAudioFile(null);
    setGeneratedPrompt('');
    setVideoUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Sonic Vision
            </h1>
          </div>
          {!keySelected && (
             <button 
               onClick={handleSelectKey}
               className="text-xs font-medium bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-700"
             >
               Connect API Key
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center px-4 py-8 w-full max-w-4xl mx-auto">
        
        {/* API Key Gate */}
        {!keySelected ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center space-y-6 py-20">
            <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 shadow-2xl">
              <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a3 3 0 01-.879.643l-3.751 1.875a1 1 0 01-1.342-1.086l.879-4.39a3 3 0 00-.207-1.562L2.5 9.5A6 6 0 012 8a6 6 0 016-6h.01" />
              </svg>
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-bold mb-2">Get Started with Veo</h2>
              <p className="text-slate-400 mb-6">
                To generate videos, this app requires a paid Google Cloud Project API key enabled for the Veo model.
              </p>
              <button 
                onClick={handleSelectKey}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 mx-auto"
              >
                Select API Key
              </button>
              <p className="mt-4 text-xs text-slate-500">
                Read more about <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-indigo-400">Gemini API Billing</a>
              </p>
            </div>
          </div>
        ) : (
          <>
            <Steps status={status} />

            {/* Error Display */}
            {error && (
              <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-3 animate-fade-in">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              
              {/* STEP 1: UPLOAD */}
              {status === AppStatus.IDLE && (
                <div className="p-10 text-center">
                  <div className="mb-6 relative group cursor-pointer">
                     <input 
                        type="file" 
                        accept="audio/mp3,audio/wav,audio/mpeg"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 group-hover:border-indigo-500/50 group-hover:bg-slate-800/50 transition-all duration-300 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">Drop your MP3 here</h3>
                        <p className="text-slate-500 text-sm">or click to browse (Max 8MB)</p>
                      </div>
                  </div>
                  <p className="text-xs text-slate-500">Supported formats: MP3, WAV</p>
                </div>
              )}

              {/* STEP 2: ANALYZING */}
              {status === AppStatus.ANALYZING && (
                <div className="p-16 flex flex-col items-center text-center">
                  <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-25"></div>
                    <div className="relative bg-slate-800 rounded-full w-full h-full flex items-center justify-center border border-indigo-500/30">
                       <svg className="w-8 h-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Listening & Dreaming...</h3>
                  <p className="text-slate-400 max-w-xs">Gemini 2.5 is analyzing the audio vibe to create a visual description.</p>
                </div>
              )}

              {/* STEP 3: REVIEW PROMPT */}
              {status === AppStatus.REVIEW && audioFile && (
                <div className="p-6 md:p-8">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">Review Visual Concept</h3>
                      <audio controls src={audioFile.url} className="h-8 w-48" />
                   </div>
                   
                   <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-400">
                        Generated Prompt for Veo
                        <span className="block text-xs font-normal text-slate-500 mt-1">
                          Gemini analyzed your audio and wrote this. You can edit it before generating.
                        </span>
                      </label>
                      <textarea 
                        value={generatedPrompt}
                        onChange={(e) => setGeneratedPrompt(e.target.value)}
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm leading-relaxed resize-none"
                      />
                   </div>

                   <div className="mt-8 flex justify-end gap-3">
                      <button 
                        onClick={handleReset}
                        className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleGenerateVideo}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Generate Video
                      </button>
                   </div>
                </div>
              )}

              {/* STEP 4: GENERATING VIDEO */}
              {status === AppStatus.GENERATING && (
                <div className="p-16 flex flex-col items-center text-center">
                  <Spinner className="w-12 h-12 text-indigo-500 mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">Generating Video</h3>
                  <p className="text-slate-400 max-w-sm mb-4">
                    Veo is rendering your scene. This usually takes about 1-2 minutes. Please don't close this tab.
                  </p>
                  <div className="w-full max-w-xs bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 animate-progress-indeterminate w-1/2 rounded-full"></div>
                  </div>
                  <style>{`
                    @keyframes progress-indeterminate {
                      0% { margin-left: -50%; }
                      100% { margin-left: 150%; }
                    }
                    .animate-progress-indeterminate {
                      animation: progress-indeterminate 2s infinite linear;
                    }
                  `}</style>
                </div>
              )}

              {/* STEP 5: COMPLETED */}
              {status === AppStatus.COMPLETED && videoUrl && audioFile && (
                <div className="p-6 md:p-8 flex flex-col items-center">
                  <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-slate-800 mb-4 relative group">
                    {/* Video loops and is muted to act as visualizer for the audio */}
                    <video 
                      ref={videoRef}
                      src={videoUrl} 
                      muted
                      loop
                      autoPlay 
                      className="w-full h-full object-contain" 
                    />
                  </div>

                  {/* Original Audio Player */}
                  <div className="w-full bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 mb-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 10l12-3" />
                        </svg>
                        {audioFile.name}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded">Audio + Video Loop</span>
                    </div>
                    <audio 
                      ref={audioRef}
                      src={audioFile.url} 
                      controls 
                      className="w-full h-8"
                      onPlay={handleAudioPlay}
                      onPause={handleAudioPause}
                    />
                  </div>

                  <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 bg-slate-900/30 p-2 rounded max-w-md">
                      <strong>Note:</strong> Veo generates short cinematic previews (~8s). We loop this video to accompany your full {audioFile.name} track.
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={handleReset}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Create Another
                      </button>
                      <a 
                        href={videoUrl} 
                        download="sonic-vision-loop.mp4"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-colors flex items-center gap-2"
                      >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Video
                      </a>
                    </div>
                  </div>
                </div>
              )}

            </div>
            
            <div className="mt-8 text-center">
               <p className="text-xs text-slate-600">
                 Powered by <span className="text-slate-400">Gemini 2.5 Flash</span> & <span className="text-slate-400">Veo 3.1</span>. 
                 Experimental AI Demo.
               </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;