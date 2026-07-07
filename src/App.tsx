/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Settings, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  Lightbulb, 
  Layout, 
  Copy, 
  Share2, 
  Download,
  AlertCircle,
  FileText,
  Video,
  List,
  Table,
  Target,
  Megaphone,
  User,
  ExternalLink,
  ChevronRight,
  Plus,
  Loader2,
  RefreshCw,
  Rocket,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './lib/utils';

// --- Constants & Types ---

type Complexity = 'cơ bản' | 'nâng cao';
type Mode = 'viết nhanh' | 'đánh giá' | 'gợi ý';

const CHANNELS = ['Facebook', 'Instagram', 'Youtube', 'TikTok', 'Reels', 'PR (báo chí)', 'Website/Blog', 'Zalo', 'Twitter', 'Threads'];
const GOALS = [
  'Tăng nhận diện thương hiệu', 
  'Ra mắt sản phẩm mới', 
  'Educate thị trường', 
  'Tăng Traffic', 
  'Thu thập khách hàng tiềm năng', 
  'Xây dựng cộng đồng', 
  'Tăng tương tác', 
  'Tạo sự đồng cảm', 
  'Bán hàng trực tiếp', 
  'Tuyển dụng', 
  'Tuyên bố giá trị', 
  'Viral'
];
const OUTPUT_TYPES = ['Bài viết', 'Kịch bản video', 'Ý tưởng', 'Dàn ý', 'Brief ảnh', 'Email Marketing', 'Landing Page'];

// --- Components ---

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const Chip = ({ label, selected, onClick, icon }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all duration-300 flex items-center gap-2 btn-3d",
      selected 
        ? "glow-selected" 
        : "bg-black/50 text-slate-500 border-white/5 hover:border-white/20 hover:text-slate-200"
    )}
  >
    {icon}
    {label}
  </button>
);

const SectionTitle = ({ title, required = false, hint }: { title: string; required?: boolean; hint?: string }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{title}</h3>
      {required && (
        <span className="text-[8px] text-white font-black uppercase tracking-widest border border-white/30 px-1.5 py-0.5 rounded leading-none">
          CỐ ĐỊNH
        </span>
      )}
    </div>
    {hint && (
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium tracking-wide">
        <Info className="w-3 h-3 text-slate-600" />
        {hint}
      </div>
    )}
  </div>
);

const COLD_FUNNEL = [
  'Hướng dẫn & "How-to"', 'Phá bỏ lầm tưởng', 'Danh sách tổng hợp', 'Phân tích chuyên sâu', 'Q&A', 'Giải trí - hài hước', 'Chia sẻ cảm xúc - câu chuyện', 'Tin hot - bắt trend', 'Tạo tranh luận - Drama'
];

const WARM_FUNNEL = [
  'Câu chuyện sản phẩm / thương hiệu', 'Câu chuyện khởi nghiệp', 'Thành phần / nguyên liệu', 'Nguồn gốc / xuất xứ', 'Hoạt chất / cơ chế', 'Tính năng / công dụng', 'USPs / PODs', 'Chính sách giá', 'Phí vận chuyển', 'Thời gian giao hàng', 'Chính sách đổi trả, bảo hành, hậu mãi', 'Khách hàng Vip, members', 'Tips, mẹo sản phẩm / giải pháp', 'KOLs', 'KOCs', 'Influencers', 'PR', 'Truyền thông mạng xã hội', 'Review / mô tả sản phẩm', 'Life style', 'Booking / Seeding', 'Review - Feedback - Rating', 'CSR', 'Tầm nhìn - sứ mệnh - giá trị cốt lõi'
];

