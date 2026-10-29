import React, { useState, useEffect } from 'react';
import { Team, TeamMember, MemberGender, MemberRole, UserSession } from '../../types';
import { calculateQuota } from '../../utils/rules';
import { api } from '../../lib/database';
import {
  UserPlus,
  Key,
  Trophy,
  ArrowLeft,
  Check,
  AlertCircle,
  User,
  Users,
  ShieldAlert,
  Info,
  Search,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface JoinTeamProps {
  teams: Team[];
  members: TeamMember[];
  currentUser: UserSession;
  initialTeamId?: string;
  onJoined: (team: Team) => void;
  onCancel: () => void;
}

export const JoinTeam: React.FC<JoinTeamProps> = ({
  teams,
  members,
  currentUser,
  initialTeamId,
  onJoined,
  onCancel,
}) => {
  // Only teams that are in 'recruiting' status
  const recruitingTeams = teams.filter((t) => t.status === 'recruiting');

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    initialTeamId || (recruitingTeams[0] ? recruitingTeams[0].id : '')
  );
  const [passcode, setPasscode] = useState('');

  // Registration code lookup
  const [registrationCode, setRegistrationCode] = useState('');
  const [regLookupLoading, setRegLookupLoading] = useState(false);
  const [regLookupSuccess, setRegLookupSuccess] = useState<string | null>(null);
  const [regLookupError, setRegLookupError] = useState<string | null>(null);
  const [distanceDisallowedError, setDistanceDisallowedError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(currentUser.name || '');
  const [gender, setGender] = useState<MemberGender>('Nam');
  const [distance, setDistance] = useState('42km');
  const [role, setRole] = useState<MemberRole>('official');

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
          setFullName(result.ho_ten);
        }
        if (result.gioi_tinh) {
          setGender(result.gioi_tinh);
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
          setDistance(result.cu_ly);
          setDistanceDisallowedError(
            `Cự ly "${result.cu_ly}" không hợp điều lệ thi đấu marathon đồng đội. Giải chỉ tiếp nhận đăng ký đồng đội cho cự ly 42km hoặc 21km!`
          );
          setRegLookupSuccess(null);
        } else {
          setDistanceDisallowedError(null);
          const validDist = distStr.includes('21') ? '21km' : '42km';
          setDistance(validDist);
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

  // Sync selected team
  const currentTeam = teams.find((t) => t.id === selectedTeamId);
  const currentTeamMembers = members.filter((m) => m.team_id === selectedTeamId);
  const quota = calculateQuota(currentTeamMembers);

  useEffect(() => {
    if (currentTeam) {
      setDistance(currentTeam.category);
    }
  }, [currentTeam]);

  // Compute live slot warning for selected gender and role
  const getSlotStatus = () => {
    if (!currentTeam) return null;

    if (role === 'official') {
      if (gender === 'Nam') {
        const full = quota.officialMale >= 10;
        return {
          full,
          current: quota.officialMale,
          max: 10,
          rem: quota.remOfficialMale,
          label: 'Nam chính thức',
        };
      } else {
        const full = quota.officialFemale >= 5;
        return {
          full,
          current: quota.officialFemale,
          max: 5,
          rem: quota.remOfficialFemale,
          label: 'Nữ chính thức',
        };
      }
    } else {
      // reserve
      if (gender === 'Nam') {
        const full = quota.reserveMale >= 2;
        return {
          full,
          current: quota.reserveMale,
          max: 2,
          rem: quota.remReserveMale,
          label: 'Nam dự bị',
        };
      } else {
        const full = quota.reserveFemale >= 1;
        return {
          full,
          current: quota.reserveFemale,
          max: 1,
          rem: quota.remReserveFemale,
          label: 'Nữ dự bị',
        };
      }
    }
  };

  const slotStatus = getSlotStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTeamId) {
      setErrorMsg('Vui lòng chọn đội muốn gia nhập.');
      return;
    }
    if (!passcode.trim()) {
      setErrorMsg('Vui lòng nhập Mật khẩu nhóm (Passcode) do Đội trưởng cung cấp.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên VĐV.');
      return;
    }

    // Check if distance is disallowed (5km/10km)
    if (
      distanceDisallowedError ||
      distance === '5km' ||
      distance === '10km' ||
      /^(5km|10km|5k|10k)$/i.test(distance)
    ) {
      setErrorMsg('Cự ly không hợp điều lệ thi đấu marathon đồng đội. Giải chỉ áp dụng cho cự ly 42km hoặc 21km.');
      return;
    }

    // Pre-flight check on slot before sending
    if (slotStatus?.full) {
      if (role === 'official') {
        setErrorMsg(
          `Slot ${slotStatus.label} đã đầy (${slotStatus.current}/${slotStatus.max}). Vui lòng chọn vai trò "Dự bị".`
        );
      } else {
        setErrorMsg(
          `Slot ${slotStatus.label} đã đầy (${slotStatus.current}/${slotStatus.max}). Không thể đăng ký thêm.`
        );
      }
      return;
    }

    try {
      setLoading(true);
      await api.joinTeam(selectedTeamId, passcode, {
        full_name: fullName.trim(),
        bib_number: null,
        gender,
        distance: distance || currentTeam?.category || '42km',
        role,
      });

      if (currentTeam) {
        onJoined(currentTeam);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gia nhập đội. Vui lòng kiểm tra lại thông tin.');
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
          Màn hình 3: Gia nhập Nhóm VĐV
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
            <UserPlus className="w-5 h-5" />
          </div>
          <h1 className="font-athletic text-3xl md:text-4xl font-black uppercase text-white tracking-wide">
            Đăng Ký Gia Nhập Đội Đua
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Vận động viên chọn đội đua đang tuyển quân, nhập mật khẩu Passcode của Đội trưởng và chọn vai trò thi đấu.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {recruitingTeams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-athletic text-xl font-bold uppercase text-slate-200">
            Hiện không có đội nào đang mở tuyển quân
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tất cả các đội hiện tại đã đủ 18 người hoặc đã khóa sổ thi đấu. Bạn có thể tự mình tạo một đội mới!
          </p>
          <button
            onClick={() => onCancel()}
            className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs uppercase"
          >
            Quay lại tổng quan
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Select Team & Passcode */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="font-athletic text-lg font-bold uppercase text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-400" />
                1. Chọn Đội Đua & Nhập Mật Khẩu Nhóm
              </h2>
              <span className="text-xs text-slate-500">
                {recruitingTeams.length} đội đang mở tuyển
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Select Team Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Đội muốn gia nhập <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {recruitingTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category}) - Đội trưởng: {t.captain_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Passcode input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật khẩu nhóm (Passcode) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Nhập Passcode do Đội trưởng cung cấp..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono tracking-wider focus:outline-none focus:border-orange-500 uppercase"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mật khẩu phân biệt chữ hoa/thường do Đội trưởng thiết lập khi tạo đội.
                </p>
              </div>
            </div>

            {/* Selected Team live quota preview */}
            {currentTeam && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">
                    Tình trạng slot hiện tại của <span className="text-orange-400">"{currentTeam.name}"</span>:
                  </span>
                  <span className="font-mono-num font-bold text-white">
                    {quota.total}/18 VĐV
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Nam chính thức</div>
                    <div className="font-mono-num font-bold text-white mt-0.5">
                      {quota.officialMale}/10
                    </div>
                    <div className="text-[10px] text-blue-400">
                      {quota.remOfficialMale > 0 ? `Còn ${quota.remOfficialMale}` : 'Hết slot'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Nữ chính thức</div>
                    <div className="font-mono-num font-bold text-white mt-0.5">
                      {quota.officialFemale}/5
                    </div>
                    <div className="text-[10px] text-rose-400">
                      {quota.remOfficialFemale > 0 ? `Còn ${quota.remOfficialFemale}` : 'Hết slot'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Nam dự bị</div>
                    <div className="font-mono-num font-bold text-white mt-0.5">
                      {quota.reserveMale}/2
                    </div>
                    <div className="text-[10px] text-cyan-400">
                      {quota.remReserveMale > 0 ? `Còn ${quota.remReserveMale}` : 'Hết slot'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Nữ dự bị</div>
                    <div className="font-mono-num font-bold text-white mt-0.5">
                      {quota.reserveFemale}/1
                    </div>
                    <div className="text-[10px] text-pink-400">
                      {quota.remReserveFemale > 0 ? `Còn ${quota.remReserveFemale}` : 'Hết slot'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Athlete Personal Details */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="font-athletic text-lg font-bold uppercase text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                2. Thông Tin Vận Động Viên & Vai Trò
              </h2>
              <span className="text-xs text-slate-500">Bảng: `team_members`</span>
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

              {/* Error notification & RLS guide */}
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
                    ⛔ <strong>Quy định Điều lệ:</strong> Nội dung Marathon Đồng đội chỉ áp dụng cho VĐV đăng ký cự ly <strong>42km</strong> hoặc <strong>21km</strong>. Cự ly 5km và 10km không hợp lệ để tham gia nhóm đồng đội.
                  </div>
                </div>
              )}
            </div>

            <div>
              {/* Full Name */}
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Họ và tên VĐV <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="VD: Trần Hoàng Nam"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
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
                    onClick={() => setGender('Nam')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase transition-all ${
                      gender === 'Nam'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Nữ')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold uppercase transition-all ${
                      gender === 'Nữ'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Nữ
                  </button>
                </div>
              </div>

              {/* Distance: Only 42km & 21km allowed */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cự ly đăng ký cá nhân <span className="text-orange-400 text-[11px]">(Chỉ áp dụng 42km hoặc 21km)</span>
                </label>
                <select
                  value={distance}
                  onChange={(e) => {
                    setDistance(e.target.value);
                    if (e.target.value === '42km' || e.target.value === '21km') {
                      setDistanceDisallowedError(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 font-medium"
                >
                  <option value="42km">42km Full Marathon</option>
                  <option value="21km">21km Half Marathon</option>
                </select>
                {distance !== '42km' && distance !== '21km' && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    ⚠️ Cự ly hiện tại ({distance}) không hợp lệ. Vui lòng chọn 42km hoặc 21km.
                  </p>
                )}
              </div>
            </div>

            {/* Desired Role with Instant Quota Validation Feedback */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vai trò mong muốn trong đội <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('official')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    role === 'official'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-athletic text-base font-bold uppercase text-emerald-400">
                      Chính Thức (Official)
                    </span>
                    <span className="text-[11px] font-mono-num text-slate-400">
                      {gender === 'Nam'
                        ? `${quota.officialMale}/10 Nam`
                        : `${quota.officialFemale}/5 Nữ`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {gender === 'Nam'
                      ? quota.officialMale >= 10
                        ? '❌ Đã hết slot Nam chính thức'
                        : `Còn ${quota.remOfficialMale} suất trống`
                      : quota.officialFemale >= 5
                      ? '❌ Đã hết slot Nữ chính thức'
                      : `Còn ${quota.remOfficialFemale} suất trống`}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('reserve')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    role === 'reserve'
                      ? 'bg-amber-600/20 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-athletic text-base font-bold uppercase text-amber-400">
                      Dự Bị (Reserve)
                    </span>
                    <span className="text-[11px] font-mono-num text-slate-400">
                      {gender === 'Nam'
                        ? `${quota.reserveMale}/2 Nam`
                        : `${quota.reserveFemale}/1 Nữ`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {gender === 'Nam'
                      ? quota.reserveMale >= 2
                        ? '❌ Đã hết slot Nam dự bị'
                        : `Còn ${quota.remReserveMale} suất trống`
                      : quota.reserveFemale >= 1
                      ? '❌ Đã hết slot Nữ dự bị'
                      : `Còn ${quota.remReserveFemale} suất trống`}
                  </p>
                </button>
              </div>

              {/* Slot warning indicator */}
              {slotStatus?.full && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Chỉ tiêu cho <strong>{slotStatus.label}</strong> đã đạt mức tối đa ({slotStatus.max}/{slotStatus.max}).{' '}
                    {role === 'official'
                      ? 'Vui lòng chọn vai trò "Dự bị" để tiếp tục.'
                      : 'Không thể thêm VĐV vào vị trí này.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
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
                Boolean(slotStatus?.full) ||
                Boolean(distanceDisallowedError) ||
                (distance !== '42km' && distance !== '21km')
              }
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-[#FF4500] hover:from-orange-500 hover:to-[#FF5722] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Đang xử lý gia nhập...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Xác nhận Tham gia Đội</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
