import React, { useState } from 'react';
import { Team, TeamMember, UserSession, TeamStatus } from '../types';
import { calculateQuota, canSwitchRole } from '../utils/rules';
import { api } from '../lib/database';
import {
  X,
  Users,
  ShieldCheck,
  Key,
  Copy,
  Check,
  ArrowUpDown,
  UserMinus,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  UserPlus
} from 'lucide-react';

interface TeamDetailModalProps {
  team: Team;
  members: TeamMember[];
  currentUser: UserSession;
  onClose: () => void;
  onRefresh: () => void;
  onNavigateToJoin: (teamId: string) => void;
}

export const TeamDetailModal: React.FC<TeamDetailModalProps> = ({
  team,
  members,
  currentUser,
  onClose,
  onRefresh,
  onNavigateToJoin,
}) => {
  const isCaptain = team.user_id === currentUser.id;
  const quota = calculateQuota(members);

  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Kick member confirmation modal state
  const [memberToKick, setMemberToKick] = useState<TeamMember | null>(null);

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(team.passcode);
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const handleKickMember = async () => {
    if (!memberToKick) return;
    try {
      setProcessingId(memberToKick.id);
      setErrorMsg(null);
      await api.kickMember(team.id, memberToKick.id);
      setSuccessMsg(`Đã loại VĐV "${memberToKick.full_name}" khỏi đội hình.`);
      setMemberToKick(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi loại thành viên.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleRole = async (member: TeamMember) => {
    const check = canSwitchRole(member, members);
    if (!check.canSwitch) {
      setErrorMsg(check.error || 'Không thể chuyển vai trò do slot đã đầy.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    try {
      setProcessingId(member.id);
      setErrorMsg(null);
      const updated = await api.toggleMemberRole(team.id, member.id);
      const roleText = updated.role === 'official' ? 'Chính thức' : 'Dự bị';
      setSuccessMsg(`Đã chuyển VĐV "${member.full_name}" sang suất ${roleText}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi chuyển đổi vai trò.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (newStatus: TeamStatus) => {
    try {
      setStatusLoading(true);
      setErrorMsg(null);
      await api.updateTeamStatus(team.id, newStatus);
      setSuccessMsg(`Trạng thái đội đã chuyển sang: ${getStatusLabel(newStatus)}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi cập nhật trạng thái.');
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusLabel = (status: TeamStatus) => {
    switch (status) {
      case 'recruiting':
        return 'Đang gom quân';
      case 'completed':
        return 'Đủ 18 người';
      case 'locked':
        return 'Đã khóa sổ';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0C1220] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#090D17] flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-athletic px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-orange-600 text-white">
                {team.category}
              </span>

              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  team.status === 'recruiting'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : team.status === 'completed'
                    ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                {getStatusLabel(team.status)}
              </span>

              {isCaptain && (
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Bạn là Đội trưởng
                </span>
              )}
            </div>

            <h2 className="font-athletic text-2xl md:text-3xl font-black uppercase text-white tracking-wide truncate">
              {team.name}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="text-slate-500">Đội trưởng:</span> <strong>{team.captain_name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> {team.captain_phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> {team.captain_email}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Khởi tạo:{' '}
                {new Date(team.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Captain Control Bar & Passcode Display */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Passcode section */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">
                  Mật khẩu nhóm (Passcode):
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-white tracking-widest bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {team.passcode}
                  </span>
                  <button
                    onClick={handleCopyPasscode}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Sao chép mật khẩu gửi VĐV"
                  >
                    {copiedPasscode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Captain Status Change Actions */}
            {isCaptain ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold mr-1">Chuyển trạng thái:</span>
                <button
                  disabled={statusLoading || team.status === 'recruiting'}
                  onClick={() => handleUpdateStatus('recruiting')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    team.status === 'recruiting'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Tuyển quân
                </button>
                <button
                  disabled={statusLoading || team.status === 'completed'}
                  onClick={() => handleUpdateStatus('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    team.status === 'completed'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Đủ 18 người
                </button>
                <button
                  disabled={statusLoading || team.status === 'locked'}
                  onClick={() => handleUpdateStatus('locked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    team.status === 'locked'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Khóa sổ
                </button>
              </div>
            ) : (
              <div>
                {team.status === 'recruiting' && !quota.isFull && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToJoin(team.id);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-600/30"
                  >
                    <UserPlus className="w-4 h-4" /> Đăng ký tham gia đội này
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quota Progress Breakdown According to Strict Tournament Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-athletic text-base font-bold uppercase text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Tiến Độ Cơ Cấu Nhân Sự (Quy mô: {quota.total}/18 VĐV)
              </h3>
              <span className="font-mono-num text-xs font-semibold text-slate-400">
                {quota.isFull ? (
                  <span className="text-emerald-400 font-bold">Đã đủ quân số 18/18</span>
                ) : (
                  <span>Còn thiếu {quota.remTotal} VĐV</span>
                )}
              </span>
            </div>

            {/* Visual multi-segmented bar for whole team */}
            <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700/60 p-0.5">
              {/* Official Male */}
              <div
                style={{ width: `${(quota.officialMale / 18) * 100}%` }}
                className="bg-blue-500 h-full rounded-l-full transition-all"
                title={`Nam chính thức: ${quota.officialMale}/10`}
              />
              {/* Official Female */}
              <div
                style={{ width: `${(quota.officialFemale / 18) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Nữ chính thức: ${quota.officialFemale}/5`}
              />
              {/* Reserve Male */}
              <div
                style={{ width: `${(quota.reserveMale / 18) * 100}%` }}
                className="bg-cyan-500 h-full transition-all"
                title={`Nam dự bị: ${quota.reserveMale}/2`}
              />
              {/* Reserve Female */}
              <div
                style={{ width: `${(quota.reserveFemale / 18) * 100}%` }}
                className="bg-pink-400 h-full transition-all"
                title={`Nữ dự bị: ${quota.reserveFemale}/1`}
              />
            </div>

            {/* Quota Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Official Male */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Nam chính thức</span>
                  <span className="text-[11px] text-blue-400 font-semibold">Tối đa 10</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-num text-2xl font-black text-white">
                    {quota.officialMale}
                    <span className="text-sm font-normal text-slate-500">/10</span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      quota.officialMale >= 10 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {quota.officialMale >= 10 ? 'Đã đủ' : `Còn ${quota.remOfficialMale}`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${(quota.officialMale / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Official Female */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Nữ chính thức</span>
                  <span className="text-[11px] text-rose-400 font-semibold">Tối đa 05</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-num text-2xl font-black text-white">
                    {quota.officialFemale}
                    <span className="text-sm font-normal text-slate-500">/5</span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      quota.officialFemale >= 5 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {quota.officialFemale >= 5 ? 'Đã đủ' : `Còn ${quota.remOfficialFemale}`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{ width: `${(quota.officialFemale / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Reserve Male */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Nam dự bị</span>
                  <span className="text-[11px] text-cyan-400 font-semibold">Tối đa 02</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-num text-2xl font-black text-white">
                    {quota.reserveMale}
                    <span className="text-sm font-normal text-slate-500">/2</span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      quota.reserveMale >= 2 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {quota.reserveMale >= 2 ? 'Đã đủ' : `Còn ${quota.remReserveMale}`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all"
                    style={{ width: `${(quota.reserveMale / 2) * 100}%` }}
                  />
                </div>
              </div>

              {/* Reserve Female */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Nữ dự bị</span>
                  <span className="text-[11px] text-pink-400 font-semibold">Tối đa 01</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono-num text-2xl font-black text-white">
                    {quota.reserveFemale}
                    <span className="text-sm font-normal text-slate-500">/1</span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      quota.reserveFemale >= 1 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {quota.reserveFemale >= 1 ? 'Đã đủ' : `Còn ${quota.remReserveFemale}`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-pink-400 h-full transition-all"
                    style={{ width: `${(quota.reserveFemale / 1) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Member List Grid / Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-athletic text-base font-bold uppercase text-slate-200">
                Danh Sách Vận Động Viên ({members.length} VĐV)
              </h3>
              {isCaptain && (
                <span className="text-xs text-orange-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Có quyền Nâng/Hạ & Loại VĐV
                </span>
              )}
            </div>

            {members.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                Chưa có vận động viên nào trong đội hình.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080C15] text-slate-400 uppercase font-semibold border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">Vận Động Viên</th>
                      <th className="py-3 px-3">Giới tính</th>
                      <th className="py-3 px-3">Cự ly</th>
                      <th className="py-3 px-3">Vai trò</th>
                      <th className="py-3 px-3">Ngày tham gia</th>
                      {isCaptain && <th className="py-3 px-3 text-right">Thao tác Đội trưởng</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {members.map((m, idx) => {
                      const isMemberCaptain = m.user_id === team.user_id;
                      const roleCheck = canSwitchRole(m, members);
                      const isProcessing = processingId === m.id;

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 text-center font-mono-num text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-medium text-white">
                            <div className="flex items-center gap-2">
                              <span>{m.full_name}</span>
                              {isMemberCaptain && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/30 shrink-0">
                                  Đội trưởng
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                m.gender === 'Nam'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {m.gender}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono-num text-slate-300">{m.distance}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                m.role === 'official'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {m.role === 'official' ? 'Chính thức' : 'Dự bị'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono-num text-slate-400">
                            {new Date(m.joined_at).toLocaleDateString('vi-VN')}
                          </td>

                          {isCaptain && (
                            <td className="py-3 px-3 text-right">
                              {isMemberCaptain ? (
                                <span className="text-[11px] text-slate-500 italic">
                                  (Trưởng nhóm)
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Promote / Demote Button */}
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => handleToggleRole(m)}
                                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 border ${
                                      m.role === 'official'
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                    }`}
                                    title={
                                      roleCheck.canSwitch
                                        ? `Chuyển sang ${m.role === 'official' ? 'Dự bị' : 'Chính thức'}`
                                        : roleCheck.error
                                    }
                                  >
                                    <ArrowUpDown className="w-3 h-3" />
                                    <span>
                                      {m.role === 'official' ? 'Hạ Dự bị' : 'Nâng Chính thức'}
                                    </span>
                                  </button>

                                  {/* Kick Button */}
                                  <button
                                    disabled={isProcessing}
                                    onClick={() => setMemberToKick(m)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Loại VĐV khỏi nhóm"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Kick Confirmation Modal */}
        {memberToKick && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#111827] border border-rose-500/40 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-athletic text-lg font-bold uppercase text-white">
                  Xác nhận loại VĐV
                </h4>
              </div>
              <p className="text-xs text-slate-300">
                Bạn có chắc chắn muốn loại vận động viên{' '}
                <strong className="text-white font-semibold">"{memberToKick.full_name}"</strong>{' '}
                khỏi danh sách thi đấu của đội?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setMemberToKick(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleKickMember}
                  disabled={Boolean(processingId)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  {processingId ? 'Đang xử lý...' : 'Xác nhận loại'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