const HOT_FUNNEL = [
  'Insight trigger', 'Promotion', 'Minigame', 'Activation', 'Nỗi đau', 'Nhu cầu', 'Mong muốn', 'Nguyên nhân', 'Hậu quả', 'Rào cản', 'Vượt qua rào cản', 'PODs', 'USPs', 'Testimonial', 'Push sale', 'Flash sale', 'Up sale', 'Cross sale', 'Combo', 'Discount', 'Quà tặng kèm', 'Voucher / memberships', 'UGC', 'Event online', 'Event offline', 'Workshop', 'Webinar', 'Talkshow'
];

const FORMULAS = [
  'AIDA', 'PAS', 'BAB', 'FAB', '4P', 'SSS', '4U', 'ACCA', 'The String of Pearls', 'HELLYEAH', 'QUEST', 'Hook, Story, Offer', "5 W's", 'The Value Sandwich', 'IDA', 'The Inverted Pyramid', "The Hero's Journey", 'STAR', 'PASTOR', 'The 1-2-3-4 Formula'
];

const TONES = [
  'Chuyên gia', 'Kỹ thuật', 'Phân tích', 'Học thuật', 'Pháp lý', 'Kể chuyện', 'Truyền cảm hứng', 'Đồng cảm', 'Miêu tả', 'Hoài niệm', 'Thơ mộng', 'Nội tâm', 'Bán hàng trực tiếp', 'Bí ẩn / Gây tò mò', 'Độc quyền / Cao cấp', 'Cảnh báo / Gây sốc', 'Đánh giá', 'Phóng đại', 'Thân thiện / Trò chuyện', 'Hài hước', 'Hướng dẫn', 'Báo chí / Tin tức', 'Bình luận', 'Trào phúng / Châm biếm', 'Gây tranh cãi', 'Giản dị / Tối giản', 'Tương phản', 'Biểu tượng', 'Giả tưởng / Thần thoại', 'Vaporation'
];

const CTA_GOALS = [
  'Mua ngay', 'Để lại thông tin', 'Đăng ký nhận tài liệu', 'Follow kênh', 'Tag bạn bè', 'Cmt', 'Chia sẻ nội dung', 'Săn sale ngay'
];

// --- Main App ---

