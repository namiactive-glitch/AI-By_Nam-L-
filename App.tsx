import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clapperboard, Sparkles, User, Type, Palette, Check, FileText, MessageCircle, Clock, Mic, Users, RotateCcw, MessageSquare, ArrowLeft, MapPin, Upload, Wand2, Loader2, PlusCircle, MinusCircle, ScanEye, Shirt, LogOut } from 'lucide-react';
import CharacterInput from './components/CharacterInput';
import ResultDisplay from './components/ResultDisplay';
import { TextToSpeech } from './components/TextToSpeech';
import { VisionScanner } from './components/VisionScanner';
import { VirtualTryOn } from './components/VirtualTryOn';
import { Login } from './components/Login';
import { Character, GeneratedData, Theme, StyleOption, ScriptTone } from './types';
import { generateScriptAndPrompts, suggestTopic } from './services/geminiService';

const themes: Theme[] = [
  { id: 'family_life', label: 'Chuyện Gia đình', icon: '🏠' },
  { id: 'parenting', label: 'Nuôi dạy Con cái', icon: '👶' },
  { id: 'spouses', label: 'Vợ chồng Hài hước', icon: '👩‍❤️‍👨' },
  { id: 'health_tips', label: 'Lời khuyên Sức khỏe', icon: '❤️' },
  { id: 'body_parts', label: 'Các bộ phận cơ thể lên tiếng', icon: '🧠' },
  { id: 'vegetables', label: 'Rau củ quả tranh luận', icon: '🥦' },
  { id: 'fitness', label: 'Thử thách thể dục', icon: '💪' },
  { id: 'custom', label: 'Chủ đề tùy chọn...', icon: '✨' },
];

const styles: StyleOption[] = [
  { id: 'realistic', label: 'Chân thật (Cinematic)', desc: 'Ánh sáng tự nhiên, da người thật, quay phim điện ảnh', color: 'from-orange-400 to-amber-600' },
  { id: '3d_animation', label: 'Hoạt hình 3D', desc: 'Phong cách Pixar/Disney, dễ thương, màu sắc rực rỡ', color: 'from-amber-400 to-orange-500' },
  { id: 'mixed', label: 'Kết hợp (Mixed)', desc: 'Tùy chỉnh riêng cho từng nhân vật', color: 'from-orange-500 to-red-500' },
];

const tones: ScriptTone[] = [
  { id: 'casual', label: 'Đời thường', desc: 'Gần gũi, tự nhiên', instruction: 'Sử dụng ngôn ngữ hàng ngày, xưng hô gần gũi (cậu/tớ, anh/em), câu từ ngắn gọn.' },
  { id: 'funny', label: 'Hài hước / Tếu táo', desc: 'Vui nhộn, gây cười', instruction: 'Sử dụng từ ngữ hài hước, chơi chữ, xưng hô tếu táo, tình huống gây cười.' },
  { id: 'polite', label: 'Lịch sự / Giáo dục', desc: 'Trang trọng, tôn trọng', instruction: 'Ngôn ngữ chuẩn mực, lịch sự, xưng hô tôn trọng, phù hợp nội dung giáo dục.' },
  { id: 'drama', label: 'Kịch tính / Cảm xúc', desc: 'Gay cấn, sâu sắc', instruction: 'Ngôn ngữ giàu cảm xúc, câu từ mạnh mẽ, xưng hô thể hiện rõ mối quan hệ sâu sắc.' },
  { id: 'angry', label: 'Tức giận / Phẫn nộ', desc: 'Bức xúc, gay gắt', instruction: 'Ngôn ngữ thể hiện sự tức giận, bức xúc cao độ. Câu thoại ngắn, dồn dập.' },
  { id: 'inspiring', label: 'Lạc quan / Truyền cảm hứng', desc: 'Tích cực, đầy hy vọng', instruction: 'Sử dụng từ ngữ mạnh mẽ, khích lệ, nhịp điệu hào hứng, kết thúc bằng một thông điệp ý nghĩa.' },
  { id: 'anxious', label: 'Sợ hãi / Lo lắng', desc: 'Bồn chồn, bất an', instruction: 'Câu thoại ngắt quãng, lặp từ, thể hiện sự hoảng loạn hoặc lo âu trong từng câu chữ.' },
  { id: 'sarcastic', label: 'Mỉa mai / Châm chọc', desc: 'Sắc sảo, hài hước đen', instruction: 'Dùng lối nói ngược, khen chê khéo léo, giọng điệu sắc sảo và mang tính giễu cợt.' },
  { id: 'mysterious', label: 'Bí ẩn / Nguy hiểm', desc: 'Trầm lắng, khó đoán', instruction: 'Lời thoại ngắn gọn, ẩn ý, tạo cảm giác tò mò và hồi hộp cho người xem.' },
];

