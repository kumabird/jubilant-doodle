import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Trash2, Play } from "lucide-react";
import { useGameStore, PlayerSetup } from "@/lib/game-store";
import { PRESET_ERASERS } from "@/lib/eraser-configs";
import { useCustomErasers } from "@/hooks/use-custom-erasers";

export default function Setup() {
  const [_, setLocation] = useLocation();
  const { mode, players, setPlayers, updatePlayer } = useGameStore();
  const { data: customErasers = [] } = useCustomErasers();

  const addPlayer = () => {
    if (players.length >= 4) return;
    const newId = Date.now().toString();
    setPlayers([
      ...players,
      {
        id: newId,
        name: `Player ${players.length + 1}`,
        isCpu: false,
        eraserId: 'red',
        team: mode === 'boss' ? 2 : players.length + 1
      }
    ]);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return; // Min 2 players
    setPlayers(players.filter(p => p.id !== id));
  };

  const startGame = () => {
    setLocation('/game');
  };

  const availableErasers = [
    ...Object.values(PRESET_ERASERS).filter(e => mode === 'boss' ? true : !e.isBoss),
    ...customErasers.map(c => ({
      id: `custom-${c.id}`,
      name: c.name,
      isBoss: c.type === 'boss',
      color: c.color
    })).filter(e => mode === 'boss' ? true : !e.isBoss)
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link href="/">
          <button className="p-3 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </Link>
        <h1 className="text-3xl font-black text-foreground">
          {mode === 'boss' ? 'ボスバトル設定' : '対戦設定'}
        </h1>
        <div className="w-12" /> {/* Spacer */}
      </header>

      <div className="space-y-4 mb-8">
        {players.map((player, index) => (
          <motion.div 
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center"
          >
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              
              {/* Name & Type */}
              <div className="space-y-2">
                <input 
                  type="text"
                  value={player.name}
                  onChange={e => updatePlayer(player.id, { name: e.target.value })}
                  className="w-full bg-slate-100 px-4 py-2 rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePlayer(player.id, { isCpu: false })}
                    className={`flex-1 py-1 rounded-lg text-sm font-bold transition-all ${!player.isCpu ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
                  >
                    人間
                  </button>
                  <button
                    onClick={() => updatePlayer(player.id, { isCpu: true })}
                    className={`flex-1 py-1 rounded-lg text-sm font-bold transition-all ${player.isCpu ? 'bg-secondary text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
                  >
                    CPU
                  </button>
                </div>
              </div>

              {/* Eraser Selection */}
              <div className="md:col-span-2 flex items-center gap-4">
                <select
                  value={player.eraserId}
                  onChange={e => updatePlayer(player.id, { eraserId: e.target.value })}
                  className="flex-1 bg-white border-2 border-slate-200 px-4 py-3 rounded-xl font-bold appearance-none focus:outline-none focus:border-primary"
                >
                  {availableErasers.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                
                {mode === 'boss' && (
                  <select
                    value={player.team}
                    onChange={e => updatePlayer(player.id, { team: parseInt(e.target.value) })}
                    className="w-32 bg-white border-2 border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:border-primary"
                  >
                    <option value={1}>ボス</option>
                    <option value={2}>チャレンジャー</option>
                  </select>
                )}
                
                {players.length > 2 && (
                  <button 
                    onClick={() => removePlayer(player.id)}
                    className="p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center">
        {players.length < 4 && (
          <button 
            onClick={addPlayer}
            className="playful-shadow bg-white text-primary border-2 border-primary/20 px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
          >
            <Plus /> プレイヤー追加
          </button>
        )}
        <button 
          onClick={startGame}
          className="playful-shadow bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-2xl font-bold text-2xl flex items-center justify-center gap-2 hover:brightness-110 transition-all"
        >
          <Play fill="currentColor" /> バトル開始！
        </button>
      </div>
    </div>
  );
}
