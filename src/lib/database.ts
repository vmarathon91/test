import { MarathonRegistration, MemberGender, MemberRole, Team, TeamCategory, TeamMember, TeamStatus, UserSession } from '../types';
import { calculateQuota, canSwitchRole, validateSlotAvailability } from '../utils/rules';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY_TEAMS = 'marathon_teams_v1';
const STORAGE_KEY_MEMBERS = 'marathon_members_v1';
const STORAGE_KEY_USER = 'marathon_current_user_v1';

// Default mock current user (Captain of team 1 by default so user can test all captain actions immediately)
const DEFAULT_USER: UserSession = {
  id: 'c0a80101-0000-4000-8000-000000000001',
  name: 'Nguyễn Văn Hùng',
  email: 'hung.nguyen@marathon.vn',
  phone: '0912345678',
  isCaptain: true,
};

// Seed sample data for high-fidelity athletic experience
const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-42k-hn-01',
    user_id: 'c0a80101-0000-4000-8000-000000000001',
    name: 'Hà Nội Ultra Pacers 42K',
    passcode: 'HN42K',
    category: '42km',
    captain_name: 'Nguyễn Văn Hùng',
    captain_phone: '0912345678',
    captain_email: 'hung.nguyen@marathon.vn',
    status: 'recruiting',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'team-21k-sg-02',
    user_id: 'c0a80101-0000-4000-8000-000000000099',
    name: 'Sài Gòn Red Runners 21K',
    passcode: 'SG21K',
    category: '21km',
    captain_name: 'Trần Thị Mai',
    captain_phone: '0987654321',
    captain_email: 'mai.tran@saigonrunners.vn',
    status: 'recruiting',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'team-42k-dn-03',
    user_id: 'c0a80101-0000-4000-8000-000000000088',
    name: 'Đà Nẵng Coastal Striders 42K',
    passcode: 'DN42K',
    category: '42km',
    captain_name: 'Lê Hoàng Nam',
    captain_phone: '0905123456',
    captain_email: 'nam.le@coastalstriders.vn',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const INITIAL_MEMBERS: TeamMember[] = [
  // Team 1: 12 members (8 Nam official, 3 Nữ official, 1 Nam reserve)
  {
    id: 'm-01',
    user_id: 'c0a80101-0000-4000-8000-000000000001',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4201',
    full_name: 'Nguyễn Văn Hùng (Đội trưởng)',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'm-02',
    user_id: 'user-02',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4202',
    full_name: 'Đỗ Đức Thắng',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 2.8).toISOString(),
  },
  {
    id: 'm-03',
    user_id: 'user-03',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4203',
    full_name: 'Phạm Minh Quân',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 2.5).toISOString(),
  },
  {
    id: 'm-04',
    user_id: 'user-04',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4204',
    full_name: 'Vũ Quốc Toàn',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 2.2).toISOString(),
  },
  {
    id: 'm-05',
    user_id: 'user-05',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4205',
    full_name: 'Hoàng Anh Tuấn',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 2.0).toISOString(),
  },
  {
    id: 'm-06',
    user_id: 'user-06',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4206',
    full_name: 'Lê Minh Trí',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 1.8).toISOString(),
  },
  {
    id: 'm-07',
    user_id: 'user-07',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4207',
    full_name: 'Bùi Thanh Tùng',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
  {
    id: 'm-08',
    user_id: 'user-08',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4208',
    full_name: 'Ngô Trọng Nghĩa',
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 1.2).toISOString(),
  },
  // Nữ Official (3/5)
  {
    id: 'm-09',
    user_id: 'user-09',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4209',
    full_name: 'Nguyễn Thị Thu Thủy',
    gender: 'Nữ',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 1.0).toISOString(),
  },
  {
    id: 'm-10',
    user_id: 'user-10',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4210',
    full_name: 'Lê Khánh Linh',
    gender: 'Nữ',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 0.8).toISOString(),
  },
  {
    id: 'm-11',
    user_id: 'user-11',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4211',
    full_name: 'Trương Ngọc Ánh',
    gender: 'Nữ',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 0.6).toISOString(),
  },
  // Nam Reserve (1/2)
  {
    id: 'm-12',
    user_id: 'user-12',
    team_id: 'team-42k-hn-01',
    bib_number: 'BIB-4212',
    full_name: 'Đặng Quốc Huy',
    gender: 'Nam',
    distance: '42km',
    role: 'reserve',
    joined_at: new Date(Date.now() - 86400000 * 0.3).toISOString(),
  },

  // Team 2: Saigon Red Runners (5 members)
  {
    id: 'm-201',
    user_id: 'c0a80101-0000-4000-8000-000000000099',
    team_id: 'team-21k-sg-02',
    bib_number: 'BIB-2101',
    full_name: 'Trần Thị Mai (Đội trưởng)',
    gender: 'Nữ',
    distance: '21km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'm-202',
    user_id: 'user-202',
    team_id: 'team-21k-sg-02',
    bib_number: 'BIB-2102',
    full_name: 'Lâm Hải Đăng',
    gender: 'Nam',
    distance: '21km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
  {
    id: 'm-203',
    user_id: 'user-203',
    team_id: 'team-21k-sg-02',
    bib_number: 'BIB-2103',
    full_name: 'Võ Minh Kha',
    gender: 'Nam',
    distance: '21km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 1.2).toISOString(),
  },
  {
    id: 'm-204',
    user_id: 'user-204',
    team_id: 'team-21k-sg-02',
    bib_number: 'BIB-2104',
    full_name: 'Dương Thị Phương',
    gender: 'Nữ',
    distance: '21km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'm-205',
    user_id: 'user-205',
    team_id: 'team-21k-sg-02',
    bib_number: 'BIB-2105',
    full_name: 'Huỳnh Đức Thiện',
    gender: 'Nam',
    distance: '21km',
    role: 'reserve',
    joined_at: new Date(Date.now() - 86400000 * 0.5).toISOString(),
  },
];

