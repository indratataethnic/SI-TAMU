import React, { useState } from 'react';
import { ViolationRule, RewardRule, ViolationCategoryType } from '../types';
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Award,
  Sparkles,
  Shield,
  RotateCcw,
  CheckCircle2,
  X
} from 'lucide-react';
import { initialViolationRules, initialRewardRules } from '../data/initialData';

interface KelolaPoinViewProps {
  violationRules: ViolationRule[];
  rewardRules: RewardRule[];
  onSaveViolationRules: (rules: ViolationRule[]) => void;
  onSaveRewardRules: (rules: RewardRule[]) => void;
}

export const KelolaPoinView: React.FC<KelolaPoinViewProps> = ({
  violationRules,
  rewardRules,
  onSaveViolationRules,
  onSaveRewardRules
}) => {
  const [activeTab, setActiveTab] = useState<'pelanggaran' | 'reward'>('pelanggaran');

  // Modal state for Violation Rule
  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState<ViolationRule | null>(null);
  const [violationForm, setViolationForm] = useState({
    code: '',
    category: 'berat' as ViolationCategoryType,
    name: '',
    points: 20,
    description: ''
  });

  // Modal state for Reward Rule
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardRule | null>(null);
  const [rewardForm, setRewardForm] = useState({
    code: '',
    name: '',
    level: 'Nasional' as any,
    rank: 'Juara I' as any,
    points: 9,
    description: ''
  });

  // Open add violation modal
  const handleOpenAddViolation = () => {
    setEditingViolation(null);
    setViolationForm({
      code: `V-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`,
      category: 'berat',
      name: '',
      points: 20,
      description: ''
    });
    setViolationModalOpen(true);
  };

  // Open edit violation modal
  const handleOpenEditViolation = (rule: ViolationRule) => {
    setEditingViolation(rule);
    setViolationForm({
      code: rule.code,
      category: rule.category,
      name: rule.name,
      points: rule.points,
      description: rule.description || ''
    });
    setViolationModalOpen(true);
  };

  // Save violation rule
  const handleSaveViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingViolation) {
      const updated = violationRules.map(r =>
        r.id === editingViolation.id ? { ...editingViolation, ...violationForm } : r
      );
      onSaveViolationRules(updated);
    } else {
      const newRule: ViolationRule = {
        id: `V-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...violationForm
      };
      onSaveViolationRules([...violationRules, newRule]);
    }
    setViolationModalOpen(false);
  };

  // Delete violation rule
  const handleDeleteViolation = (id: string) => {
    if (window.confirm('Hapus jenis aturan pelanggaran ini dari katalog?')) {
      onSaveViolationRules(violationRules.filter(r => r.id !== id));
    }
  };

  // Open add reward modal
  const handleOpenAddReward = () => {
    setEditingReward(null);
    setRewardForm({
      code: `REW-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5)}`,
      name: '',
      level: 'Nasional',
      rank: 'Juara I',
      points: 9,
      description: ''
    });
    setRewardModalOpen(true);
  };

  // Open edit reward modal
  const handleOpenEditReward = (rule: RewardRule) => {
    setEditingReward(rule);
    setRewardForm({
      code: rule.code,
      name: rule.name,
      level: rule.level,
      rank: rule.rank,
      points: rule.points,
      description: rule.description || ''
    });
    setRewardModalOpen(true);
  };

  // Save reward rule
  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReward) {
      const updated = rewardRules.map(r =>
        r.id === editingReward.id ? { ...editingReward, ...rewardForm } : r
      );
      onSaveRewardRules(updated);
    } else {
      const newRule: RewardRule = {
        id: `REW-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...rewardForm
      };
      onSaveRewardRules([...rewardRules, newRule]);
    }
    setRewardModalOpen(false);
  };

  // Delete reward rule
  const handleDeleteReward = (id: string) => {
    if (window.confirm('Hapus jenis aturan reward ini dari katalog?')) {
      onSaveRewardRules(rewardRules.filter(r => r.id !== id));
    }
  };

  // Reset rules to default
  const handleResetRules = () => {
    if (window.confirm('Kembalikan seluruh daftar bobot poin ke setelan bawaan sekolah?')) {
      onSaveViolationRules(initialViolationRules);
      onSaveRewardRules(initialRewardRules);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-800" />
            Kelola Master Katalog Poin & Tata Tertib
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ubah, tambah, atau sesuaikan bobot poin pelanggaran (Berat, Sedang, Ringan) dan reward kejuaraan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetRules}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Reset ke Daftar Aturan Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>
          {activeTab === 'pelanggaran' ? (
            <button
              onClick={handleOpenAddViolation}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Aturan Pelanggaran
            </button>
          ) : (
            <button
              onClick={handleOpenAddReward}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-xs font-bold transition shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Aturan Reward
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('pelanggaran')}
          className={`pb-3 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'pelanggaran'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Katalog Poin Pelanggaran ({violationRules.length} Aturan)</span>
        </button>
        <button
          onClick={() => setActiveTab('reward')}
          className={`pb-3 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'reward'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Katalog Poin Reward & Prestasi ({rewardRules.length} Tingkat)</span>
        </button>
      </div>

      {/* Content: Pelanggaran */}
      {activeTab === 'pelanggaran' && (
        <div className="space-y-6">
          {/* Group by category: Berat (20), Sedang (10), Ringan (5) */}
          {(['berat', 'sedang', 'ringan'] as ViolationCategoryType[]).map((cat) => {
            const rules = violationRules.filter(r => r.category === cat);
            const badgeTitle =
              cat === 'berat'
                ? '🔴 Pelanggaran Berat (20 Poin)'
                : cat === 'sedang'
                ? '⚠️ Pelanggaran Sedang (10 Poin)'
                : '⚡ Pelanggaran Ringan (5 Poin)';
            const borderCol =
              cat === 'berat' ? 'border-rose-300' : cat === 'sedang' ? 'border-amber-300' : 'border-emerald-300';
            const bgHeader =
              cat === 'berat' ? 'bg-rose-950 text-rose-100' : cat === 'sedang' ? 'bg-amber-950 text-amber-100' : 'bg-emerald-950 text-emerald-100';

            return (
              <div key={cat} className={`bg-white rounded-2xl border ${borderCol} shadow-sm overflow-hidden`}>
                <div className={`px-6 py-3 font-bold text-xs flex items-center justify-between ${bgHeader}`}>
                  <span>{badgeTitle}</span>
                  <span className="text-[11px] opacity-80">{rules.length} Jenis Pelanggaran</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {rules.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">Tidak ada aturan pada kategori ini.</div>
                  ) : (
                    rules.map((r, idx) => (
                      <div key={r.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-400">{r.code || `#${idx + 1}`}</span>
                            <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                          </div>
                          {r.description && <p className="text-slate-600 text-[11px] leading-relaxed">{r.description}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-black text-sm px-3 py-1 rounded-full ${
                              cat === 'berat'
                                ? 'bg-rose-100 text-rose-800'
                                : cat === 'sedang'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            +{r.points} Poin
                          </span>
                          <button
                            onClick={() => handleOpenEditViolation(r)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Poin & Nama"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteViolation(r.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Aturan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content: Reward */}
      {activeTab === 'reward' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-950 text-white px-6 py-3 font-bold text-xs flex justify-between items-center">
            <span>Katalog Bobot Poin Reward Prestasi & Kejuaraan</span>
            <span className="text-amber-300">{rewardRules.length} Ketentuan Apresiasi</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {rewardRules.map((r, idx) => (
              <div key={r.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400">{r.code || `#${idx + 1}`}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold text-[10px]">
                      {r.rank}
                    </span>
                    <span className="text-slate-500 font-medium text-[11px]">{r.level}</span>
                  </div>
                  {r.description && <p className="text-slate-600 text-[11px]">{r.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-sm px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    +{r.points} Poin
                  </span>
                  <button
                    onClick={() => handleOpenEditReward(r)}
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Edit Reward"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteReward(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Hapus Aturan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violation Rule Modal */}
      {violationModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 text-xs">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <h3 className="font-bold text-base text-emerald-100">
                {editingViolation ? 'Edit Aturan Pelanggaran' : 'Tambah Aturan Pelanggaran'}
              </h3>
              <button
                onClick={() => setViolationModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveViolation} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Jenis Pelanggaran</label>
                <input
                  type="text"
                  required
                  value={violationForm.name}
                  onChange={(e) => setViolationForm({ ...violationForm, name: e.target.value })}
                  placeholder="Contoh: Terlambat masuk sekolah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Pelanggaran</label>
                  <select
                    value={violationForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as ViolationCategoryType;
                      let pts = 20;
                      if (cat === 'sedang') pts = 10;
                      if (cat === 'ringan') pts = 5;
                      setViolationForm({ ...violationForm, category: cat, points: pts });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                  >
                    <option value="berat">Berat (Standar 20 Pt)</option>
                    <option value="sedang">Sedang (Standar 10 Pt)</option>
                    <option value="ringan">Ringan (Standar 5 Pt)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bobot Poin (Bisa Kustom)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={violationForm.points}
                    onChange={(e) => setViolationForm({ ...violationForm, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-rose-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Definisi Aturan (Opsional)</label>
                <textarea
                  rows={2}
                  value={violationForm.description}
                  onChange={(e) => setViolationForm({ ...violationForm, description: e.target.value })}
                  placeholder="Keterangan batasan atau ketentuan pelanggaran..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setViolationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow cursor-pointer"
                >
                  Simpan Aturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reward Rule Modal */}
      {rewardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 text-xs">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <h3 className="font-bold text-base text-emerald-100">
                {editingReward ? 'Edit Aturan Reward' : 'Tambah Aturan Reward'}
              </h3>
              <button
                onClick={() => setRewardModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Ketentuan Reward</label>
                <input
                  type="text"
                  required
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="Contoh: Juara I Nasional"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peringkat / Capaian</label>
                  <select
                    value={rewardForm.rank}
                    onChange={(e) => setRewardForm({ ...rewardForm, rank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Juara I">Juara I</option>
                    <option value="Juara II">Juara II</option>
                    <option value="Juara III">Juara III</option>
                    <option value="Peserta Lomba">Peserta Lomba</option>
                    <option value="Apresiasi Khusus">Apresiasi Khusus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tingkat Ajang</label>
                  <select
                    value={rewardForm.level}
                    onChange={(e) => setRewardForm({ ...rewardForm, level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Nasional">Nasional</option>
                    <option value="Provinsi">Provinsi</option>
                    <option value="Kota/Kab">Kota/Kab</option>
                    <option value="Sekolah">Sekolah</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bobot Poin Reward</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={rewardForm.points}
                  onChange={(e) => setRewardForm({ ...rewardForm, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-amber-700 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRewardModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow cursor-pointer"
                >
                  Simpan Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
