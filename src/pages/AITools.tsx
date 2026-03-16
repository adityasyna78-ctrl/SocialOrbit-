import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Sparkles, 
  Send, 
  Copy, 
  RefreshCw, 
  Check, 
  Bot, 
  User,
  Hash,
  Type,
  Zap,
  History,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Loader2,
  Settings2,
  Layout,
  Smartphone,
  Monitor,
  Key,
  Volume2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'caption' | 'hashtags' | 'hook';
  timestamp: Date;
}

type Tab = 'chat' | 'images' | 'videos';

export default function AITools() {
  const { selectedClient } = useOutletContext<{ selectedClient: any }>();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Video Generation State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');

  // API Key Selection State
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per guidelines
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGenerateText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Brand-trained system instruction
      const clientTone = selectedClient?.tone || 'professional and engaging';
      const clientNiche = selectedClient?.niche || 'general business';
      const systemInstruction = `You are a social media expert for ${selectedClient?.name || 'a client'}. 
      The client is in the ${clientNiche} niche. 
      The brand voice/tone is ${clientTone}. 
      Generate high-converting captions, hashtags, and hooks strictly following this brand voice.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction
        }
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while generating that content. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    if (!hasApiKey) {
      handleOpenSelectKey();
      return;
    }

    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Enhance prompt with brand context
      const enhancedPrompt = `${imagePrompt}. Style: Professional, high-end, suitable for a ${selectedClient?.niche || 'business'} brand.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: enhancedPrompt }] },
        config: {
          imageConfig: {
            aspectRatio: imageAspectRatio,
            imageSize: "1K"
          }
        }
      });

      const newImages: string[] = [];
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          newImages.push(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
      setGeneratedImages(prev => [...newImages, ...prev]);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("Please select your API key again.");
      } else {
        alert("Failed to generate image. Please try again.");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isGeneratingVideo) return;
    if (!hasApiKey) {
      handleOpenSelectKey();
      return;
    }

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);
    setVideoProgress('Initializing generation...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Enhance prompt with brand context
      const enhancedPrompt = `${videoPrompt}. Cinematic quality, professional lighting, for a ${selectedClient?.niche || 'business'} brand.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: enhancedPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: videoAspectRatio
        }
      });

      setVideoProgress('Generating video frames (this may take a few minutes)...');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': process.env.API_KEY! },
        });
        const blob = await response.blob();
        setGeneratedVideo(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("Please select your API key again.");
      } else {
        alert("Failed to generate video. Please try again.");
      }
    } finally {
      setIsGeneratingVideo(false);
      setVideoProgress('');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              AI Creative Studio
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold px-2 py-0.5">
                Brand Trained: {selectedClient?.name}
              </Badge>
              <span className="text-slate-400 text-sm font-medium">| Tone: {selectedClient?.tone || 'Default'}</span>
            </div>
          </div>
        </div>
        {!hasApiKey && (activeTab === 'images' || activeTab === 'videos') && (
          <Button onClick={handleOpenSelectKey} variant="outline" className="border-primary text-primary hover:bg-primary/5">
            <Key className="w-4 h-4 mr-2" /> Select API Key for Advanced AI
          </Button>
        )}
      </header>

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
          {[
            { id: 'chat', label: 'Copywriting', icon: Type },
            { id: 'images', label: 'Image Lab', icon: ImageIcon },
            { id: 'videos', label: 'Video Studio', icon: VideoIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col"
              >
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
                      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                        <Bot className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">How can I help {selectedClient?.name}?</h2>
                        <p className="text-slate-500">I'm currently trained on your client's brand voice: <strong className="text-slate-900">{selectedClient?.tone || 'Professional'}</strong>. What should we create?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {[
                          { label: 'Write a caption', icon: Type, prompt: `Write a professional Instagram caption for ${selectedClient?.name}'s new product launch.` },
                          { label: 'Generate hashtags', icon: Hash, prompt: `Generate 15 trending hashtags for ${selectedClient?.name} in the ${selectedClient?.niche} niche.` },
                          { label: 'Create a hook', icon: Zap, prompt: `Create 5 viral hooks for a TikTok video for ${selectedClient?.name}.` },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={() => setInput(item.prompt)}
                            className="p-4 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                          >
                            <item.icon className="w-5 h-5 text-slate-400 group-hover:text-primary mb-3" />
                            <p className="text-sm font-bold text-slate-900 mb-1">{item.label}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{item.prompt}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === 'assistant' ? 'bg-slate-50/50 -mx-6 px-6 py-8' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                          message.role === 'assistant' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {message.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900">
                              {message.role === 'assistant' ? 'Social Orbit AI' : 'You'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                            {message.content}
                          </div>
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 pt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 px-3 text-xs"
                                onClick={() => copyToClipboard(message.content, message.id)}
                              >
                                {copiedId === message.id ? (
                                  <><Check className="w-3.5 h-3.5 mr-1.5" /> Copied</>
                                ) : (
                                  <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Content</>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex gap-4 bg-slate-50/50 -mx-6 px-6 py-8">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div className="space-y-4 flex-1">
                        <span className="text-sm font-bold text-slate-900">Social Orbit AI</span>
                        <div className="flex gap-1.5 pt-2">
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                  <form onSubmit={handleGenerateText} className="relative max-w-4xl mx-auto">
                    <textarea
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerateText(e);
                        }
                      }}
                      placeholder={`Ask AI to generate content for ${selectedClient?.name}...`}
                      className="w-full bg-white border border-border-light rounded-2xl py-4 pl-5 pr-16 text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'images' && (
              <motion.div 
                key="images"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col p-8 overflow-y-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Image Prompt</label>
                        <textarea
                          rows={4}
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          placeholder={`Describe the image for ${selectedClient?.name}...`}
                          className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700">Aspect Ratio</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: '1:1', icon: Layout, label: 'Square' },
                            { id: '16:9', icon: Monitor, label: 'Landscape' },
                            { id: '9:16', icon: Smartphone, label: 'Portrait' },
                          ].map((ratio) => (
                            <button
                              key={ratio.id}
                              onClick={() => setImageAspectRatio(ratio.id as any)}
                              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                imageAspectRatio === ratio.id 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              <ratio.icon className="w-5 h-5" />
                              <span className="text-[10px] font-bold">{ratio.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={handleGenerateImage} 
                        disabled={isGeneratingImage || !imagePrompt.trim()}
                        className="w-full h-14"
                      >
                        {isGeneratingImage ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><Sparkles className="w-5 h-5 mr-2" /> Generate Image</>
                        )}
                      </Button>
                    </Card>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Brand Context</h4>
                      <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                        <li>• AI will automatically optimize for <strong>{selectedClient?.niche}</strong></li>
                        <li>• Style will be matched to <strong>{selectedClient?.tone}</strong></li>
                        <li>• High-resolution 1K output enabled</li>
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {generatedImages.map((img, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 aspect-square"
                        >
                          <img src={img} alt="Generated" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button size="sm" variant="secondary" onClick={() => {
                              const link = document.createElement('a');
                              link.href = img;
                              link.download = `generated-image-${idx}.png`;
                              link.click();
                            }}>
                              <Download className="w-4 h-4 mr-2" /> Save
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                      {isGeneratingImage && (
                        <div className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                          <Loader2 className="w-10 h-10 animate-spin mb-4" />
                          <p className="text-sm font-bold">Creating your masterpiece...</p>
                        </div>
                      )}
                      {generatedImages.length === 0 && !isGeneratingImage && (
                        <div className="col-span-full py-32 text-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon className="w-10 h-10 text-slate-200" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">No images generated yet</h3>
                          <p className="text-slate-500">Enter a prompt on the left to start creating AI art.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'videos' && (
              <motion.div 
                key="videos"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col p-8 overflow-y-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Video/Reel Prompt</label>
                        <textarea
                          rows={4}
                          value={videoPrompt}
                          onChange={(e) => setVideoPrompt(e.target.value)}
                          placeholder={`Describe the video for ${selectedClient?.name}...`}
                          className="w-full bg-slate-50 border-none rounded-xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700">Format</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: '16:9', icon: Monitor, label: 'Landscape' },
                            { id: '9:16', icon: Smartphone, label: 'Reel/TikTok' },
                          ].map((ratio) => (
                            <button
                              key={ratio.id}
                              onClick={() => setVideoAspectRatio(ratio.id as any)}
                              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                videoAspectRatio === ratio.id 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              <ratio.icon className="w-5 h-5" />
                              <span className="text-[10px] font-bold">{ratio.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={handleGenerateVideo} 
                        disabled={isGeneratingVideo || !videoPrompt.trim()}
                        className="w-full h-14"
                      >
                        {isGeneratingVideo ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><VideoIcon className="w-5 h-5 mr-2" /> Generate Video</>
                        )}
                      </Button>
                    </Card>

                    {isGeneratingVideo && (
                      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          <h4 className="text-sm font-bold text-primary">Generation in Progress</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {videoProgress}
                        </p>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            animate={{ x: [-100, 100] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="h-full w-1/3 bg-primary rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <Card className="aspect-video relative overflow-hidden bg-slate-900 flex items-center justify-center">
                      {generatedVideo ? (
                        <video 
                          src={generatedVideo} 
                          controls 
                          className="w-full h-full object-contain"
                          autoPlay
                          loop
                        />
                      ) : isGeneratingVideo ? (
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                          </div>
                          <p className="text-white font-bold">Creating your video...</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <VideoIcon className="w-10 h-10 text-white/20" />
                          </div>
                          <p className="text-white/40 font-bold">Your generated video will appear here</p>
                        </div>
                      )}
                    </Card>
                    {generatedVideo && (
                      <div className="flex justify-end">
                        <Button onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedVideo;
                          link.download = 'generated-video.mp4';
                          link.click();
                        }}>
                          <Download className="w-4 h-4 mr-2" /> Download Video
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
