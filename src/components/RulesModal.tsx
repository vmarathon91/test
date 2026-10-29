import React from 'react';
import { X, ShieldAlert, Users, Award, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-athletic text-2xl md:text-3xl font-black uppercase text-white tracking-wide">
              Điều Lệ Thi Đấu Marathon Đồng Đội
            </h2>
            <p className="text-sm text-slate-400">
              Quy định cơ cấu nhân sự & chỉ tiêu ngặt nghèo giải chạy đồng đội 42km & 21km
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          {/* Main Quota Breakdown Box */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-orange-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="font-athletic text-lg font-bold uppercase text-orange-400 flex items-center gap-2">
                <Users className="w-5 h-5" /> Quy mô chuẩn: 18 Thành viên / Đội
              </span>
              <span className="font-mono-num text-xs bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-md font-semibold border border-orange-500/30">
                Tối đa 18 VĐV
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Official Box */}
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> VĐV Chính thức (Official)
                  </span>
                  <span className="font-mono-num text-xs font-bold text-emerald-400">15 VĐV</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span>• Vận động viên Nam:</span>
                    <span className="font-mono-num font-bold text-white bg-slate-700/60 px-2 py-0.5 rounded">Tối đa 10 Nam</span>
                  </li>
                  <li className="flex justify-between items-center py-1">
                    <span>• Vận động viên Nữ:</span>
                    <span className="font-mono-num font-bold text-white bg-slate-700/60 px-2 py-0.5 rounded">Tối đa 05 Nữ</span>
                  </li>
                </ul>
              </div>

              {/* Reserve Box */}
              <div className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> VĐV Dự bị (Reserve)
                  </span>
                  <span className="font-mono-num text-xs font-bold text-amber-400">03 VĐV</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span>• Vận động viên Nam:</span>
                    <span className="font-mono-num font-bold text-white bg-slate-700/60 px-2 py-0.5 rounded">Tối đa 02 Nam</span>
                  </li>
                  <li className="flex justify-between items-center py-1">
                    <span>• Vận động viên Nữ:</span>
                    <span className="font-mono-num font-bold text-white bg-slate-700/60 px-2 py-0.5 rounded">Tối đa 01 Nữ</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Rules Details */}
          <div className="space-y-3">
            <h3 className="font-athletic text-base font-bold uppercase text-slate-200">
              Quy tắc đăng ký & kiểm soát hệ thống
            </h3>
            <ul className="space-y-2 text-slate-300 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">1.</span>
                <span><strong>Khởi tạo nhóm:</strong> Đội trưởng tạo nhóm sẽ mặc định được cấp quyền quản trị và điền sẵn một suất VĐV trong đội. Đội trưởng sở hữu Mật khẩu nhóm (Passcode) để phân phối cho các VĐV.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">2.</span>
                <span><strong>Gia nhập nhóm:</strong> Thành viên cần nhập chính xác Passcode của đội và lựa chọn Giới tính + Vai trò. Nếu chỉ tiêu đã đầy (ví dụ đã đủ 10 Nam chính thức), hệ thống sẽ từ chối đăng ký vào slot đó và yêu cầu chuyển sang Dự bị.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">3.</span>
                <span><strong>Quyền hạn Đội trưởng:</strong> Đội trưởng có quyền loại VĐV khỏi nhóm (Kick), linh hoạt Chuyển đổi VĐV giữa Chính thức và Dự bị (hệ thống kiểm tra tự động giới hạn slot đích), và chuyển trạng thái chốt sổ (Khóa nhóm).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">4.</span>
                <span><strong>Cự ly thi đấu đồng đội:</strong> Giải chỉ áp dụng cho 2 cự ly: <strong>42km</strong> và <strong>21km</strong>. Hệ thống tự động từ chối và chặn đăng ký đối với các VĐV đăng ký cự ly 5km hoặc 10km theo điều lệ giải.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold shrink-0">5.</span>
                <span><strong>Trạng thái nhóm:</strong>
                  <br />• <strong>Đang tuyển (recruiting):</strong> Mở đăng ký cho thành viên có passcode.
                  <br />• <strong>Đủ 18 người (completed):</strong> Đã lấp đầy toàn bộ 18 chỉ tiêu.
                  <br />• <strong>Đã khóa (locked):</strong> Đội trưởng chốt danh sách thi đấu gửi ban tổ chức, ngừng tiếp nhận thêm thành viên.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-300">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Mỗi vận động viên chỉ được tham gia tối đa 01 đội thi đấu duy nhất trong toàn bộ giải.</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-orange-600/30"
          >
            Đã hiểu thể lệ
          </button>
        </div>
      </div>
    </div>
  );
};
