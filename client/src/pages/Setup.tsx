import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useGameStore } from "@/lib/game-store";

interface Eraser {
  id: string;
  name: string;
  color: string;
  attack: number;
  defense: number;
  speed: number;
  weight: number;
  type?: 'normal' | 'boss';
}

const DEFAULT_ERASERS: Eraser[] = [
  { id: 'red', name: '赤消しゴム', color: '#ef4444', attack: 100, defense: 150, speed: 80, weight: 100, type: 'normal' },
  { id: 'blue', name: '青消しゴム', color: '#3b82f6', attack: 120, defense: 100, speed: 100, weight: 100, type: 'normal' },
  { id: 'green', name: '緑消しゴム', color: '#22c55e', attack: 150, defense: 100, speed: 100, weight: 100, type: 'normal' },
  { id: 'yellow', name: '黄色消しゴム', color: '#eab308', attack: 80, defense: 80, speed: 150, weight: 100, type: 'normal' },
  { id: 'pink', name: 'ピンク消しゴム', color: '#ec4899', attack: 110, defense: 110, speed: 110, weight: 100, type: 'normal' },
  { id: 'black', name: '黒消しゴム', color: '#1f2937', attack: 130, defense: 130, speed: 90, weight: 120, type: 'normal' },
];

export default function Setup() {
  const { players, setPlayers, setMode } = useGameStore();
  const [mode, setLocalMode] = useState<'normal' | 'boss'>('normal');
  const [customErasers, setCustomErasers] = useState<Eraser[]>([]);

  const [playerForms, setPlayerForms] = useState(
    players.length > 0 ? players : [{ id: '1', name: 'Player 1', color: '#ef4444' }]
  );

  // Load custom erasers from API
  useState(() => {
    fetch('/api/custom-erasers')
      .then(r => r.json())
      .then(data => setCustomErasers(data))
      .catch(console.error);
  }, []);

  const allErasers = [...DEFAULT_ERASERS, ...customErasers];
  const availableErasers = mode === 'boss' 
    ? allErasers.filter(e => e.type !== 'normal' || e.id !== 'black')
    : allErasers;

  const handleAddPlayer = () => {
    setPlayerForms([
      ...playerForms,
      { 
        id: String(playerForms.length + 1),
        name: `Player ${playerForms.length + 1}`,
        color: '#3b82f6'
      }
    ]);
  };

  const handlePlayerChange = (index: number, field: string, value: string) => {
    const updated = [...playerForms];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerForms(updated);
  };

  const handleRemovePlayer = (index: number) => {
    if (playerForms.length > 1) {
      setPlayerForms(playerForms.filter((_, i) => i !== index));
    }
  };

  const handleStart = () => {
    if (playerForms.some(p => !p.name.trim())) {
      alert('全てのプレイヤー名を入力してください');
      return;
    }

    const updatedPlayers = playerForms.map((form, index) => {
      const eraser = availableErasers.find(e => e.id === form.color) || availableErasers[0];
      return {
        id: form.id,
        name: form.name,
        eraserId: form.color,
        eraser: eraser,
        team: mode === 'boss' ? (index === 0 ? 1 : 2) : index + 1,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        vx: 0,
        vy: 0,
        rotation: 0,
      };
    });

    setPlayers(updatedPlayers);
    setMode(mode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link href="/">
            <button className="p-3 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-4xl font-black text-foreground">ゲーム設定</h1>
        </header>

        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">ゲームモード</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setLocalMode('normal')}
              className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                mode === 'normal'
                  ? 'bg-primary text-white shadow-lg scale-105'
                  : 'bg-white text-foreground hover:bg-slate-50'
              }`}
            >
              🎯 ノーマル (自由戦)
            </button>
            <button
              onClick={() => setLocalMode('boss')}
              className={`flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                mode === 'boss'
                  ? 'bg-accent text-white shadow-lg scale-105'
                  : 'bg-white text-foreground hover:bg-slate-50'
              }`}
            >
              👑 ボスモード
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {mode === 'normal' 
              ? '全員が対等に戦うモードです' 
              : '1人のボスが複数のチャレンジャーに挑まれます'}
          </p>
        </div>

        {/* Players Setup */}
        <div className="bg-white rounded-3xl p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">プレイヤー設定</h2>
            {playerForms.length < 4 && (
              <button
                onClick={handleAddPlayer}
                className="p-3 bg-primary text-white rounded-full hover:brightness-110 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {playerForms.map((form, index) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl"
                >
                  <span className="font-bold text-lg text-slate-400 w-8">P{index + 1}</span>
                  
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => handlePlayerChange(index, 'name', e.target.value)}
                    placeholder="プレイヤー名"
                    className="flex-1 bg-white border-2 border-slate-200 px-4 py-2 rounded-xl font-bold focus:outline-none focus:border-primary"
                  />

                  <select
                    value={form.color}
                    onChange={e => handlePlayerChange(index, 'color', e.target.value)}
                    className="bg-white border-2 border-slate-200 px-4 py-2 rounded-xl font-bold focus:outline-none focus:border-primary"
                  >
                    {availableErasers.map(eraser => (
                      <option key={eraser.id} value={eraser.id}>
                        {eraser.name}
                      </option>
                    ))}
                  </select>

                  {playerForms.length > 1 && (
                    <button
                      onClick={() => handleRemovePlayer(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {mode === 'boss' && playerForms.length > 0 && (
            <div className="mt-6 p-4 bg-accent/10 rounded-xl border-2 border-accent/20">
              <p className="text-sm font-bold text-accent">
                ℹ️ {playerForms[0].name} がボス、その他がチャレンジャーになります
              </p>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full mt-8 playful-shadow bg-gradient-to-r from-primary to-accent text-white py-6 rounded-2xl font-black text-2xl hover:brightness-110 transition-all"
        >
          🎮 ゲーム開始
        </button>
      </div>
    </div>
  );
}
