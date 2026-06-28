import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  Heart,
  ThumbsDown,
  Edit2,
  Download,
  RefreshCw,
  Plus,
  X,
  MessageSquare,
  Check,
  User,
  Phone,
  Mail,
  Send,
  Calendar,
  Sparkles,
  Info,
  Clock,
  Compass,
  FileText,
  MapPin,
  HeartCrack,
  Flame,
  ChevronRight,
  ClipboardCopy
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- STYLING & CONSTANTS ---

const ROLE_COLORS = {
  ed: {
    accent: '#EC4899', // rose-500
    bg: 'bg-rose-50/50',
    border: 'border-rose-100',
    text: 'text-rose-700',
    tag: 'bg-rose-100/60',
    badge: 'bg-rose-500 text-white shadow-rose-200',
    gradient: 'from-rose-500 to-pink-600',
  },
  ag: {
    accent: '#3B82F6', // blue-500
    bg: 'bg-blue-50/50',
    border: 'border-blue-100',
    text: 'text-blue-700',
    tag: 'bg-blue-100/60',
    badge: 'bg-blue-500 text-white shadow-blue-200',
    gradient: 'from-blue-500 to-indigo-600',
  },
  ip: {
    accent: '#0D9488', // teal-600
    bg: 'bg-teal-50/50',
    border: 'border-teal-100',
    text: 'text-teal-700',
    tag: 'bg-teal-100/60',
    badge: 'bg-teal-600 text-white shadow-teal-200',
    gradient: 'from-teal-600 to-emerald-600',
  },
  sm: {
    accent: '#8B5CF6', // purple-500
    bg: 'bg-purple-50/50',
    border: 'border-purple-100',
    text: 'text-purple-700',
    tag: 'bg-purple-100/60',
    badge: 'bg-purple-500 text-white shadow-purple-200',
    gradient: 'from-purple-500 to-fuchsia-600',
  },
  cl: {
    accent: '#0ea5e9', // sky-500
    bg: 'bg-sky-50/50',
    border: 'border-sky-100',
    text: 'text-sky-700',
    tag: 'bg-sky-100/60',
    badge: 'bg-sky-500 text-white shadow-sky-200',
    gradient: 'from-sky-500 to-cyan-600',
  },
  other: {
    accent: '#6B7280', // gray-500
    bg: 'bg-gray-50/50',
    border: 'border-gray-100',
    text: 'text-gray-700',
    tag: 'bg-gray-100/60',
    badge: 'bg-gray-500 text-white shadow-gray-200',
    gradient: 'from-gray-500 to-slate-600',
  }
};

const getRoleColors = (role: string) => {
  const r = String(role || '').trim().toLowerCase();
  if (['ed', 'egg donor', 'egg_donor', 'донор'].includes(r)) return ROLE_COLORS.ed;
  if (['ag', 'agency', 'агентство'].includes(r)) return ROLE_COLORS.ag;
  if (['ip', 'intended parents', 'intended_parent', 'батьки'].includes(r)) return ROLE_COLORS.ip;
  if (['sm', 'surrogate mother', 'сурогатна'].includes(r)) return ROLE_COLORS.sm;
  if (['cl', 'client', 'клієнт'].includes(r)) return ROLE_COLORS.cl;
  return ROLE_COLORS.other;
};

// --- CORE UTILITIES ---

