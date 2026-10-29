import React, { useState } from 'react';
import { Team, TeamMember, TeamCategory, TeamStatus, ActiveScreen } from '../../types';
import { calculateQuota } from '../../utils/rules';
import {
  Trophy,
  Users,
  Search,
  PlusCircle,
  UserPlus,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';

interface TeamDirectoryProps {
  teams: Team[];
  members: TeamMember[];
  onSelectTeam: (team: Team) => void;
  onNavigate: (screen: ActiveScreen) => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  teams,
  members,
  onSelectTeam,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TeamCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TeamStatus>('all');

  // Calculate overall stats
  const totalAthletes = members.length;
  const count42k = teams.filter((t) => t.category === '42km').length;
  const count21k = teams.filter((t) => t.category === '21km').length;
  const countRecruiting = teams.filter((t) => t.status === 'recruiting').length;

  // Filtered teams
  const filteredTeams = teams.filter((team) => {
    const matchSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.captain_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || team.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || team.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Athletic Banner */}
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <img
            src="/src/assets/images/hero_marathon_team_1793155356793.jpg"
            alt="Marathon team running together"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-105 transform hover:scale-100 transition-transform duration-700"
          />
          {/* High-contrast sports athletic scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080C15] via-[#080C15]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080C15] via-[#080C15]/50 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-athletic px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-orange-600 text-white flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5" /> Giải Đua Marathon Đồng Đội
              </span>
              <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">
                Cơ cấu cứng 18 VĐV
              </span>
            </div>
            <h1 className="font-athletic text-3xl sm:text-4xl md:text-5xl font-black uppercase text-white tracking-tight leading-none">
              QUẢN LÝ ĐĂNG KÝ <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">NHÓM ĐUA ĐỒNG ĐỘI</span>
            </h1>
            <p className="text-sm text-slate-300 line-clamp-2">
              Hệ thống quản lý nhóm đua 42km và 21km. Tự động kiểm soát chỉ tiêu 18 thành viên: 15 Chính thức (10 Nam + 5 Nữ) & 3 Dự bị (2 Nam + 1 Nữ).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('create')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-[#FF4500] hover:from-orange-500 hover:to-[#FF5722] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-600/30 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo nhóm mới</span>
            </button>
            <button
              onClick={() => onNavigate('join')}
              className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-orange-400" />
              <span>Gia nhập nhóm</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tổng số Đội đua</div>
          <div className="font-athletic text-3xl font-black text-white mt-1 flex items-baseline gap-2">
            <span className="font-mono-num">{teams.length}</span>
            <span className="text-xs text-slate-500 font-normal">đội</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Hạng mục 42KM</div>
          <div className="font-athletic text-3xl font-black text-orange-400 mt-1 flex items-baseline gap-2">
            <span className="font-mono-num">{count42k}</span>
            <span className="text-xs text-slate-500 font-normal">đội</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Hạng mục 21KM</div>
          <div className="font-athletic text-3xl font-black text-amber-400 mt-1 flex items-baseline gap-2">
            <span className="font-mono-num">{count21k}</span>
            <span className="text-xs text-slate-500 font-normal">đội</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Tổng VĐV Đã Ghi Danh</div>
          <div className="font-athletic text-3xl font-black text-emerald-400 mt-1 flex items-baseline gap-2">
            <span className="font-mono-num">{totalAthletes}</span>
            <span className="text-xs text-slate-500 font-normal">chân chạy</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên đội hoặc họ tên đội trưởng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Category & Status Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả cự ly
            </button>
            <button
              onClick={() => setCategoryFilter('42km')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === '42km'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              42KM
            </button>
            <button
              onClick={() => setCategoryFilter('21km')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === '21km'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              21KM
            </button>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500 font-semibold"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="recruiting">Đang gom quân</option>
            <option value="completed">Đủ 18 người</option>
            <option value="locked">Đã khóa sổ</option>
          </select>
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-athletic text-xl font-bold uppercase text-slate-300">
            Không tìm thấy đội đua phù hợp
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút "Tạo nhóm mới" để khởi tạo đội đua đầu tiên cho giải!
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider"
          >
            <PlusCircle className="w-4 h-4" /> Tạo nhóm ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const teamMembers = members.filter((m) => m.team_id === team.id);
            const quota = calculateQuota(teamMembers);

            const getStatusBadge = () => {
              switch (team.status) {
                case 'recruiting':
                  return (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Đang gom quân
                    </span>
                  );
                case 'completed':
                  return (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-950/60 border border-blue-500/40 text-blue-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đủ 18 người
                    </span>
                  );
                case 'locked':
                  return (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-300">
                      Đã khóa
                    </span>
                  );
              }
            };

            return (
              <div
                key={team.id}
                onClick={() => onSelectTeam(team)}
                className="group relative rounded-2xl bg-gradient-to-b from-[#101726] to-[#0A0E17] border border-slate-800 hover:border-orange-500/50 p-5 shadow-lg hover:shadow-orange-600/10 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top line with Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-athletic px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-orange-600 text-white shadow-sm">
                      {team.category}
                    </span>
                    {getStatusBadge()}
                  </div>

                  {/* Team Name */}
                  <div>
                    <h3 className="font-athletic text-2xl font-black uppercase text-white group-hover:text-orange-400 transition-colors tracking-wide leading-tight line-clamp-1">
                      {team.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>Đội trưởng:</span>{' '}
                      <strong className="text-slate-200">{team.captain_name}</strong>
                    </p>
                  </div>

                  {/* Quota Progress Meter */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-400" /> Tiến độ số lượng:
                      </span>
                      <span className="font-mono-num font-bold text-base text-white">
                        {quota.total}
                        <span className="text-xs text-slate-500 font-normal">/18 VĐV</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${(quota.officialMale / 18) * 100}%` }}
                        className="bg-blue-500 h-full"
                        title={`Nam chính thức: ${quota.officialMale}/10`}
                      />
                      <div
                        style={{ width: `${(quota.officialFemale / 18) * 100}%` }}
                        className="bg-rose-500 h-full"
                        title={`Nữ chính thức: ${quota.officialFemale}/5`}
                      />
                      <div
                        style={{ width: `${(quota.reserveMale / 18) * 100}%` }}
                        className="bg-cyan-500 h-full"
                        title={`Nam dự bị: ${quota.reserveMale}/2`}
                      />
                      <div
                        style={{ width: `${(quota.reserveFemale / 18) * 100}%` }}
                        className="bg-pink-400 h-full"
                        title={`Nữ dự bị: ${quota.reserveFemale}/1`}
                      />
                    </div>

                    {/* Compact breakdown pills */}
                    <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                      <div className="text-slate-400">
                        Chính thức:{' '}
                        <span className="font-mono-num font-semibold text-slate-200">
                          {quota.officialCount}/15
                        </span>
                      </div>
                      <div className="text-slate-400 text-right">
                        Dự bị:{' '}
                        <span className="font-mono-num font-semibold text-slate-200">
                          {quota.reserveCount}/3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer CTA */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-orange-400 transition-colors">
                  <span>Xem chi tiết đội hình</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-orange-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
