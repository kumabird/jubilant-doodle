import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  { id: 'orange', name: '橙消しゴム', color: '#f97316', attack: 110, defense: 110, speed: 110, weight: 100, type: 'normal' },
  { id: 'black', name: '黒消しゴム', color: '#1f2937', attack: 130, defense: 130, speed: 90, weight: 120, type: 'normal' },
];

export default function Setup() {
  const [, setLocation] = useLocation();
  const { setPlayers, setMode } = useGameStore();
  const [gameMode, setGameMode] = useState<'normal' | 'boss'>('normal');
  const [customErasers, setCustomErasers] = useState<Eraser[]>([]);

  const [playerForms, setPlayerForms] = useState([
    { id: '1', name: 'Player 1', eraserId: 'red' }
  ]);

  // Load custom erasers from API
  useState(() => {
    fetch('/api/custom-erasers')
      .then(r => r.json())
      .then(data => setCustomErasers(data || []))
      .catch(console.error);
  }, []);

  const allErasers = [...DEFAULT_ERASERS, ...customErasers];
  const availableErasers = allErasers;

  const handleAddPlayer = () => {
    const nextId = String(playerForms.length + 1);
    setPlayerForms([
      ...playerForms,
      { 
        id: nextId,
        name: `Player ${playerForms.length + 1}`,
        eraserId: 'blue'
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
      const eraser = availableErasers.find(e => e.id === form.eraserId) || availableErasers[0];
      return {
        id: form.id,
        name: form.name,
        eraserId: form.eraserId,
        eraser: eraser,
        team: gameMode === 'boss' ? (index === 0 ? 1 : 2) : index + 1,
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        vx: 0,
        vy: 0,
        rotation: 0,
      };
    });

    setPlayers(updatedPlayers);
    setMode(gameMode);
    setLocation('/game');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <header className="flex items-center gap-4 mb-8">
          <Link href="/">
            <button className="p-3 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-3xl font-black text-foreground">ゲーム設定</h1>
        </header>

        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setGameMode('normal')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${gameMode === 'normal' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:bg-white/50'}`}
            >
              ノーマル
            </button>
            <button 
              onClick={() => setGameMode('boss')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${gameMode === 'boss' ? 'bg-white shadow text-accent' : 'text-slate-500 hover:bg-white/50'}`}
            >
              ボスモード
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">プレイヤー</h2>
              {playerForms.length < 4 && (
                <button
                  onClick={handleAddPlayer}
                  className="p-2 bg-primary text-white rounded-lg hover:brightness-110 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {playerForms.map((form, index) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3"
                >
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={e => handlePlayerChange(index, 'name', e.target.value)}
                    className="flex-1 bg-slate-50 border-2 border-slate-200 px-3 py-2 rounded-lg font-bold focus:outline-none focus:border-primary text-sm"
                  />
                  <select
                    value={form.eraserId}
                    onChange={e => handlePlayerChange(index, 'eraserId', e.target.value)}
                    className="bg-slate-50 border-2 border-slate-200 px-3 py-2 rounded-lg font-bold focus:outline-none focus:border-primary text-sm"
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
                      className="p-2 text-slate-400 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleStart}
            className="w-full playful-shadow bg-primary text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 hover:brightness-110"
          >
            ゲーム開始
          </button>
        </div>
      </div>
    </div>
  );
}