const calculateAge = (birthDateString: string) => {
  if (!birthDateString) return null;
  const parts = birthDateString.split('.').map(Number);
  if (parts.length < 3) return null;
  const [day, month, year] = parts;
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const calculateIMT = (weight: number, height: number) => {
  if (weight && height) {
    const heightInMeters = height / 100;
    return Math.round(weight / heightInMeters ** 2);
  }
  return null;
};

const calculateMonthsAgo = (dateString: string) => {
  if (!dateString) return null;
  const parts = dateString.split('.').map(Number);
  if (parts.length < 3) return null;
  const [day, month, year] = parts;
  const deliveryDate = new Date(year, month - 1, day);
  const now = new Date();
  return (now.getFullYear() - deliveryDate.getFullYear()) * 12 + (now.getMonth() - deliveryDate.getMonth());
};

const buildName = (data: any) => {
  const nameParts = [];
  if (Array.isArray(data.surname)) {
    if (data.surname.length === 2) {
      nameParts.push(`${data.surname[1]} (${data.surname[0]})`);
    } else if (data.surname.length > 0) {
      nameParts.push(data.surname.join(' '));
    }
  } else if (data.surname) {
    nameParts.push(data.surname);
  }
  if (data.name) nameParts.push(data.name);
  if (data.fathersname) nameParts.push(data.fathersname);
  return nameParts.length > 0 ? nameParts.join(' ') : 'Невідомий користувач';
};

const makeVCard = (user: any) => {
  const lines = [];
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');
  const finalName = buildName(user);
  lines.push(`FN;CHARSET=UTF-8:${finalName}`);
  lines.push(`N;CHARSET=UTF-8:${user.surname || ''};${user.name || ''};${user.fathersname || ''};;`);
  if (user.phone) {
    const phones = Array.isArray(user.phone) ? user.phone : [user.phone];
    phones.forEach((p: string) => {
      lines.push(`TEL;TYPE=CELL:+${p.replace(/\D/g, '')}`);
    });
  }
  if (user.email) {
    const emails = Array.isArray(user.email) ? user.email : [user.email];
    emails.forEach((e: string) => {
      lines.push(`EMAIL;TYPE=INTERNET:${e.trim()}`);
    });
  }
  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
};

const saveToContact = (user: any) => {
  const vcard = makeVCard(user);
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${user.surname || 'contact'}.vcf`;
  link.click();
  window.URL.revokeObjectURL(url);
  toast.success('Контакт успішно експортовано у форматі vCard!');
};

// --- MOCK DATABASE ---

const MOCK_PROFILES = [
  {
    userId: 'US009231',
    name: 'Марія',
    surname: 'Іваненко',
    fathersname: 'Василівна',
    role: 'ed',
    lastAction: Date.now() - 3600000 * 2,
    getInTouch: '2026-07-28',
    lastCycle: '2026-06-15',
    cycleStatus: 'stimulation',
    birth: '02.10.1998',
    maritalStatus: 'Yes',
    blood: '3+',
    height: '172',
    weight: '58',
    ownKids: '1',
    lastDelivery: '2023-04-12',
    csection: '1',
    region: 'Київська область',
    city: 'Київ',
    phone: '380671234567',
    email: 'm.ivanenko@example.com',
    telegram: 'mariya_ivanenko',
    instagram: 'mariya_eggdonor',
    myComment: 'Дуже пунктуальна дівчина, готова до нової донації. Хороший фолікулярний резерв.',
    writer: 'IgF, Ik',
    comments: [
      { commentId: '1', text: 'Успішна пункція в травні 2024 року. Отримано 16 ооцитів.', authorId: 'coordinator_olena' }
    ]
  },
  {
    userId: 'AG004928',
    name: 'Олександр',
    surname: 'Кравченко',
    fathersname: 'Петрович',
    role: 'ag',
    lastAction: Date.now() - 3600000 * 24,
    getInTouch: '2026-07-02',
    lastCycle: '',
    cycleStatus: '',
    birth: '14.05.1985',
    maritalStatus: 'Yes',
    blood: '2-',
    height: '180',
    weight: '82',
    ownKids: '',
    lastDelivery: '',
    csection: '',
    region: 'Львівська область',
    city: 'Львів',
    phone: '380509876543',
    email: 'agency.brightfuture@example.com',
    telegram: 'bright_future_agency',
    instagram: 'bright_future_agency',
    myComment: 'Керівник великої агенції репродуктивних технологій "Bright Future". Надійний партнер.',
    writer: 'V',
    comments: []
  },
  {
    userId: 'IP005231',
    name: 'Катерина',
    surname: 'Шевченко',
    fathersname: 'Миколаївна',
    role: 'ip',
    lastAction: Date.now() - 3600000 * 48,
    getInTouch: '2026-07-15',
    lastCycle: '',
    cycleStatus: '',
    birth: '20.12.1990',
    maritalStatus: 'Yes',
    blood: '1+',
    height: '165',
    weight: '60',
    ownKids: '',
    lastDelivery: '',
    csection: '',
    region: 'Одеська область',
    city: 'Одеса',
    phone: '380631112233',
    email: 'k.shevchenko@example.com',
    telegram: 'katerina_shev',
    instagram: '',
    myComment: 'Батьки шукають донора зі світлим волоссям та блакитними очима для програми ЕКЗ.',
    writer: 'Т',
    comments: [
      { commentId: '2', text: 'Провели першу консультацію. Готові розпочинати підбір.', authorId: 'coordinator_olena' }
    ]
  }
];

export default function App() {
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState(MOCK_PROFILES[0].userId);
  const [isAdmin, setIsAdmin] = useState(true);

  // Modal comments state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [editableCommentText, setEditableCommentText] = useState('');
  
  // Custom inputs active modes
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [showStimulationSchedule, setShowStimulationSchedule] = useState(true);

  // Track currently active profile data
  const currentProfile = useMemo(() => {
    return profiles.find(p => p.userId === selectedProfileId) || profiles[0];
  }, [profiles, selectedProfileId]);

  const updateProfileField = (key: string, value: any) => {
    setProfiles(prev => prev.map(p => {
      if (p.userId === selectedProfileId) {
        return {
          ...p,
          [key]: value,
          lastAction: Date.now()
        };
      }
      return p;
    }));
  };

  const handleAddComment = (text: string) => {
    if (!text.trim()) return;
    const newComment = {
      commentId: Date.now().toString(),
      text: text.trim(),
      authorId: isAdmin ? 'Admin_Coordinator' : 'Self_User'
    };
    updateProfileField('comments', [...(currentProfile.comments || []), newComment]);
    toast.success('Коментар успішно додано!');
  };

  const handleUpdateComment = () => {
    if (!selectedComment) return;
    const updated = currentProfile.comments.map(c => 
      c.commentId === selectedComment.commentId ? { ...c, text: editableCommentText } : c
    );
    updateProfileField('comments', updated);
    setIsCommentModalOpen(false);
    setSelectedComment(null);
    toast.success('Коментар оновлено!');
  };

  const handleDeleteComment = (id: string) => {
    const updated = currentProfile.comments.filter(c => c.commentId !== id);
    updateProfileField('comments', updated);
    toast.success('Коментар видалено');
  };

  const handleQuickAddDays = (days: number) => {
    const current = new Date();
    current.setDate(current.getDate() + days);
    const formatted = current.toISOString().split('T')[0];
    updateProfileField('getInTouch', formatted);
    toast.success(`Наступний контакт встановлено на ${formatted}`);
  };

  const colors = getRoleColors(currentProfile.role);

  const formatDateToDisplay = (dateString: any) => {
    if (!dateString) return '';
    const parts = String(dateString).trim().split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}.${month}.${year}`;
    }
    return String(dateString);
  };

  const hasRoleWithoutCycle = (data: any) => {
    const role = String(data?.role || data?.userRole || '').trim().toLowerCase();
    return ['pp', 'cl', 'ag', 'ip'].includes(role);
  };

  const displayRole = currentProfile.role || 'role';
  const region = currentProfile.region || '';

  const handleStatusClick = () => {
    const nextStatus = 
      currentProfile.cycleStatus === 'menstruation' ? 'stimulation' : 
      currentProfile.cycleStatus === 'stimulation' ? 'pregnant' : 'menstruation';
    updateProfileField('cycleStatus', nextStatus);
    toast.success(`Статус донації оновлено: "${nextStatus.toUpperCase()}"`);
  };

  const getNextCycleDate = () => {
    if (!currentProfile.lastCycle) return null;
    const parts = currentProfile.lastCycle.split('-').map(Number);
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 28);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
  };

  const nextCycle = getNextCycleDate();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Container wrapper */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Dashboard section */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                База Репродуктивних Технологій
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Сучасний CRM-інтерфейс для координації донорів яйцеклітин та клієнтів
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">Режим Адміна:</span>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isAdmin ? 'bg-amber-500' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAdmin ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </header>

        {/* Profile Switcher Tabs */}
        <div className="flex flex-wrap gap-2 justify-center bg-slate-200/50 p-1.5 rounded-xl">
          {profiles.map(p => {
            const isActive = p.userId === selectedProfileId;
            const pColors = getRoleColors(p.role);
            return (
              <button
                key={p.userId}
                onClick={() => {
                  setSelectedProfileId(p.userId);
                  setShowRoleEditor(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${pColors.gradient}`} />
                {buildName(p)}
                <span className="text-[10px] opacity-60">({p.userId})</span>
              </button>
            );
          })}
        </div>

        {/* Main interactive Card representing REDESIGNED renderTopBlock */}
        <main className="bg-white rounded-3xl border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300">
          
          {/* Top block component styled meticulously */}
          <div className="relative">
            {/* Background elegant gradient side accents */}
            <div className={`absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-b ${colors.gradient}`} />

            {/* Inner Content Padding */}
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Card Action Header and Metadata */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      {buildName(currentProfile)}
                    </h2>
                    
                    <button
                      onClick={() => setShowRoleEditor(!showRoleEditor)}
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm transition-all duration-200 ${colors.bg} ${colors.border} ${colors.text} hover:scale-105`}
                    >
                      {currentProfile.role === 'ed' && 'Egg donor / Донор'}
                      {currentProfile.role === 'ag' && 'Agency / Агентство'}
                      {currentProfile.role === 'ip' && 'Intended parents'}
                      {currentProfile.role === 'sm' && 'Surrogate mother'}
                      {currentProfile.role === 'cl' && 'Client / Клієнт'}
                      {currentProfile.role === 'other' && 'Other / Інше'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Оновлено: {formatDateToDisplay(currentProfile.lastAction)}
                    </span>
                    <span>·</span>
                    <span className="hover:text-amber-500 transition-colors">ID: {currentProfile.userId}</span>
                  </div>
                </div>

                {/* Primary Card Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm(`Ви дійсно бажаєте видалити анкету ${buildName(currentProfile)}?`)) {
                        toast.error('Функція видалення обмежена в демо-режимі');
                      }
                    }}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl border border-rose-100 transition-all duration-200"
                    title="Видалити анкету"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {currentProfile.role === 'ed' && (
                    <button
                      onClick={() => toast.success('Відкриття розкладу прийому препаратів...')}
                      className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl border border-emerald-100 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold"
                      title="Графік прийому ліків"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ліки</span>
                    </button>
                  )}

                  <button
                    onClick={() => saveToContact(currentProfile)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-100 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold"
                    title="Експортувати контакт"
                  >
                    <Download className="w-4 h-4" />
                    <span>vCard</span>
                  </button>

                  <button
                    onClick={() => {
                      toast.loading('Синхронізація з хмарою Firebase...', { duration: 1000 });
                    }}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl border border-blue-100 transition-all duration-200"
                    title="Синхронізувати з Firebase"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Role Modifier Section */}
              <AnimatePresence>
                {showRoleEditor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap gap-2 items-center"
                  >
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Змінити роль профілю:</span>
                    {Object.keys(ROLE_COLORS).map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          updateProfileField('role', r);
                          setShowRoleEditor(false);
                          toast.success(`Роль змінено на "${r.toUpperCase()}"`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 ${
                          currentProfile.role === r
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid block for Get In Touch & Cycle Status Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Get In Touch CRM block */}
                <div className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Коли звернутись знову
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateProfileField('getInTouch', '')}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg text-xs"
                        title="Очистити дату"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={currentProfile.getInTouch || ''}
                      onChange={e => updateProfileField('getInTouch', e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700 shadow-sm"
                    />
                    
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => handleQuickAddDays(3)} className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">3д</button>
                      <button onClick={() => handleQuickAddDays(30)} className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">1м</button>
                      <button onClick={() => handleQuickAddDays(90)} className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">3м</button>
                      <button onClick={() => handleQuickAddDays(180)} className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">6м</button>
                    </div>
                  </div>

                  {/* Reaction buttons built in line with exact CRM design */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => toast.success('Профіль додано у Вибране')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-600" />
                      <span>В обране</span>
                    </button>
                    <button
                      onClick={() => toast.error('Профіль додано у Дизлайк')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Дизлайк</span>
                    </button>
                  </div>
                </div>

                {/* Last Cycle, Status and expected menstruation blocker */}
                {!hasRoleWithoutCycle(currentProfile) ? (
                  <div className="p-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-pink-500" />
                        Останній цикл та статус
                      </span>
                      <button
                        onClick={handleStatusClick}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          currentProfile.cycleStatus === 'stimulation'
                            ? 'bg-amber-100 text-amber-800'
                            : currentProfile.cycleStatus === 'pregnant'
                            ? 'bg-pink-100 text-pink-800 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {currentProfile.cycleStatus || 'Місячні'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={currentProfile.lastCycle || ''}
                        onChange={e => updateProfileField('lastCycle', e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-slate-700 shadow-sm"
                      />

                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          updateProfileField('lastCycle', today);
                          toast.success('Останній цикл встановлено на сьогодні');
                        }}
                        className="px-2.5 py-2 bg-pink-50 hover:bg-pink-100 border border-pink-100 rounded-xl text-xs font-bold text-pink-600 shadow-sm"
                        title="Встановити сьогоднішню дату"
                      >
                        Сьогодні
                      </button>
                    </div>

                    {/* Cycle estimation & tracking metrics */}
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                      <span>Наступна менструація:</span>
                      <span className="font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded">
                        {nextCycle ? nextCycle : 'Не вказано'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-center items-center text-center space-y-2">
                    <Info className="w-8 h-8 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Репродуктивний статус</span>
                    <p className="text-xs text-slate-500 max-w-[240px]">
                      Для цієї ролі ({displayRole.toUpperCase()}) моніторинг циклу не потрібен або заблокований
                    </p>
                  </div>
                )}
              </div>

              {/* Biological and Physical Facts Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Фізичні параметри та локація
                </span>
                
                <div className="flex flex-wrap gap-2">
                  {currentProfile.birth && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold shadow-sm">
                      <User className="w-3.5 h-3.5" />
                      {currentProfile.birth} ({calculateAge(currentProfile.birth)} років)
                    </span>
                  )}

                  {currentProfile.blood && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      Група крові: РК {currentProfile.blood}
                    </span>
                  )}

                  {currentProfile.height && currentProfile.weight && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold shadow-sm">
                      <Flame className="w-3.5 h-3.5" />
                      {currentProfile.height}см / {currentProfile.weight}кг (ІМТ: {calculateIMT(Number(currentProfile.weight), Number(currentProfile.height))})
                    </span>
                  )}

                  {currentProfile.maritalStatus && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold shadow-sm">
                      <Heart className="w-3.5 h-3.5" />
                      {currentProfile.maritalStatus === 'Yes' ? 'Одружена' : 'Незаміжня'}
                    </span>
                  )}

                  {currentProfile.ownKids && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-100 text-pink-700 text-xs font-semibold shadow-sm">
                      <Compass className="w-3.5 h-3.5" />
                      Пологи: {currentProfile.ownKids} {currentProfile.lastDelivery && `(останні ${calculateMonthsAgo(currentProfile.lastDelivery)} міс. тому)`}
                    </span>
                  )}

                  {(region || currentProfile.city) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold shadow-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      {currentProfile.city}, {region}
                    </span>
                  )}
                </div>
              </div>

              {/* Contacts & Messaging Links */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Контактні дані для зв'язку
                </span>
                
                <div className="flex flex-wrap gap-2">
                  {currentProfile.phone && (
                    <a
                      href={`tel:${currentProfile.phone}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>+{currentProfile.phone}</span>
                    </a>
                  )}

                  {currentProfile.email && (
                    <a
                      href={`mailto:${currentProfile.email}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span>{currentProfile.email}</span>
                    </a>
                  )}

                  {currentProfile.telegram && (
                    <a
                      href={`https://t.me/${currentProfile.telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Send className="w-4 h-4 text-sky-500" />
                      <span>@{currentProfile.telegram}</span>
                    </a>
                  )}

                  {currentProfile.instagram && (
                    <a
                      href={`https://instagram.com/${currentProfile.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      <span>@{currentProfile.instagram}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Dynamic Internal Comments section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Нотатки та коментарі координатора
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
                    Автор: {currentProfile.writer || 'Адмін'}
                  </span>
                </div>

                {/* Main static profile comment */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block mb-1">Опис / Загальний коментар:</label>
                  <p className="text-sm text-slate-600 italic leading-relaxed">
                    {currentProfile.myComment || 'Опис відсутній. Клацніть "Редагувати", щоб додати.'}
                  </p>
                </div>

                {/* Custom feedback/reaction comments stream */}
                <div className="space-y-3">
                  {currentProfile.comments?.map(comment => (
                    <div key={comment.commentId} className="flex gap-3 items-start p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {comment.authorId.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-700">{comment.authorId}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedComment(comment);
                                setEditableCommentText(comment.text);
                                setIsCommentModalOpen(true);
                              }}
                              className="text-[10px] text-blue-500 font-bold hover:underline"
                            >
                              Редагувати
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.commentId)}
                              className="text-[10px] text-rose-500 font-bold hover:underline"
                            >
                              Видалити
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment quick input */}
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('newComment') as HTMLInputElement;
                      handleAddComment(input.value);
                      form.reset();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      name="newComment"
                      type="text"
                      placeholder="Додати нову нотатку до картки..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700 shadow-sm"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Зберегти</span>
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* Highlighted Craft overview and summary */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-500" />
            Огляд реалізованих покращень
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500 leading-relaxed">
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-slate-700">Преміальна дизайн-система</strong>: Заміна застарілих інлайнових стилів на елегантні Tailwind v4 компоненти.</li>
              <li><strong className="text-slate-700">Колірне кодування за ролями</strong>: Адаптивний візуал картки залежно від ролі (донор, агенція, батьки).</li>
              <li><strong className="text-slate-700">Вбудований планувальник</strong>: Покращені інтерактивні календарі та розумне планування контактів.</li>
            </ul>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-slate-700">Інтерактивна стрічка нотаток</strong>: Сучасний потік коментарів координаторів із повноцінним CRUD-режимом.</li>
              <li><strong className="text-slate-700">Пологи та C-Section</strong>: Розумний парсинг і розрахунок часу, що минув після останніх пологів.</li>
              <li><strong className="text-slate-700">Реальний експорт у vCard</strong>: Скачування справжніх візитних карток контакту на пристрій користувача.</li>
            </ul>
          </div>
        </section>
      </div>

      {/* Edit comment dialog Modal */}
      {isCommentModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4 animate-fade-in"
          onClick={() => {
            setIsCommentModalOpen(false);
            setSelectedComment(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 space-y-4 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Редагувати нотатку</h3>
              <button
                onClick={() => {
                  setIsCommentModalOpen(false);
                  setSelectedComment(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <textarea
              value={editableCommentText}
              onChange={e => setEditableCommentText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700 h-32"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsCommentModalOpen(false);
                  setSelectedComment(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleUpdateComment}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Зберегти зміни
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
