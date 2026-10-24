/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  ArrowLeft,
  Award,
  MapPin,
  School,
  Sparkles,
  QrCode,
  FileSpreadsheet
} from 'lucide-react';

export interface Attendee {
  id: string;
  name: string;
  school: string;
  category: string;
  track: string;
  lga: string;
  email: string;
  phone: string;
  registeredAt: string;
  checkedIn: boolean;
  notes?: string;
}

interface Stats {
  totalRegistered: number;
  checkedIn: number;
  pending: number;
  checkInRate: number;
  trackDistribution: Record<string, number>;
  lgaDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
}

interface AdminPanelProps {
  onBackToLanding: () => void;
}

const EBONYI_LGAS = [
  'Abakaliki',
  'Afikpo North',
  'Afikpo South',
  'Ebonyi',
  'Ezza North',
  'Ezza South',
  'Ikwo',
  'Ishielu',
  'Ivo',
  'Izzi',
  'Ohaozara',
  'Ohaukwu',
  'Onicha',
];

const TRACKS = [
  'AI, Code & Robotics',
  'Agri-Tech & Enterprise',
  'Creative Media & Design',
  'Civic Leadership & Law',
  'Global Scholarships',
];

export default function AdminPanel({ onBackToLanding }: AdminPanelProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedLga, setSelectedLga] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals inside Admin
  const [viewAttendee, setViewAttendee] = useState<Attendee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendees' | 'analytics'>('attendees');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New attendee form state
  const [newAttendee, setNewAttendee] = useState({
    name: '',
    school: '',
    category: 'Secondary Student',
    track: 'AI, Code & Robotics',
    lga: 'Abakaliki',
    email: '',
    phone: '',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch attendees from Express backend
  const fetchAttendees = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/attendees');
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees || []);
      }
      const statsRes = await fetch('/api/attendees/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Failed to fetch attendees:', err);
      showToast('Could not sync with server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, []);

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      const matchesSearch =
        searchQuery === '' ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery);

      const matchesTrack = selectedTrack === 'all' || a.track === selectedTrack;
      const matchesLga = selectedLga === 'all' || a.lga === selectedLga;
      const matchesCategory =
        selectedCategory === 'all' || a.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'checkedIn' && a.checkedIn) ||
        (selectedStatus === 'pending' && !a.checkedIn);

      return (
        matchesSearch &&
        matchesTrack &&
        matchesLga &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    attendees,
    searchQuery,
    selectedTrack,
    selectedLga,
    selectedCategory,
    selectedStatus,
  ]);

  // Toggle check-in status
  const handleToggleCheckIn = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/attendees/${id}/checkin`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setAttendees((prev) =>
          prev.map((att) => (att.id === id ? data.attendee : att))
        );
        if (viewAttendee && viewAttendee.id === id) {
          setViewAttendee(data.attendee);
        }
        showToast(data.message);
        // Refresh stats
        const statsRes = await fetch('/api/attendees/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      }
    } catch (err) {
      console.error('Checkin error:', err);
      showToast('Failed to update status');
    }
  };

  // Delete attendee
  const handleDeleteAttendee = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to remove registration ${id}?`)) return;

    try {
      const res = await fetch(`/api/attendees/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAttendees((prev) => prev.filter((a) => a.id !== id));
        if (viewAttendee?.id === id) setViewAttendee(null);
        showToast(`Registration ${id} deleted`);
        fetchAttendees();
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete registration');
    }
  };

  // Add walk-in attendee
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttendee),
      });
      if (res.ok) {
        const data = await res.json();
        setAttendees((prev) => [data.attendee, ...prev]);
        setShowAddModal(false);
        showToast(`Attendee ${data.attendee.name} registered!`);
        setNewAttendee({
          name: '',
          school: '',
          category: 'Secondary Student',
          track: 'AI, Code & Robotics',
          lga: 'Abakaliki',
          email: '',
          phone: '',
          notes: '',
        });
        fetchAttendees();
      }
    } catch (err) {
      console.error('Add error:', err);
      showToast('Failed to register student');
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Operations Bar */}
      <header className="border-b border-neutral-800 bg-[#0d0d10] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </button>
          <div className="h-4 w-[1px] bg-neutral-800" />
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold tracking-tight text-white leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              New and Proud Ebonyi
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Operations Desk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('attendees')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'attendees'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Attendees ({filteredAttendees.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Analytics & Demographics
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAttendees}
            title="Refresh database"
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>

          <a
            href="/api/attendees/export/csv"
            download="New_and_Proud_Ebonyi_Attendees.csv"
            className="flex items-center gap-1.5 text-xs bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </a>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs bg-white text-black font-medium px-3.5 py-1.5 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Walk-in Student</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#0f0f12] border border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Total Registrations</span>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              {stats?.totalRegistered ?? attendees.length}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Confirmed digital summit badges
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f0f12] border border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Accredited / Checked-In</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 font-mono">
              {stats?.checkedIn ??
                attendees.filter((a) => a.checkedIn).length}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-1">
              {stats?.checkInRate ?? 0}% hall attendance rate
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f0f12] border border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Awaiting Accreditation</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-300 font-mono">
              {stats?.pending ??
                attendees.filter((a) => !a.checkedIn).length}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Badges pending entry check-in
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f0f12] border border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>LGA Coverage</span>
              <MapPin className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              {stats ? Object.keys(stats.lgaDistribution).length : 13}/13
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              Statewide student participation
            </div>
          </div>
        </div>

        {/* Tab 1: Attendees List & Control Center */}
        {activeTab === 'attendees' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="p-3 sm:p-4 rounded-xl bg-[#0f0f12] border border-neutral-800 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, pass ID, school, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* Filter: Track */}
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="all">All Tracks</option>
                {TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Filter: LGA */}
              <select
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className="bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="all">All 13 LGAs</option>
                {EBONYI_LGAS.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>

              {/* Filter: Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="all">All Statuses</option>
                <option value="checkedIn">Checked-In</option>
                <option value="pending">Pending</option>
              </select>

              {/* Reset filter button if any active */}
              {(searchQuery ||
                selectedTrack !== 'all' ||
                selectedLga !== 'all' ||
                selectedStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTrack('all');
                    setSelectedLga('all');
                    setSelectedStatus('all');
                  }}
                  className="text-xs text-neutral-400 hover:text-white px-2 py-1 underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Attendees Data Table */}
            <div className="rounded-xl border border-neutral-800 bg-[#0c0c0f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/40 text-neutral-400">
                      <th className="py-3 px-4 font-medium">Pass ID</th>
                      <th className="py-3 px-4 font-medium">Student / Delegate</th>
                      <th className="py-3 px-4 font-medium">Institution</th>
                      <th className="py-3 px-4 font-medium">Track</th>
                      <th className="py-3 px-4 font-medium">LGA</th>
                      <th className="py-3 px-4 font-medium">Registration Date</th>
                      <th className="py-3 px-4 font-medium text-center">Accreditation</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                          Loading summit registry...
                        </td>
                      </tr>
                    ) : filteredAttendees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500">
                          No student records found matching the active search/filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <tr
                          key={attendee.id}
                          onClick={() => setViewAttendee(attendee)}
                          className="hover:bg-neutral-900/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-mono font-medium text-white">
                            {attendee.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                              {attendee.name}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              {attendee.category} · {attendee.phone || attendee.email || 'No contact provided'}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-[200px] truncate" title={attendee.school}>
                            {attendee.school}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-neutral-900 border border-neutral-700 text-neutral-300">
                              {attendee.track}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-400">
                            {attendee.lga}
                          </td>
                          <td className="py-3 px-4 text-neutral-400">
                            {new Date(attendee.registeredAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleToggleCheckIn(attendee.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                                attendee.checkedIn
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:bg-neutral-800'
                              }`}
                            >
                              {attendee.checkedIn ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Checked-in</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-neutral-500" />
                                  <span>Mark In</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="View badge & details"
                                onClick={() => setViewAttendee(attendee)}
                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Delete record"
                                onClick={() => handleDeleteAttendee(attendee.id)}
                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Analytics & Demographics */}
        {activeTab === 'analytics' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Track Breakdown */}
            <div className="p-5 rounded-xl bg-[#0f0f12] border border-neutral-800">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Track Distribution</span>
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.trackDistribution).map(([track, count]) => {
                  const percent = Math.round((count / stats.totalRegistered) * 100);
                  return (
                    <div key={track}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">{track}</span>
                        <span className="font-mono text-neutral-400">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LGA Representation */}
            <div className="p-5 rounded-xl bg-[#0f0f12] border border-neutral-800">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>Local Government Area (LGA) Breakdown</span>
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.lgaDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([lga, count]) => {
                    const percent = Math.round((count / stats.totalRegistered) * 100);
                    return (
                      <div key={lga}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300">{lga}</span>
                          <span className="font-mono text-neutral-400">
                            {count} students ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="p-5 rounded-xl bg-[#0f0f12] border border-neutral-800">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <School className="w-4 h-4 text-amber-400" />
                <span>Student Category Breakdown</span>
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.categoryDistribution).map(([cat, count]) => {
                  const percent = Math.round((count / stats.totalRegistered) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">{cat}</span>
                        <span className="font-mono text-neutral-400">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operations Advisory */}
            <div className="p-5 rounded-xl bg-[#0f0f12] border border-neutral-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Accreditation Guidelines</span>
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  For walk-in accreditation at the Abakaliki International Arena,
                  verify student ID cards from secondary or tertiary institutions.
                  Each verified delegate receives an authorized summit badge,
                  kit, and lunch coupon.
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400 font-mono">
                <span>Database Sync: Live</span>
                <span>Active Server: Express / Vite</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: View Attendee Pass / Detail */}
      {viewAttendee && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div className="relative w-full max-w-md bg-[#111115] border border-neutral-700/80 rounded-2xl p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setViewAttendee(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg p-1 cursor-pointer"
            >
              ✕
            </button>

            {/* Student Summit Badge Card preview */}
            <div className="border border-neutral-700 rounded-xl p-5 bg-gradient-to-b from-[#181820] to-[#0d0d10] mb-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div
                    className="text-xs uppercase tracking-wider text-emerald-400 font-bold"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    New and Proud Ebonyi
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Official Student Delegate Badge
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-white bg-black/60 px-2 py-0.5 rounded border border-neutral-700">
                    {viewAttendee.id}
                  </span>
                </div>
              </div>

              <div className="my-4">
                <div className="text-xl font-bold text-white mb-0.5">
                  {viewAttendee.name}
                </div>
                <div className="text-xs text-neutral-300 mb-2">
                  {viewAttendee.school}
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Track: {viewAttendee.track}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-neutral-500 block">LGA Origin</span>
                  <span className="text-neutral-300 font-medium">{viewAttendee.lga}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Category</span>
                  <span className="text-neutral-300 font-medium">{viewAttendee.category}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Accreditation</span>
                  <span
                    className={`font-medium ${
                      viewAttendee.checkedIn ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {viewAttendee.checkedIn ? 'Checked-In' : 'Pending Gate'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Contact</span>
                  <span className="text-neutral-300 truncate block">
                    {viewAttendee.phone || viewAttendee.email || 'None'}
                  </span>
                </div>
              </div>

              {viewAttendee.notes && (
                <div className="mt-3 p-2 rounded bg-black/40 border border-neutral-800 text-[11px] text-neutral-400">
                  <span className="text-neutral-500 block">Notes:</span>
                  {viewAttendee.notes}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleToggleCheckIn(viewAttendee.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewAttendee.checkedIn
                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400 font-bold'
                }`}
              >
                {viewAttendee.checkedIn ? 'Mark as Pending' : 'Check-In Student'}
              </button>
              <button
                type="button"
                onClick={() => setViewAttendee(null)}
                className="px-4 py-2 rounded-lg text-xs bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register Walk-In Attendee */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-[#111115] border border-neutral-700 rounded-2xl p-6 text-white shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg p-1 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold tracking-tight mb-1">
              Register Walk-in Delegate
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Accredit a student arriving directly at the Abakaliki summit gates.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Chinelo Nwali"
                  value={newAttendee.name}
                  onChange={(e) =>
                    setNewAttendee({ ...newAttendee, name: e.target.value })
                  }
                  className="w-full bg-black/60 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">
                  School / Institution
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ebonyi State University or FGGC Okposi"
                  value={newAttendee.school}
                  onChange={(e) =>
                    setNewAttendee({ ...newAttendee, school: e.target.value })
                  }
                  className="w-full bg-black/60 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Student Category</label>
                  <select
                    value={newAttendee.category}
                    onChange={(e) =>
                      setNewAttendee({ ...newAttendee, category: e.target.value })
                    }
                    className="w-full bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-neutral-500"
                  >
                    <option>Secondary Student</option>
                    <option>Tertiary Student</option>
                    <option>Vocational / Innovator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">LGA Origin</label>
                  <select
                    value={newAttendee.lga}
                    onChange={(e) =>
                      setNewAttendee({ ...newAttendee, lga: e.target.value })
                    }
                    className="w-full bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-neutral-500"
                  >
                    {EBONYI_LGAS.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Summit Track</label>
                <select
                  value={newAttendee.track}
                  onChange={(e) =>
                    setNewAttendee({ ...newAttendee, track: e.target.value })
                  }
                  className="w-full bg-black/60 border border-neutral-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-neutral-500"
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={newAttendee.email}
                    onChange={(e) =>
                      setNewAttendee({ ...newAttendee, email: e.target.value })
                    }
                    className="w-full bg-black/60 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+234 80..."
                    value={newAttendee.phone}
                    onChange={(e) =>
                      setNewAttendee({ ...newAttendee, phone: e.target.value })
                    }
                    className="w-full bg-black/60 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Notes / Accommodations</label>
                <input
                  type="text"
                  placeholder="Optional notes or project info"
                  value={newAttendee.notes}
                  onChange={(e) =>
                    setNewAttendee({ ...newAttendee, notes: e.target.value })
                  }
                  className="w-full bg-black/60 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
                >
                  Save & Print Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2 rounded-full text-xs font-medium shadow-2xl tracking-tight transition-opacity duration-300"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