const durations = [
  { value: '15', label: '15s (Shorts)' },
  { value: '30', label: '30s (TikTok)' },
  { value: '60', label: '60s (Story)' },
];

const pronounOptions = [
  { id: 'default', label: 'Tự động (Theo Tone)' },
  { id: 'tao_may', label: 'Tao - Mày' },
  { id: 'toi_co', label: 'Tôi - Cô / Tôi - Cậu' },
  { id: 'anh_em', label: 'Anh - Em' },
  { id: 'vo_chong', label: 'Vợ - Chồng' },
  { id: 'bo_con', label: 'Bố - Con / Mẹ - Con' },
  { id: 'custom', label: 'Tùy chỉnh...' },
];

const createEmptyCharacter = (index: number): Character => ({
  name: '', role: '', description: '', image: null,
  voiceGender: index % 2 === 0 ? 'Nam' : 'Nữ', voiceAge: '', voiceRegion: 'Miền Bắc', voiceType: 'Kể chuyện'
});

const App = () => {
  const [activeModule, setActiveModule] = useState<'script' | 'tts' | 'vision' | 'tryon'>('script');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);

  const [charA, setCharA] = useState<Character>(createEmptyCharacter(0));
  const [charB, setCharB] = useState<Character>(createEmptyCharacter(1));
  const [charC, setCharC] = useState<Character>(createEmptyCharacter(2));
  const [charD, setCharD] = useState<Character>(createEmptyCharacter(3));
  
  const [activeCharsCount, setActiveCharsCount] = useState(2);

  const [generalContext, setGeneralContext] = useState('');
  const [theme, setTheme] = useState('family_life');
  const [customTheme, setCustomTheme] = useState('');
  const [customScript, setCustomScript] = useState('');
  
  const [style, setStyle] = useState('3d_animation');
  const [characterStyles, setCharacterStyles] = useState<Record<string, string>>({});

  const [scriptTone, setScriptTone] = useState<ScriptTone>(tones[0]);
  const [duration, setDuration] = useState('30');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [dialogueMode, setDialogueMode] = useState('both');
  
  const [pronounStyle, setPronounStyle] = useState('default');
  const [customPronoun, setCustomPronoun] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn làm mới toàn bộ? Mọi dữ liệu sẽ bị xóa và trang web sẽ được tải lại.")) {
      window.location.reload();
    }
  };

  const handleBack = () => {
    setGeneratedData(null);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    if (activeModule === 'script' || activeModule === 'tryon') {
      setActiveModule('tts'); // Switch to a public module on logout if currently on a protected one
    }
  };

  const isProtectedModule = activeModule === 'script' || activeModule === 'tryon';

  const getActiveCharacters = () => {
    const list = [charA];
    if (activeCharsCount >= 2) list.push(charB);
    if (activeCharsCount >= 3) list.push(charC);
    if (activeCharsCount >= 4) list.push(charD);
    return list;
  };

  const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.generatedData && json.inputs) {
            setGeneratedData(json.generatedData);
            const i = json.inputs;
            if (i.characters) {
              setCharA(i.characters[0] || createEmptyCharacter(0));
              setCharB(i.characters[1] || createEmptyCharacter(1));
              setCharC(i.characters[2] || createEmptyCharacter(2));
              setCharD(i.characters[3] || createEmptyCharacter(3));
              setActiveCharsCount(i.characters.length);
            }
            if (i.generalContext) setGeneralContext(i.generalContext);
            if (i.theme) setTheme(i.theme);
            if (i.customTheme) setCustomTheme(i.customTheme);
            if (i.customScript) setCustomScript(i.customScript);
            if (i.styleId) setStyle(i.styleId);
            if (i.characterStyles) setCharacterStyles(i.characterStyles);
            if (i.scriptTone) {
               const foundTone = tones.find(t => t.id === i.scriptTone.id) || i.scriptTone;
               setScriptTone(foundTone);
            }
            if (i.duration) {
              setDuration(i.duration);
              setIsCustomDuration(!durations.some(d => d.value === i.duration));
            }
            if (i.pronounStyle) setPronounStyle(i.pronounStyle);
            if (i.customPronoun) setCustomPronoun(i.customPronoun);
            return;
        }
        alert("File JSON không tương thích.");
      } catch (err) {
        alert("Có lỗi khi đọc file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSuggestSubTopic = async (parentThemeLabel: string) => {
    setIsSuggesting(true);
    try {
      const suggestion = await suggestTopic(parentThemeLabel, getActiveCharacters());
      setCustomTheme(suggestion);
    } catch (error) {
      alert("Không thể gợi ý lúc này.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedData(null);

    try {
      const selectedThemeObj = themes.find(t => t.id === theme);
      const parentLabel = selectedThemeObj?.label || 'General';
      let efficientTheme = theme === 'custom' ? customTheme : (customTheme ? `${parentLabel}: ${customTheme}` : parentLabel);

      const durationArg = customScript.trim() ? "Theo độ dài kịch bản" : `${duration} giây`;
      let selectedPronoun = pronounStyle === 'custom' ? customPronoun : (pronounStyle !== 'default' ? pronounOptions.find(p => p.id === pronounStyle)?.label || '' : '');

      const activeChars = getActiveCharacters();
      const data = await generateScriptAndPrompts(
        activeChars, 
        efficientTheme, 
        style, 
        scriptTone, 
        customScript, 
        durationArg,
        dialogueMode,
        selectedPronoun,
        generalContext,
        characterStyles
      );
      setGeneratedData(data);
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo kịch bản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-orange-600 to-amber-600 text-white p-2 rounded-lg">
              <Clapperboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">
                NAM LÊ AI
              </h1>
              <p className="text-xs text-slate-500">098.102.8794</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveModule('script')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeModule === 'script' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Clapperboard size={16} /> AI Nhân Hóa
            </button>
            <button 
              onClick={() => setActiveModule('tts')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeModule === 'tts' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mic size={16} /> Giọng Đọc AI
            </button>
            <button 
              onClick={() => setActiveModule('vision')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeModule === 'vision' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ScanEye size={16} /> Lấy chữ từ ảnh
            </button>
            <button 
              onClick={() => setActiveModule('tryon')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeModule === 'tryon' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Shirt size={16} /> Mặc đồ với AI
            </button>
          </div>

          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleJsonUpload} accept=".json" className="hidden" />
            {!generatedData && (
               <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2">
                 <Upload size={16} /> Mở Project
               </button>
            )}
            {generatedData && (
              <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2">
                <ArrowLeft size={16} /> Quay lại
              </button>
            )}
            <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
              <RotateCcw size={16} /> Tạo mới
            </button>
            {isLoggedIn && (
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2 border border-orange-100">
                <LogOut size={16} /> Đăng xuất
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-grow w-full">
        <AnimatePresence mode="wait">
          {isProtectedModule && !isLoggedIn ? (
            <motion.div
              key="login-module"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Login onLogin={handleLogin} />
            </motion.div>
          ) : activeModule === 'tryon' ? (
            <motion.div
              key="tryon-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VirtualTryOn />
            </motion.div>
          ) : activeModule === 'vision' ? (
            <motion.div
              key="vision-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VisionScanner />
            </motion.div>
          ) : activeModule === 'tts' ? (
            <motion.div
              key="tts-module"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TextToSpeech />
            </motion.div>
          ) : !generatedData ? (
            <motion.div
              key="script-module"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <User className="text-orange-600" />
                  1. Thiết lập Nhân vật (Tối đa 4)
                </h2>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setActiveCharsCount(Math.max(1, activeCharsCount - 1))}
                    disabled={activeCharsCount <= 1}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 disabled:opacity-30"
                  >
                    <MinusCircle size={20} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{activeCharsCount}</span>
                  <button 
                    onClick={() => setActiveCharsCount(Math.min(4, activeCharsCount + 1))}
                    disabled={activeCharsCount >= 4}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 disabled:opacity-30"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <CharacterInput label="Nhân vật A" tagLabel="Chính diện" tagColorClass="bg-orange-50" borderColorClass="focus:ring-orange-500" ringColorClass="focus:ring-orange-500" character={charA} styleId={style === 'mixed' ? (characterStyles[charA.name] || 'realistic') : style} onChange={setCharA} />
                {activeCharsCount >= 2 && <CharacterInput label="Nhân vật B" tagLabel="Phụ/Đối trọng" tagColorClass="bg-amber-50" borderColorClass="focus:ring-amber-500" ringColorClass="focus:ring-amber-500" character={charB} styleId={style === 'mixed' ? (characterStyles[charB.name] || '3d_animation') : style} onChange={setCharB} optional={true} />}
                {activeCharsCount >= 3 && <CharacterInput label="Nhân vật C" tagLabel="Phụ" tagColorClass="bg-orange-100" borderColorClass="focus:ring-orange-400" ringColorClass="focus:ring-orange-400" character={charC} styleId={style === 'mixed' ? (characterStyles[charC.name] || '3d_animation') : style} onChange={setCharC} optional={true} />}
                {activeCharsCount >= 4 && <CharacterInput label="Nhân vật D" tagLabel="Phụ" tagColorClass="bg-amber-100" borderColorClass="focus:ring-amber-400" ringColorClass="focus:ring-amber-400" character={charD} styleId={style === 'mixed' ? (characterStyles[charD.name] || '3d_animation') : style} onChange={setCharD} optional={true} />}
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Type className="text-orange-600" />
                  2. Chọn Chủ đề / Kịch bản
                </h2>
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={18} className="text-orange-600" />
                      <label className="text-sm font-bold text-slate-700">Bối cảnh chung</label>
                    </div>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-slate-50" placeholder="VD: Văn phòng hiện đại, Khu vườn cổ tích..." value={generalContext} onChange={(e) => setGeneralContext(e.target.value)} />
                  </div>
                  <div className={`bg-white p-5 rounded-xl border ${customScript ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={18} className="text-orange-600" />
                      <label className="text-sm font-bold text-slate-700">Kịch bản chi tiết (Tùy chọn)</label>
                    </div>
                    <textarea className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm min-h-[120px]" placeholder="Nhập kịch bản có sẵn..." value={customScript} onChange={(e) => setCustomScript(e.target.value)} />
                  </div>
                  {!customScript && (
                    <div className="grid grid-cols-1 gap-3">
                      {themes.map((t) => (
                        <div key={t.id} className={`rounded-xl border transition-all ${theme === t.id ? 'border-orange-600 bg-orange-50 ring-1 ring-orange-600' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <button onClick={() => { setTheme(t.id); setCustomTheme(''); }} className="w-full flex items-center gap-3 p-4 text-left">
                            <span className="text-2xl">{t.icon}</span>
                            <span className="font-medium text-slate-700">{t.label}</span>
                          </button>
                          {theme === t.id && (
                            <div className="px-4 pb-4 animate-fadeIn">
                               <div className="relative flex gap-2">
                                  <input type="text" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} placeholder="Chi tiết chủ đề..." className="w-full p-3 pr-10 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white" />
                                  <button onClick={() => handleSuggestSubTopic(t.label)} disabled={isSuggesting} className="absolute right-1 top-1 bottom-1 px-3 bg-orange-100 text-orange-700 rounded-md font-bold text-xs">
                                    {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                  </button>
                               </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {!customScript && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-orange-600" />
                        <label className="text-sm font-bold text-slate-700">Thời lượng</label>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {durations.map((d) => (
                          <button key={d.value} onClick={() => { setDuration(d.value); setIsCustomDuration(false); }} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${!isCustomDuration && duration === d.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>{d.label}</button>
                        ))}
                        <button onClick={() => setIsCustomDuration(true)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${isCustomDuration ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>Tùy chỉnh</button>
                      </div>
                      {isCustomDuration && (
                        <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-3 mt-3 border border-orange-300 rounded-lg outline-none font-bold" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Palette className="text-orange-600" />
                  3. Visual & Tone
                </h2>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {styles.map((s) => (
                    <div key={s.id} onClick={() => setStyle(s.id)} className={`relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all group ${style === s.id ? 'border-transparent ring-2 ring-orange-500' : 'border-slate-200'}`}>
                      <div className="p-5 relative z-10">
                        <h3 className="font-bold text-lg text-slate-800">{s.label}</h3>
                        <p className="text-sm text-slate-600">{s.desc}</p>
                      </div>
                      <div className={`h-1.5 w-full bg-gradient-to-r ${s.color} mt-auto`}></div>
                    </div>
                  ))}
                </div>

                {style === 'mixed' && (
                  <div className="mb-8 p-5 bg-orange-50 border border-orange-200 rounded-xl">
                    <h4 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2"><Sparkles size={16} /> Phong cách từng nhân vật</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {getActiveCharacters().map(char => (
                        <div key={char.name || Math.random()}>
                          <label className="block text-xs font-bold text-slate-500 mb-1">{char.name || 'N/A'}</label>
                          <select 
                            value={characterStyles[char.name] || '3d_animation'}
                            onChange={(e) => setCharacterStyles({...characterStyles, [char.name]: e.target.value})}
                            className="w-full p-2 bg-white border border-orange-300 rounded-lg text-sm"
                          >
                            <option value="realistic">Người thật</option>
                            <option value="3d_animation">Hoạt hình 3D</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3"><MessageCircle size={16} className="inline mr-2"/> Cảm xúc lời thoại</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {tones.map((t) => (
                        <button key={t.id} onClick={() => setScriptTone(t)} className={`p-3 rounded-xl border text-left text-sm ${scriptTone.id === t.id ? 'border-orange-600 bg-orange-50 font-semibold' : 'border-slate-200 text-slate-600'}`}>
                          <span>{t.label}</span>
                          <p className="text-xs opacity-70 font-normal">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-3"><MessageSquare size={16} className="inline mr-2"/> Cách xưng hô</h3>
                    <div className="flex flex-wrap gap-2">
                      {pronounOptions.map((opt) => (
                        <button key={opt.id} onClick={() => setPronounStyle(opt.id)} className={`px-3 py-2 rounded-lg text-sm border ${pronounStyle === opt.id ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold' : 'bg-white border-slate-200'}`}>{opt.label}</button>
                      ))}
                    </div>
                    {pronounStyle === 'custom' && (
                      <input type="text" placeholder="VD: Đại ca - Đệ tử..." className="w-full p-2.5 mt-3 border border-orange-300 rounded-lg text-sm" value={customPronoun} onChange={(e) => setCustomPronoun(e.target.value)} />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-center pt-8 pb-12">
              <button onClick={handleGenerate} disabled={loading || !charA.name} className={`rounded-full px-12 py-4 font-bold text-white text-lg shadow-xl transition-all ${loading || !charA.name ? 'bg-slate-300' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-105'}`}>
                {loading ? "Đang xử lý..." : "Tạo Kịch bản & Prompt"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result-module"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <ResultDisplay 
            data={generatedData} 
            characters={getActiveCharacters()} 
            styleId={style}
            characterStyles={characterStyles}
            projectInputs={{ theme, customTheme, customScript, scriptTone, duration, dialogueMode, pronounStyle, customPronoun, generalContext }}
            onReset={handleReset} 
            onBack={handleBack}
          />
        </motion.div>
        )}
      </AnimatePresence>
    </main>
      <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-200 mt-auto bg-slate-50 no-print">@by Nam Lê AI - 098.102.8794</footer>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeInSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; } .animate-fadeInSlideUp { animation: fadeInSlideUp 0.6s ease-out forwards; }`}</style>
    </div>
  );
};

export default App;