// Helper to seed complete 18 members for Team 3
for (let i = 1; i <= 10; i++) {
  INITIAL_MEMBERS.push({
    id: `m-30${i}`,
    user_id: i === 1 ? 'c0a80101-0000-4000-8000-000000000088' : `user-dn-m-${i}`,
    team_id: 'team-42k-dn-03',
    bib_number: `BIB-30${i < 10 ? '0' + i : i}`,
    full_name: i === 1 ? 'Lê Hoàng Nam (Đội trưởng)' : `VĐV Nam ${i}`,
    gender: 'Nam',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  });
}
for (let i = 1; i <= 5; i++) {
  INITIAL_MEMBERS.push({
    id: `m-31${i}`,
    user_id: `user-dn-f-${i}`,
    team_id: 'team-42k-dn-03',
    bib_number: `BIB-310${i}`,
    full_name: `VĐV Nữ ${i}`,
    gender: 'Nữ',
    distance: '42km',
    role: 'official',
    joined_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  });
}
INITIAL_MEMBERS.push({
  id: 'm-321',
  user_id: 'user-dn-rm-1',
  team_id: 'team-42k-dn-03',
  bib_number: 'BIB-3201',
  full_name: 'VĐV Nam Dự Bị 1',
  gender: 'Nam',
  distance: '42km',
  role: 'reserve',
  joined_at: new Date(Date.now() - 86400000 * 3.8).toISOString(),
});
INITIAL_MEMBERS.push({
  id: 'm-322',
  user_id: 'user-dn-rm-2',
  team_id: 'team-42k-dn-03',
  bib_number: 'BIB-3202',
  full_name: 'VĐV Nam Dự Bị 2',
  gender: 'Nam',
  distance: '42km',
  role: 'reserve',
  joined_at: new Date(Date.now() - 86400000 * 3.7).toISOString(),
});
INITIAL_MEMBERS.push({
  id: 'm-323',
  user_id: 'user-dn-rf-1',
  team_id: 'team-42k-dn-03',
  bib_number: 'BIB-3203',
  full_name: 'VĐV Nữ Dự Bị 1',
  gender: 'Nữ',
  distance: '42km',
  role: 'reserve',
  joined_at: new Date(Date.now() - 86400000 * 3.6).toISOString(),
});

function loadLocalTeams(): Team[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(INITIAL_TEAMS));
      return INITIAL_TEAMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEAMS;
  }
}

function saveLocalTeams(teams: Team[]) {
  localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
}

function loadLocalMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEMBERS;
  }
}

function saveLocalMembers(members: TeamMember[]) {
  localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
}

