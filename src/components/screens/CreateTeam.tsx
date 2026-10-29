import React, { useState } from 'react';
import { Team, TeamCategory, MemberGender, MemberRole, UserSession } from '../../types';
import { api } from '../../lib/database';
import {
  Flame,
  ShieldCheck,
  Key,
  Users,
  Trophy,
  ArrowLeft,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  User,
  Phone,
  Mail,
  Search,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CreateTeamProps {
  currentUser: UserSession;
  onTeamCreated: (team: Team) => void;
  onCancel: () => void;
}

export const CreateTeam: React.FC<CreateTeamProps> = ({
  currentUser,
  onTeamCreated,
  onCancel,
}) => {
  // Team Info
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState(() => 'TEAM' + Math.floor(1000 + Math.random() * 9000));
  const [category, setCategory] = useState<TeamCategory>('42km');
  const [captainName, setCaptainName] = useState(currentUser.name || '');
  const [captainPhone, setCaptainPhone] = useState(currentUser.phone || '0912345678');
  const [captainEmail, setCaptainEmail] = useState(currentUser.email || '');

  // Registration code lookup for captain
  const [registrationCode, setRegistrationCode] = useState('');
  const [regLookupLoading, setRegLookupLoading] = useState(false);
  const [regLookupSuccess, setRegLookupSuccess] = useState<string | null>(null);
  const [regLookupError, setRegLookupError] = useState<string | null>(null);
  const [distanceDisallowedError, setDistanceDisallowedError] = useState<string | null>(null);

  // Captain Athlete Personal Info
  const [captainGender, setCaptainGender] = useState<MemberGender>('Nam');
  const [captainDistance, setCaptainDistance] = useState<string>('42km');
  const [captainRole, setCaptainRole] = useState<MemberRole>('official');

  // Form states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lookup registration code in marathon_registrations table
  const handleLookupRegCode = async (codeToLookup: string) => {
    const code = codeToLookup.trim();
    if (!code) {
      setRegLookupSuccess(null);
      setRegLookupError(null);
      return;
    }
    setRegLookupLoading(true);
    setRegLookupError(null);
    setRegLookupSuccess(null);
    setDistanceDisallowedError(null);

    try {
      const result = await api.lookupRegistration(code);
      if (result) {
        if (result.ho_ten) {
          setCaptainName(result.ho_ten);
        }
        if (result.gioi_tinh) {
          setCaptainGender(result.gioi_tinh);
        }
        if (result.sdt && !captainPhone) {
          setCaptainPhone(result.sdt);
        }

        // Validate marathon relay distance (Only 42km & 21km allowed)
        const distStr = String(result.cu_ly || '').trim().toLowerCase();
        const isDisallowed =
          distStr === '5km' ||
          distStr === '10km' ||
          distStr === '5k' ||
          distStr === '10k' ||
          (!distStr.includes('42') && !distStr.includes('21') && (distStr.includes('5') || distStr.includes('10')));

        if (isDisallowed) {
          setCaptainDistance(result.cu_ly);
          setDistanceDisallowedError(
            `Cự ly "${result.cu_ly}" không hợp điều lệ thi đấu marathon đồng đội. Giải chỉ tiếp nhận đăng ký đồng đội cho cự ly 42km hoặc 21km!`
          );
          setRegLookupSuccess(null);
        } else {
          setDistanceDisallowedError(null);
          const validDist = distStr.includes('21') ? '21km' : '42km';
          setCaptainDistance(validDist);
          setCategory(validDist as TeamCategory);
          setRegLookupSuccess(
            `Khớp dữ liệu: ${result.ho_ten} · ${result.gioi_tinh} · Cự ly ${result.cu_ly}`
          );
        }
      } else {
        setRegLookupError(
          `Không tìm thấy user_id "${code}" trong bảng marathon_registrations. Bạn có thể tự nhập thông tin bên dưới.`
        );
      }
    } catch (e: any) {
      setRegLookupError(e.message || 'Lỗi khi tra cứu mã đăng ký.');
    } finally {
      setRegLookupLoading(false);
    }
  };

  // Generate athletic passcode
  const handleGeneratePasscode = () => {
    const prefixes = ['MARA', 'PACE', 'SPEED', 'TEAM', 'RUN', 'IRON'];
    const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setPasscode(`${pfx}${num}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên đội đua.');
      return;
    }
    if (!passcode.trim()) {
      setErrorMsg('Vui lòng nhập Mật khẩu nhóm (Passcode).');
      return;
    }
    if (!captainName.trim()) {
      setErrorMsg('Vui lòng nhập Họ tên Đội trưởng.');
      return;
    }
    if (!captainPhone.trim()) {
      setErrorMsg('Vui lòng nhập Số điện thoại Đội trưởng.');
      return;
    }
    if (!captainEmail.trim()) {
      setErrorMsg('Vui lòng nhập Email Đội trưởng.');
      return;
    }

    // Check if captain distance is disallowed (5km/10km)
    if (
      distanceDisallowedError ||
      captainDistance === '5km' ||
      captainDistance === '10km' ||
      /^(5km|10km|5k|10k)$/i.test(captainDistance)
    ) {
      setErrorMsg('Cự ly không hợp điều lệ thi đấu marathon đồng đội. Giải chỉ áp dụng cho cự ly 42km hoặc 21km.');
      return;
    }

    try {
      setLoading(true);
      const { team } = await api.createTeam(
        {
          name,
          passcode,
          category,
          captain_name: captainName,
          captain_phone: captainPhone,
          captain_email: captainEmail,
        },
        {
          bib_number: null,
          gender: captainGender,
          distance: captainDistance || category,
          role: captainRole,
        }
      );

      onTeamCreated(team);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo đội đua. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh sách Đội</span>
        </button>

        <span className="text-xs text-orange-400 font-mono-num font-semibold uppercase tracking-wider">
          Màn hình 2: Khởi tạo Đội trưởng
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
            <Flame className="w-5 h-5" />
          </div>
          <h1 className="font-athletic text-3xl md:text-4xl font-black uppercase text-white tracking-wide">
            Đăng Ký Khởi Tạo Đội Đua Marathon
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Đội trưởng lập nhóm, tạo mật khẩu cho đồng đội gia nhập, và xác nhận một suất VĐV trong đội hình.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Team General Info */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-athletic text-lg font-bold uppercase text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-400" />
              1. Thông Tin Nhóm Đua
            </h2>
            <span className="text-xs text-slate-500">Bảng: `teams`</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Team Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên đội đua <span className="text-rose-500">*</span> (Duy nhất)
              </label>
              <input
                type="text"
                required
                placeholder="VD: Hà Nội Ultra Pacers 42K"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
              />
            </div>

            {/* Passcode with generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Mật khẩu nhóm (Passcode) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePasscode}
                  className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> Tạo ngẫu nhiên
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="VD: MARA42"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono tracking-wider focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all uppercase"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cung cấp mã này cho các thành viên trong đội để họ đăng ký gia nhập.
              </p>
            </div>
          </div>

          {/* Category Radio Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Nội dung thi đấu đồng đội <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                  category === '42km'
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-md shadow-orange-600/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="42km"
                  checked={category === '42km'}
                  onChange={() => {
                    setCategory('42km');
                    setCaptainDistance('42km');
                  }}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    category === '42km' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                  }`}
                >
                  {category === '42km' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="font-athletic text-xl font-bold uppercase tracking-wider text-white">
                    Đồng Đội 42KM (Full Marathon)
                  </div>
                  <div className="text-xs text-slate-400">
                    Cự ly danh giá nhất giải chạy, kiểm soát nghiêm ngặt thể lực 18 VĐV.
                  </div>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                  category === '21km'
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-md shadow-orange-600/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="21km"
                  checked={category === '21km'}
                  onChange={() => {
                    setCategory('21km');
                    setCaptainDistance('21km');
                  }}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    category === '21km' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                  }`}
                >
                  {category === '21km' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="font-athletic text-xl font-bold uppercase tracking-wider text-white">
                    Đồng Đội 21KM (Half Marathon)
                  </div>
                  <div className="text-xs text-slate-400">
                    Cự ly tốc độ và bền bỉ, cơ cấu tiêu chuẩn 18 thành viên.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: Captain Contact Info */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-athletic text-lg font-bold uppercase text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              2. Thông Tin Đội Trưởng
            </h2>
            <span className="text-xs text-slate-500">Đại diện pháp lý của đội</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Họ và tên Đội trưởng <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn Hùng"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="VD: 0912345678"
                  value={captainPhone}
                  onChange={(e) => setCaptainPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Đội trưởng <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="VD: captain@marathon.vn"
                  value={captainEmail}
                  onChange={(e) => setCaptainEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Captain Athlete Profile (Inserts into team_members) */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="font-athletic text-lg font-bold uppercase text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                3. Đăng Ký Suất VĐV Của Đội Trưởng
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Đội trưởng thi đấu trực tiếp trong đội hình (bảng <code className="text-orange-400">team_members</code>)
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              Suất thứ 1/18
            </span>
          </div>

          {/* Registration Code (Mã đăng ký) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200">
                Mã đăng ký VĐV <span className="text-orange-400 font-normal">(Tra cứu user_id từ bảng marathon_registrations)</span>
              </label>
              <span className="text-[11px] text-slate-400">Tự động điền Họ tên, Giới tính & Cự ly</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Nhập mã đăng ký / user_id (VD: 617986, 617816...)"
                  value={registrationCode}
                  onChange={(e) => {
                    setRegistrationCode(e.target.value);
                    if (regLookupSuccess || regLookupError || distanceDisallowedError) {
                      setRegLookupSuccess(null);
                      setRegLookupError(null);
                      setDistanceDisallowedError(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupRegCode(registrationCode);
                    }
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-orange-500"
                />
                <FileCheck2 className="w-4 h-4 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="button"
                onClick={() => handleLookupRegCode(registrationCode)}
                disabled={regLookupLoading || !registrationCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-orange-600/20"
              >
                {regLookupLoading ? (
                  <span>Đang tìm...</span>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Tra cứu</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick helper test codes from user table & test codes */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>Mã mẫu tra cứu:</span>
              {[
                { code: '617986', label: '617986 (42k)' },
                { code: '617816', label: '617816 (21k)' },
                { code: '617814', label: '617814 (42k)' },
                { code: '617105', label: '617105 (5k test)' },
                { code: '617110', label: '617110 (10k test)' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setRegistrationCode(item.code);
                    handleLookupRegCode(item.code);
                  }}
                  className={`px-2 py-0.5 rounded font-mono transition-colors border ${
                    item.code === '617105' || item.code === '617110'
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                      : 'bg-slate-800 hover:bg-slate-700 text-orange-300 border-slate-700'
                  }`}
                >
                  #{item.label}
                </button>
              ))}
            </div>

            {/* Success notification */}
            {regLookupSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{regLookupSuccess}</span>
              </div>
            )}

            {/* Error notification & RLS Guide */}
            {regLookupError && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{regLookupError}</span>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800">
                  <span className="text-amber-400 font-semibold">Lưu ý Supabase:</span> Nếu bạn đã có dữ liệu trong bảng nhưng API trả về rỗng, đó là do tính năng bảo mật <strong>Row Level Security (RLS)</strong> đang chặn quyền đọc của anon. Hãy mở <strong>Supabase Dashboard &gt; SQL Editor</strong> và chạy lệnh sau:
                  <code className="block mt-1 font-mono text-[10px] text-emerald-400 bg-slate-950 p-1.5 rounded select-all">
                    ALTER TABLE public.marathon_registrations DISABLE ROW LEVEL SECURITY;
                  </code>
                </div>
              </div>
            )}

            {/* Disallowed distance error banner (5km / 10km) */}
            {distanceDisallowedError && (
              <div className="p-4 rounded-xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Cự ly không hợp điều lệ thi đấu</span>
                </div>
                <p className="font-medium text-rose-200">{distanceDisallowedError}</p>
                <div className="text-[11px] text-rose-300/90 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/60">
                  ⛔ <strong>Quy định Điều lệ:</strong> Nội dung Marathon Đồng đội chỉ áp dụng cho VĐV đăng ký cự ly <strong>42km</strong> hoặc <strong>21km</strong>. Các cự ly 5km và 10km là cự ly phong trào cá nhân, không thể dùng để thành lập hoặc tham gia đội đua đồng đội.
                </div>
              </div>
            )}
          </div>

          <div>
            {/* Distance: Only 42km & 21km allowed */}
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cự ly cá nhân Đội trưởng <span className="text-orange-400 text-[11px]">(Chỉ áp dụng 42km hoặc 21km)</span>
            </label>
            <select
              value={captainDistance}
              onChange={(e) => {
                setCaptainDistance(e.target.value);
                if (e.target.value === '42km' || e.target.value === '21km') {
                  setDistanceDisallowedError(null);
                  setCategory(e.target.value as TeamCategory);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="42km">42km Full Marathon Đồng đội</option>
              <option value="21km">21km Half Marathon Đồng đội</option>
            </select>
            {captainDistance !== '42km' && captainDistance !== '21km' && (
              <p className="text-[11px] text-rose-400 mt-1">
                ⚠️ Cự ly hiện tại ({captainDistance}) không hợp lệ. Vui lòng chọn 42km hoặc 21km.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Giới tính <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCaptainGender('Nam')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase transition-all ${
                    captainGender === 'Nam'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setCaptainGender('Nữ')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase transition-all ${
                    captainGender === 'Nữ'
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vai trò trong đội hình <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCaptainRole('official')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase transition-all ${
                    captainRole === 'official'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Chính thức (Official)
                </button>
                <button
                  type="button"
                  onClick={() => setCaptainRole('reserve')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase transition-all ${
                    captainRole === 'reserve'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Dự bị (Reserve)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              Boolean(distanceDisallowedError) ||
              (captainDistance !== '42km' && captainDistance !== '21km')
            }
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-[#FF4500] hover:from-orange-500 hover:to-[#FF5722] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Đang lưu vào cơ sở dữ liệu...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Hoàn tất & Khởi tạo Đội đua</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