export default function App() {
  // Form State
  const [complexity, setComplexity] = useState<Complexity>('cơ bản');
  const [mode, setMode] = useState<Mode>('viết nhanh');
  const [brandInfo, setBrandInfo] = useState('');
  const [hasIdea, setHasIdea] = useState<boolean | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [outputType, setOutputType] = useState('Bài viết');
  const [format, setFormat] = useState('Text trơn');
  const [lengthType, setLengthType] = useState('Số ký tự');
  const [lengthValue, setLengthValue] = useState('');
  const [versions, setVersions] = useState(1);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  // Advanced State
  const [advSelectionMode, setAdvSelectionMode] = useState<'AI gợi ý' | 'Ngẫu nhiên' | 'Tự chọn'>('Tự chọn');
  const [selectedContentLines, setSelectedContentLines] = useState<string[]>([]);
  const [mainMessage, setMainMessage] = useState('Ngẫu nhiên');
  const [subMessage, setSubMessage] = useState('Ngẫu nhiên');
  const [selectedFormula, setSelectedFormula] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedCTA, setSelectedCTA] = useState<string[]>([]);
  const [speechWritingRatio, setSpeechWritingRatio] = useState(100); 
  const [qualitativeQuantitativeRatio, setQualitativeQuantitativeRatio] = useState(50);
  const [evidenceData, setEvidenceData] = useState('Ngẫu nhiên');
  
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    if (saved === 'true' && loginTime) {
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - parseInt(loginTime) < oneHour) {
        return true;
      }
    }
    return false;
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Session Timeout Check (Check every 30 seconds for better responsiveness)
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkSession = () => {
      const loginTime = localStorage.getItem('loginTime');
      if (loginTime) {
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - parseInt(loginTime) >= oneHour) {
          handleLogout();
        }
      }
    };

    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'contentupmedia' && loginPass === 'Bn123456@') {
      setIsLoggedIn(true);
      const now = Date.now().toString();
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loginTime', now);
      setLoginError('');
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
  };

  // AI State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null);

  const toggleSelection = (list: string[], item: string, setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Thiếu API Key Gemini. Vui lòng thiết lập trong phần Secrets.');
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = 'gemini-3-flash-preview';

      const prompt = `Bạn là một chuyên gia Content Marketing chuyên nghiệp. Hãy tạo nội dung dựa trên các yêu cầu sau:

### THÔNG SỐ ĐẦU VÀO (Hãy tóm tắt phần này ở đầu kết quả đầu ra dưới tiêu đề "## TÓM TẮT CHIẾN DỊCH"):
- Mức độ chi tiết: ${complexity}
- Chế độ: ${mode}
- Thông tin thương hiệu/sản phẩm: ${brandInfo}
- Trạng thái ý tưởng: ${hasIdea ? 'Đã có' : 'Chưa có (AI tự đề xuất)'}
- Kênh triển khai: ${selectedChannels.join(', ') || 'Chưa xác định'}
- Khách hàng mục tiêu (Insight/Pain points): ${targetAudience}
- Mục tiêu marketing: ${selectedGoals.join(', ')}
- Loại đầu ra: ${outputType}
- Định dạng: ${format}
- Độ dài mong muốn: ${lengthValue} ${lengthType}
- Số lượng phiên bản: ${versions}
- Yêu cầu bổ sung: ${additionalPrompt}

${complexity === 'nâng cao' ? `
THIẾT LẬP NÂNG CAO:
- Tuyến nội dung (Phễu): ${selectedContentLines.join(', ')}
- Thông điệp chính: ${mainMessage}
- Thông điệp phụ: ${subMessage}
- Công thức áp dụng: ${selectedFormula}
- Văn phong yêu cầu: ${selectedTone}
- Hành động mong muốn (CTA): ${selectedCTA.join(', ')}
- Tỷ lệ phong cách: ${speechWritingRatio}% Văn viết / ${100 - speechWritingRatio}% Văn nói
- Trọng tâm nội dung: ${qualitativeQuantitativeRatio}% Định lượng / ${100 - qualitativeQuantitativeRatio}% Định tính
- Số liệu/Bằng chứng cung cấp: ${evidenceData}
` : ''}

Yêu cầu QUAN TRỌNG:
1. Bắt đầu kết quả bằng phần "## TÓM TẮT CHIẾN DỊCH" liệt kê lại các thông số trên một cách ngắn gọn, súc tích.
2. Sau đó mới đến phần nội dung sáng tạo chính.
3. KHÔNG ĐƯỢC CÓ CÁC KHOẢNG TRẮNG DƯ THỪA HAY CÁC DÒNG TRỐNG VÔ NGHĨA Ở ĐẦU CÂU.
4. Viết hoàn toàn bằng tiếng Việt, văn phong phù hợp với thương hiệu và kênh triển khai.
5. ${format === 'Bảng' 
  ? 'BẮT BUỘC XUẤT DƯỚI DẠNG BẢNG (Markdown table) cho phần nội dung sáng tạo. Bảng phải có 5 cột chính xác: "Phần", "Thời lượng", "Cảnh quay (Visual)", "Lời thoại (Audio)", "Ghi chú kỹ thuật". Phân chia nội dung theo cấu trúc Attention, Interest, Desire, Action.' 
  : 'Xuất bản nội dung dưới định dạng Markdown đẹp mắt, có tiêu đề, danh sách và nhấn mạnh rõ ràng.'}
6. Cung cấp ${versions} phiên bản khác nhau. MỖI PHIÊN BẢN PHẢI BẮT ĐẦU BẰNG TIÊU ĐỀ "## PHIÊN BẢN [SỐ]".
${additionalPrompt ? `7. Lưu ý đặc biệt: ${additionalPrompt}` : ''}
`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      setResult(response.text || 'Không có nội dung nào được tạo ra.');
      
      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi khi tạo nội dung.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép nội dung phiên bản này!');
  };

  const renderResult = () => {
    if (!result) return null;
    
    // Split by version markers
    const parts = result.split(/(?=## PHIÊN BẢN)/g);
    
    return parts.map((part, index) => (
      <div key={index} className="relative mb-12 group/section last:mb-0">
        {part.startsWith('## PHIÊN BẢN') && (
          <button 
            onClick={() => handleCopyText(part)}
            className="absolute top-0 right-0 z-10 p-2.5 bg-black/80 border border-white/20 rounded-xl text-slate-400 hover:text-white transition-all btn-3d hover:border-white/40 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/section:opacity-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Copy className="w-4 h-4" /> SAO CHÉP KỊCH BẢN
          </button>
        )}
        <div className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-strong:text-white prose-p:text-slate-400 prose-li:text-slate-400 prose-h1:tracking-tight prose-h1:text-3xl markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ ...props }) => <h1 className="text-3xl font-black mb-6 border-b border-white/10 pb-4 text-white uppercase italic tracking-tighter" {...props} />,
              h2: ({ ...props }) => <h2 className="text-xl font-black mt-10 mb-4 text-white uppercase tracking-widest border-l-4 border-white pl-4" {...props} />,
              strong: ({ ...props }) => <strong className="font-black text-black uppercase text-[10px] tracking-widest bg-white px-2 py-0.5 rounded mr-1 border border-white" {...props} />,
              code: ({ ...props }) => <code className="bg-black px-2 py-1 rounded text-white font-mono text-sm border border-white/10" {...props} />,
            }}
          >
            {part}
          </ReactMarkdown>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-black text-slate-300 flex flex-col font-sans selection:bg-white/20 selection:text-white relative">
      <div className="cyber-grid" />
      
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center relative z-10 p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-6 group-hover:scale-110 transition-transform duration-500">
                <Zap className="text-black w-8 h-8 fill-black" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white italic uppercase text-center">
                UP MEDIA <span className="text-slate-500">AI CONTENT</span>
              </h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Hệ thống sản xuất nội dung</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Tên đăng nhập</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="text" 
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-white/20 outline-none transition-all focus:bg-black/80"
                    placeholder="Nhập username..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Mật khẩu</label>
                <div className="relative">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="password" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-white/20 outline-none transition-all focus:bg-black/80"
                    placeholder="Nhập password..."
                    required
                  />
                </div>
              </div>

              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[10px] text-red-300 font-bold uppercase tracking-wide">{loginError}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm btn-3d-glow flex items-center justify-center gap-3 mt-4"
              >
                Đăng Nhập <Rocket className="w-5 h-5 fill-black" />
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-loose">
                Bảo mật bởi UP MEDIA AI Content <br/>
                Phiên đăng nhập có hiệu lực trong 1 giờ
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Zap className="text-black w-6 h-6 fill-black" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white italic uppercase">UP MEDIA <span className="text-slate-400">AI CONTENT</span></h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-black text-white tracking-widest uppercase">contentupmedia</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">AI Specialist</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all btn-3d hover:border-white/30"
                title="Đăng xuất"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-6">
        {/* Bento Grid Header / Complexity */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-8 bento-card flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-white">
            <div>
              <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight italic">Cấu hình chiến dịch</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Thiết lập các thông số cơ bản</p>
            </div>
            <div className="bg-black/80 border border-white/5 p-1.5 rounded-3xl flex items-center gap-1 shrink-0 shadow-inner">
              {(['cơ bản', 'nâng cao'] as Complexity[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setComplexity(c)}
                  className={cn(
                    "px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500",
                    complexity === c 
                      ? "glow-selected" 
                      : "text-slate-600 hover:text-slate-300"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bento-card bg-gradient-to-br from-neutral-800 to-black border-none text-white flex flex-col justify-between group overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chỉ số sáng tạo</h3>
              <Sparkles className="w-5 h-5 text-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </div>
            <div className="py-2 relative z-10">
              <span className="text-6xl font-black tracking-tighter italic">94</span>
              <span className="text-xs font-black text-white ml-2 uppercase tracking-widest">A.I. OPTIMUM</span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] relative z-10 opacity-70">Khả năng tổng hợp hoàn tất</p>
          </div>
        </div>

        {/* Mode Selection Grid */}
        <div className="grid grid-cols-12 gap-6">
          {[
            { id: 'viết nhanh', label: 'Viết nhanh', icon: <Zap />, sub: 'Tốc độ sản xuất cao', grid: 'col-span-12 md:col-span-4' },
            { id: 'đánh giá', label: 'Cải thiện', icon: <RefreshCw />, sub: 'Tinh chỉnh chiến lược', grid: 'col-span-12 md:col-span-4' },
            { id: 'gợi ý', label: 'Khám phá', icon: <Lightbulb />, sub: 'Tìm kiếm sáng tạo', grid: 'col-span-12 md:col-span-4' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as Mode)}
              className={cn(
                "p-8 rounded-[2rem] border text-left transition-all duration-500 relative overflow-hidden flex items-center gap-6 group",
                m.grid,
                mode === m.id 
                  ? "bg-white/5 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)] ring-1 ring-white/20 -translate-y-1" 
                  : "bg-neutral-900/10 border-white/5 hover:border-white/20 hover:bg-white/5"
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 bg-black border border-white/10",
                mode === m.id ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-slate-600"
              )}>
                {React.cloneElement(m.icon as React.ReactElement<any>, { className: cn('w-7 h-7', mode === m.id && 'animate-pulse') })}
              </div>
              <div className="relative z-10">
                <h4 className="font-black text-sm text-white uppercase tracking-wider italic">{m.label}</h4>
                <p className="text-[9px] text-slate-500 mb-1 font-bold uppercase tracking-[0.2em]">{m.sub}</p>
                <div className={cn(
                   "text-[8px] font-black uppercase tracking-[0.3em] transition-all",
                   mode === m.id ? "text-white" : "text-slate-700"
                )}>Mô-đun đang hoạt động</div>
              </div>
              {mode === m.id && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white">
                  <CheckCircle2 className="w-6 h-6 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Warning Hint */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <p className="text-xs text-slate-400 font-medium">
            Ô nào không rõ thông tin, hãy nhập chữ <span className="text-white font-black underline decoration-white/30">"ngẫu nhiên"</span>, AI của chúng tôi sẽ tự động đề xuất tốt nhất.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="space-y-12">
          {/* CƠ BẢN SECTION */}
          <div className="space-y-8 bg-neutral-900/10 p-10 rounded-[3rem] border border-white/5 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <span className="w-10 h-[1px] bg-white/20" />
              Lõi nội dung chính
            </h2>
            
            <div className="grid grid-cols-12 gap-10">
              {/* Core Info */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <div>
                  <SectionTitle title="Dữ liệu thương hiệu sơ cấp" required hint="Gồm sản phẩm, giải pháp và các giá trị độc bản (USP)" />
                  <textarea
                    value={brandInfo}
                    onChange={(e) => setBrandInfo(e.target.value)}
                    placeholder="Ví dụ: Tôi cần quảng bá phần mềm F-Manager giúp quản lý Fanpage tự động..."
                    className="w-full bg-black/80 border border-white/10 rounded-3xl p-6 text-sm text-slate-200 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/5 min-h-[160px] resize-none transition-all duration-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                  />
                </div>

                <div>
                  <SectionTitle title="Ma trận nhân chân dung mục tiêu" required hint="Insight, nỗi đau và các nút thắt tâm lý cụ thể" />
                  <textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Ví dụ: Chủ shop kinh doanh online, 25-40 tuổi, đang gặp vấn đề về trực page 24/7..."
                    className="w-full bg-black/80 border border-white/10 rounded-3xl p-6 text-sm text-slate-200 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/5 min-h-[160px] resize-none transition-all duration-300 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                  />
                </div>
              </div>

              {/* Side Settings */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div>
                  <SectionTitle title="Kênh triển khai" required />
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(c => (
                      <Chip key={c} label={c} selected={selectedChannels.includes(c)} onClick={() => toggleSelection(selectedChannels, c, setSelectedChannels)} />
                    ))}
                    <button className="px-3 py-1.5 bg-black border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:border-white/30 transition-all">
                      + Nhập
                    </button>
                  </div>
                </div>

                <div>
                  <SectionTitle title="Mục tiêu cốt lõi" required />
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map(g => (
                      <Chip key={g} label={g} selected={selectedGoals.includes(g)} onClick={() => toggleSelection(selectedGoals, g, setSelectedGoals)} />
                    ))}
                  </div>
                </div>

                <div>
                  <SectionTitle title="Mục tiêu đầu ra" required />
                  <div className="flex flex-wrap gap-2">
                    {['Bài viết', 'Kịch bản video', 'Ý tưởng', 'Dàn ý', 'Brief ảnh'].map(o => (
                      <Chip key={o} label={o} selected={outputType === o} onClick={() => setOutputType(o)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-800/50">
              <div>
                <SectionTitle title="Định dạng nội dung" />
                <div className="flex gap-2">
                  {['Text trơn', 'Bảng'].map(f => (
                    <Chip key={f} label={f} selected={format === f} onClick={() => setFormat(f)} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <SectionTitle title="Độ dài nội dung" />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex gap-2">
                    {['Số ký tự', 'Số giây', 'Số đoạn'].map(l => (
                      <Chip key={l} label={l} selected={lengthType === l} onClick={() => setLengthType(l)} />
                    ))}
                  </div>
                  <input
                    type="number"
                    value={lengthValue}
                    onChange={(e) => setLengthValue(e.target.value)}
                    placeholder="Số..."
                    className="w-24 bg-black border border-white/10 rounded-2xl px-4 py-2 text-xs text-white outline-none focus:border-white/50 font-black tracking-widest text-center shadow-inner"
                  />
                </div>
              </div>
              <div>
                <SectionTitle title="Số phiên bản nội dung" hint="Tối đa 10" />
                <div className="flex gap-2">
                  {[1, 2, 3, 5, 10].map(v => (
                    <button
                      key={v}
                      onClick={() => setVersions(v)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all btn-3d",
                        versions === v ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "bg-black border border-white/5 text-slate-600 hover:text-slate-300"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <SectionTitle title="Yêu cầu bổ sung" hint="(tuỳ chọn)" />
              <textarea
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="Ví dụ: - Không dùng từ sáo rỗng\n- Tác giả xưng 'mình'\n- Đoạn mở đầu là một câu hỏi..."
                className="w-full bg-black border border-white/10 rounded-3xl p-6 text-sm text-slate-400 outline-none focus:border-white/20 min-h-[160px] resize-none shadow-inner"
              />
            </div>
          </div>

          {/* NÂNG CAO SECTION */}
          {complexity === 'nâng cao' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10 bg-neutral-900/10 p-8 rounded-[40px] border border-white/5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h2 className="text-xl font-bold border-l-4 border-white pl-4 text-white uppercase tracking-wider italic">NÂNG CAO</h2>

              {/* Mode Selection */}
              <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-2">
                {['AI gợi ý', 'Ngẫu nhiên', 'Tự chọn'].map((adv) => (
                  <button
                    key={adv}
                    onClick={() => setAdvSelectionMode(adv as any)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                      advSelectionMode === adv ? "bg-slate-800 text-white shadow-xl" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {adv}
                  </button>
                ))}
              </div>

              {/* FUNNELS */}
              <div className="space-y-6 pt-6 border-t border-slate-800/50">
                <SectionTitle title="Tuyến nội dung (Phễu)" />
                
                <div className="space-y-4">
                  {/* COLD */}
                  <div className="p-5 bg-black/30 border border-white/5 rounded-2xl space-y-4">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">❄️ PHỄU LẠNH</div>
                    <div className="flex flex-wrap gap-2">
                      {COLD_FUNNEL.map(item => (
                        <Chip key={item} label={item} selected={selectedContentLines.includes(item)} onClick={() => toggleSelection(selectedContentLines, item, setSelectedContentLines)} />
                      ))}
                    </div>
                  </div>

                  {/* WARM */}
                  <div className="p-5 bg-black/30 border border-white/5 rounded-2xl space-y-4">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">🔥 PHỄU ẤM</div>
                    <div className="flex flex-wrap gap-2">
                      {WARM_FUNNEL.map(item => (
                        <Chip key={item} label={item} selected={selectedContentLines.includes(item)} onClick={() => toggleSelection(selectedContentLines, item, setSelectedContentLines)} />
                      ))}
                    </div>
                  </div>

                  {/* HOT */}
                  <div className="p-5 bg-black/30 border border-white/5 rounded-2xl space-y-4">
                    <div className="text-[10px] font-black text-white uppercase tracking-widest">🚀 PHỄU NÓNG</div>
                    <div className="flex flex-wrap gap-2">
                      {HOT_FUNNEL.map(item => (
                        <Chip key={item} label={item} selected={selectedContentLines.includes(item)} onClick={() => toggleSelection(selectedContentLines, item, setSelectedContentLines)} />
                      ))}
                    </div>
                  </div>
                </div>
                <button className="px-4 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors uppercase">
                  + Khác
                </button>
              </div>

              {/* Messages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <SectionTitle title="Thông điệp chính" hint="(tuỳ chọn)" />
                  <textarea
                    value={mainMessage}
                    onChange={(e) => setMainMessage(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 min-h-[100px] outline-none"
                  />
                </div>
                <div>
                  <SectionTitle title="Thông điệp phụ" hint="(tuỳ chọn)" />
                  <textarea
                    value={subMessage}
                    onChange={(e) => setSubMessage(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 min-h-[100px] outline-none"
                  />
                </div>
              </div>

              {/* Formula & Tone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <SectionTitle title="Công thức nội dung" />
                  <div className="flex flex-wrap gap-2">
                    {FORMULAS.map(f => (
                      <Chip key={f} label={f} selected={selectedFormula === f} onClick={() => setSelectedFormula(f)} />
                    ))}
                    <button className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase">
                      + Khác
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <SectionTitle title="Văn phong" />
                  <div className="flex flex-wrap gap-2">
                    {TONES.map(t => (
                      <Chip key={t} label={t} selected={selectedTone === t} onClick={() => setSelectedTone(t)} />
                    ))}
                    <button className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase">
                      + Khác
                    </button>
                  </div>
                </div>
              </div>

              {/* Other Controls */}
              <div className="space-y-6 pt-6 border-t border-slate-800/50">
                <div className="space-y-4">
                  <SectionTitle title="Bạn muốn Khách hàng/ độc giả làm gì?" />
                  <div className="flex flex-wrap gap-2">
                    {CTA_GOALS.map(c => (
                      <Chip key={c} label={c} selected={selectedCTA.includes(c)} onClick={() => toggleSelection(selectedCTA, c, setSelectedCTA)} />
                    ))}
                    <button className="px-4 py-1.5 rounded-xl text-[11px] font-bold bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300">
                      + Khác
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <SectionTitle title="Tỷ lệ Văn nói - Văn viết" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{100 - speechWritingRatio}% Nói - {speechWritingRatio}% Viết</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={speechWritingRatio}
                      onChange={(e) => setSpeechWritingRatio(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[10px] text-slate-700 font-bold uppercase">
                      <span>100% Văn nói</span>
                      <span>100% Văn viết</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <SectionTitle title="Tỷ lệ Định tính - Định lượng" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{100 - qualitativeQuantitativeRatio}% Định tính - {qualitativeQuantitativeRatio}% Định lượng</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={qualitativeQuantitativeRatio}
                      onChange={(e) => setQualitativeQuantitativeRatio(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <div className="flex justify-between text-[10px] text-slate-700 font-bold uppercase">
                      <span>100% Định tính</span>
                      <span>100% Định lượng</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionTitle title="Số liệu - bằng chứng uy tín" />
                    <span className="text-[10px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded font-black uppercase tracking-widest cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(255,255,255,0.1)]">💡 Gợi ý</span>
                  </div>
                  <textarea
                    value={evidenceData}
                    onChange={(e) => setEvidenceData(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm text-slate-300 min-h-[120px] outline-none focus:border-white/30 shadow-inner"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* GENERATE BUTTON */}
          <div className="flex justify-center pt-10">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !brandInfo || selectedChannels.length === 0}
              className={cn(
                "max-w-md w-full py-6 rounded-full font-black text-base uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all duration-500 btn-3d",
                isLoading 
                  ? "bg-neutral-900 text-slate-700 cursor-not-allowed" 
                  : "btn-3d-glow hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                  ĐANG PHÂN TÍCH...
                </>
              ) : (
                <>
                  Sản Xuất Nội Dung
                  <Rocket className="w-6 h-6 fill-black bounce-on-hover" />
                </>
              )}
            </button>
          </div>
        </div>



        {/* Result Area */}
        <AnimatePresence>
          {(result || isLoading || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              ref={resultRef}
              className="grid grid-cols-12 gap-4 pb-20"
            >
              <div className="col-span-12 bento-card bg-black border-white/10 min-h-[600px] flex flex-col relative overflow-hidden group">
                  <div className="absolute inset-0 cyber-grid opacity-20" />
                  <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-black border border-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <Sparkles className="text-white w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Tổng hợp hoàn tất</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_#ffffff]" />
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Sẵn sàng trích xuất dữ liệu</p>
                        </div>
                      </div>
                    </div>
                    {result && !isLoading && (
                      <div className="flex gap-2">
                        <button onClick={() => handleCopyText(result)} className="p-2.5 bg-black border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all btn-3d hover:border-white/30 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <Copy className="w-4 h-4" /> Sao chép tất cả
                        </button>
                        <button className="p-2.5 bg-black border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all btn-3d hover:border-white/30 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <Share2 className="w-4 h-4" /> Chia sẻ
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-start gap-3 mb-6">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-200">{error}</p>
                    </div>
                  )}

                  <div className="flex-1 relative">
                    {isLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                          <Loader2 className="w-16 h-16 text-white animate-spin" />
                          <div className="absolute inset-0 blur-3xl bg-white/20 rounded-full" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white uppercase tracking-widest mb-1 italic">Đang sáng tạo nội dung xuất sắc...</p>
                          <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">Hệ thống AI đang hiệu chỉnh đầu ra</p>
                        </div>
                      </div>
                    ) : (
                      renderResult()
                    )}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="flex justify-between items-center text-[10px] text-slate-600 px-8 py-6 border-t border-white/5 bg-black">
        <div className="flex gap-6 uppercase tracking-widest font-bold">
          <span>© 2024 UP MEDIA AI CONTENT</span>
          <span className="text-slate-900">|</span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />
            Trạng thái: Hệ thống khả dụng
          </span>
        </div>
        <div className="flex gap-6 uppercase tracking-widest font-bold text-slate-500">
          <a href="#" className="hover:text-white transition-colors">Tài liệu</a>
          <a href="#" className="hover:text-white transition-colors">Hỗ trợ</a>
        </div>
      </footer>
        </>
      )}
    </div>
  );
}