// Session management
export function getCurrentUser(): UserSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function setCurrentUser(user: UserSession) {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

// Generate random UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Sample registrations mapped from database schema & user table
const SAMPLE_REGISTRATIONS: MarathonRegistration[] = [
  // Live records from user Supabase table marathon_registrations
  { user_id: 617986, ho_ten: 'N Khoa', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0912347888', cccd: '0227' },
  { user_id: 617816, ho_ten: 'L Anh', gioi_tinh: 'Nữ', cu_ly: '21km', sdt: '0987652892', cccd: '6896' },
  { user_id: 617814, ho_ten: 'T PHƯƠNG', gioi_tinh: 'Nữ', cu_ly: '42km', sdt: '0905121800', cccd: '7565' },
  { user_id: 617761, ho_ten: 'N Dejpetch', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0933127896', cccd: '8012' },
  { user_id: 617734, ho_ten: 'V Quỳnh', gioi_tinh: 'Nữ', cu_ly: '21km', sdt: '0944985398', cccd: '8834' },
  { user_id: 617599, ho_ten: 'N Anh', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0977110297', cccd: '4388' },
  { user_id: 617587, ho_ten: 'H Hiếu', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0918880166', cccd: '6285' },
  { user_id: 617487, ho_ten: 'V Minh', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0966555930', cccd: '0081' },
  { user_id: 617479, ho_ten: 'L Huỳnh', gioi_tinh: 'Nam', cu_ly: '21km', sdt: '0903336969', cccd: '3377' },
  { user_id: 617409, ho_ten: 'H Thanh', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0912235548', cccd: '4801' },
  { user_id: 617405, ho_ten: 'Y MINGXIA', gioi_tinh: 'Nữ', cu_ly: '21km', sdt: '0938886085', cccd: '0264' },
  { user_id: 617398, ho_ten: 'P Yulu', gioi_tinh: 'Nữ', cu_ly: '42km', sdt: '0945556850', cccd: '2611' },
  { user_id: 617396, ho_ten: 'P Zixuan', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0923335348', cccd: '3636' },
  // Sample entries with 5km & 10km to test invalid distance validation
  { user_id: 617105, ho_ten: 'Đặng Tuấn Kiệt', gioi_tinh: 'Nam', cu_ly: '5km', sdt: '0912000555', cccd: '5555' },
  { user_id: 617110, ho_ten: 'Nguyễn Thị Hoa', gioi_tinh: 'Nữ', cu_ly: '10km', sdt: '0912000100', cccd: '1010' },
  // Standard test codes
  { user_id: 1001, ho_ten: 'Nguyễn Văn Hùng', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0912345678' },
  { user_id: 1002, ho_ten: 'Trần Thị Mai', gioi_tinh: 'Nữ', cu_ly: '21km', sdt: '0987654321' },
  { user_id: 1003, ho_ten: 'Lê Hoàng Nam', gioi_tinh: 'Nam', cu_ly: '42km', sdt: '0905123456' },
];

// Unified Database API
export const api = {
  /**
   * Look up athlete registration by Mã đăng ký (user_id in table marathon_registrations)
   * Returns: Họ tên, Giới tính, Cự ly
   */
  async lookupRegistration(rawCode: string): Promise<MarathonRegistration | null> {
    if (!rawCode || !rawCode.trim()) return null;
    const trimmed = rawCode.trim();

    // Check Supabase table marathon_registrations first
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const isNumeric = /^\d+$/.test(trimmed);
        if (isNumeric) {
          const numId = parseInt(trimmed, 10);
          const { data, error } = await supabase
            .from('marathon_registrations')
            .select('*')
            .eq('user_id', numId)
            .maybeSingle();

          if (!error && data) {
            let gender: MemberGender = 'Nam';
            const rawGender = String(data.gioi_tinh || '').trim().toLowerCase();
            if (rawGender.includes('nữ') || rawGender.includes('nu') || rawGender.includes('female')) {
              gender = 'Nữ';
            }

            let dist = String(data.cu_ly || '').trim();
            if (/42/i.test(dist)) dist = '42km';
            else if (/21/i.test(dist)) dist = '21km';
            else if (/10/i.test(dist)) dist = '10km';
            else if (/5/i.test(dist)) dist = '5km';
            else dist = dist || '42km';

            return {
              id: data.id,
              user_id: data.user_id,
              ho_ten: data.ho_ten || data.full_name || data.name || '',
              gioi_tinh: gender,
              cu_ly: dist,
              sdt: data.sdt || data.phone,
              cccd: data.cccd,
            };
          }
        }
      } catch (err) {
        console.warn('Supabase lookupRegistration error:', err);
      }
    }

    // Check sample fallback list (handles numeric 1001 or "REG-1001")
    const match = SAMPLE_REGISTRATIONS.find(
      (r) =>
        String(r.user_id).toLowerCase() === trimmed.toLowerCase() ||
        `reg-${r.user_id}`.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) return match;

    return null;
  },

  /**
   * Reset data to realistic initial marathon squads
   */
  resetSampleData() {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(INITIAL_TEAMS));
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(DEFAULT_USER));
  },

  /**
   * Get all teams
   */
  async getTeams(): Promise<Team[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data as Team[];
        }
        console.warn('Supabase fetchTeams error, falling back to local DB:', error);
      } catch (err) {
        console.warn('Supabase network error:', err);
      }
    }
    return loadLocalTeams().sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  /**
   * Get a single team by ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('teams').select('*').eq('id', id).single();
        if (!error && data) {
          return data as Team;
        }
      } catch (e) {
        console.warn('Supabase getTeamById error:', e);
      }
    }
    const teams = loadLocalTeams();
    return teams.find((t) => t.id === id) || null;
  },

  /**
   * Get all members of a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .order('joined_at', { ascending: true });
        if (!error && data) {
          return data as TeamMember[];
        }
      } catch (e) {
        console.warn('Supabase getTeamMembers error:', e);
      }
    }
    const members = loadLocalMembers();
    return members
      .filter((m) => m.team_id === teamId)
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
  },

  /**
   * Get all members across all teams (for duplicate BIB validation)
   */
  async getAllMembers(): Promise<TeamMember[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('team_members').select('*');
        if (!error && data) return data as TeamMember[];
      } catch (e) {
        console.warn('Supabase getAllMembers error:', e);
      }
    }
    return loadLocalMembers();
  },

  /**
   * Create Team and Insert Captain Member
   */
  async createTeam(
    teamInput: {
      name: string;
      passcode: string;
      category: TeamCategory;
      captain_name: string;
      captain_phone: string;
      captain_email: string;
    },
    captainMemberInput: {
      bib_number: string | null;
      gender: MemberGender;
      distance: string;
      role: MemberRole;
    }
  ): Promise<{ team: Team; member: TeamMember }> {
    const currentUser = getCurrentUser();
    const teamId = generateUUID();
    const memberId = generateUUID();
    const now = new Date().toISOString();

    // Check duplicate team name
    const allTeams = await this.getTeams();
    if (allTeams.some((t) => t.name.trim().toLowerCase() === teamInput.name.trim().toLowerCase())) {
      throw new Error(`Tên đội "${teamInput.name}" đã tồn tại! Vui lòng chọn tên khác.`);
    }

    const newTeam: Team = {
      id: teamId,
      user_id: currentUser.id,
      name: teamInput.name.trim(),
      passcode: teamInput.passcode.trim(),
      category: teamInput.category,
      captain_name: teamInput.captain_name.trim(),
      captain_phone: teamInput.captain_phone.trim(),
      captain_email: teamInput.captain_email.trim(),
      status: 'recruiting',
      created_at: now,
    };

    const newMember: TeamMember = {
      id: memberId,
      user_id: currentUser.id,
      team_id: teamId,
      bib_number: captainMemberInput.bib_number?.trim() || null,
      full_name: `${teamInput.captain_name.trim()} (Đội trưởng)`,
      gender: captainMemberInput.gender,
      distance: captainMemberInput.distance || teamInput.category,
      role: captainMemberInput.role,
      joined_at: now,
    };

    // Try Supabase first
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: teamErr } = await supabase.from('teams').insert([newTeam]);
        if (teamErr) throw teamErr;

        const { error: memErr } = await supabase.from('team_members').insert([newMember]);
        if (memErr) throw memErr;

        return { team: newTeam, member: newMember };
      } catch (err: any) {
        console.warn('Supabase insert failed, storing in local fallback:', err);
      }
    }

    // Local DB fallback
    const teams = loadLocalTeams();
    teams.unshift(newTeam);
    saveLocalTeams(teams);

    const members = loadLocalMembers();
    members.push(newMember);
    saveLocalMembers(members);

    return { team: newTeam, member: newMember };
  },

  /**
   * Join an existing team with strict marathon rules validation
   */
  async joinTeam(
    teamId: string,
    passcode: string,
    memberInput: {
      full_name: string;
      bib_number: string | null;
      gender: MemberGender;
      distance: string;
      role: MemberRole;
    }
  ): Promise<TeamMember> {
    const team = await this.getTeamById(teamId);
    if (!team) {
      throw new Error('Đội đua không tồn tại hoặc đã bị xóa.');
    }

    // Status check
    if (team.status === 'locked') {
      throw new Error('Đội đua này đã bị khóa sổ danh sách thi đấu (locked), không nhận thêm VĐV.');
    }

    // Passcode check
    if (passcode.trim().toUpperCase() !== team.passcode.trim().toUpperCase()) {
      throw new Error('Mật khẩu nhóm (Passcode) không chính xác! Vui lòng liên hệ Đội trưởng.');
    }

    // Load current members of this team
    const currentMembers = await this.getTeamMembers(teamId);

    // Hard Rules Quota Check
    const quotaCheck = validateSlotAvailability(
      currentMembers,
      memberInput.gender,
      memberInput.role
    );
    if (!quotaCheck.valid) {
      throw new Error(quotaCheck.error);
    }

    const currentUser = getCurrentUser();
    // Check if current user is already in this team
    const alreadyInTeam = currentMembers.some(
      (m) =>
        m.user_id === currentUser.id ||
        m.full_name.trim().toLowerCase() === memberInput.full_name.trim().toLowerCase()
    );
    if (alreadyInTeam) {
      throw new Error('Bạn hoặc VĐV này đã có tên trong danh sách của đội đua này.');
    }

    const memberId = generateUUID();
    const newMember: TeamMember = {
      id: memberId,
      user_id: currentUser.id,
      team_id: teamId,
      bib_number: memberInput.bib_number?.trim() || null,
      full_name: memberInput.full_name.trim(),
      gender: memberInput.gender,
      distance: memberInput.distance || team.category,
      role: memberInput.role,
      joined_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('team_members').insert([newMember]);
        if (!error) {
          // If total reaches 18, check if status should become completed
          if (currentMembers.length + 1 >= 18 && team.status === 'recruiting') {
            await supabase.from('teams').update({ status: 'completed' }).eq('id', teamId);
          }
          return newMember;
        }
      } catch (e) {
        console.warn('Supabase joinTeam error:', e);
      }
    }

    // Local DB fallback
    const members = loadLocalMembers();
    members.push(newMember);
    saveLocalMembers(members);

    // Auto-update status to completed if 18 reached
    if (currentMembers.length + 1 >= 18 && team.status === 'recruiting') {
      const teams = loadLocalTeams();
      const t = teams.find((item) => item.id === teamId);
      if (t) {
        t.status = 'completed';
        saveLocalTeams(teams);
      }
    }

    return newMember;
  },

  /**
   * Kick a member (Captain only)
   */
  async kickMember(teamId: string, memberId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('team_members').delete().eq('id', memberId);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase kickMember error:', e);
      }
    }
    const members = loadLocalMembers();
    const filtered = members.filter((m) => m.id !== memberId);
    saveLocalMembers(filtered);

    // If team was completed and now has < 18, set status back to recruiting if not locked
    const remaining = filtered.filter((m) => m.team_id === teamId);
    if (remaining.length < 18) {
      const teams = loadLocalTeams();
      const t = teams.find((item) => item.id === teamId);
      if (t && t.status === 'completed') {
        t.status = 'recruiting';
        saveLocalTeams(teams);
      }
    }

    return true;
  },

  /**
   * Toggle a member's role (official <-> reserve) (Captain only)
   */
  async toggleMemberRole(teamId: string, memberId: string): Promise<TeamMember> {
    const members = await this.getTeamMembers(teamId);
    const target = members.find((m) => m.id === memberId);
    if (!target) throw new Error('Không tìm thấy thông tin thành viên.');

    const check = canSwitchRole(target, members);
    if (!check.canSwitch) {
      throw new Error(check.error || 'Không thể chuyển đổi vai trò do quy định giới hạn slot.');
    }

    const newRole = check.targetRole;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .update({ role: newRole })
          .eq('id', memberId)
          .select()
          .single();
        if (!error && data) return data as TeamMember;
      } catch (e) {
        console.warn('Supabase toggleMemberRole error:', e);
      }
    }

    // Local DB fallback
    const allMembers = loadLocalMembers();
    const m = allMembers.find((item) => item.id === memberId);
    if (m) {
      m.role = newRole;
      saveLocalMembers(allMembers);
      return m;
    }
    target.role = newRole;
    return target;
  },

  /**
   * Update team status ('recruiting' | 'completed' | 'locked') (Captain only)
   */
  async updateTeamStatus(teamId: string, status: TeamStatus): Promise<Team> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('teams')
          .update({ status })
          .eq('id', teamId)
          .select()
          .single();
        if (!error && data) return data as Team;
      } catch (e) {
        console.warn('Supabase updateTeamStatus error:', e);
      }
    }

    const teams = loadLocalTeams();
    const t = teams.find((item) => item.id === teamId);
    if (!t) throw new Error('Đội không tồn tại.');
    t.status = status;
    saveLocalTeams(teams);
    return t;
  },
};
