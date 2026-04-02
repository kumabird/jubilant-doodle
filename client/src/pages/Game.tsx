import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Trophy, RotateCcw } from "lucide-react";
import { useGameStore } from "@/lib/game-store";
import { GameCanvas } from "@/components/game/GameCanvas";
import { useCustomErasers } from "@/hooks/use-custom-erasers";

export default function Game() {
  const [_, setLocation] = useLocation();
  const { players, mode } = useGameStore();
  const { data: customErasers = [], isLoading } = useCustomErasers();

  const [winnerTeam, setWinnerTeam] = useState<number | null>(null);
  const [activePlayerId, setActivePlayerId] = useState(players[0]?.id);
  const [eliminated, setEliminated] = useState<string[]>([]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-2xl animate-pulse">Loading...</div>;
  }

  if (players.length < 2) {
    setLocation('/setup');
    return null;
  }

  // In normal mode each player is their own team (1,2,3,4 → free-for-all)
  // In boss mode keep the stored team assignments (team 1 = boss, team 2 = challengers)
  const activePlayers = mode === 'normal'
    ? players.map((p, i) => ({ ...p, team: i + 1 }))
    : players;

  const handleGameOver = (team: number) => {
    setWinnerTeam(team);
  };

  const handlePlayerEliminated = (id: string) => {
    setEliminated(prev => [...prev, id]);
  };

  // For game-over display: find the winning player name in normal mode
  const winnerPlayer = mode === 'normal'
    ? activePlayers.find(p => p.team === winnerTeam)
    : null;
  const winnerLabel = winnerPlayer
    ? `${winnerPlayer.name} の勝利！`
    : `Team ${winnerTeam} の勝利！`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-4 md:p-8">
      {/* Header / HUD */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center mb-6">
        <button
          onClick={() => setLocation('/')}
          className="p-3 bg-white rounded-full shadow hover:bg-slate-50 transition-colors"
        >
          <Home className="w-6 h-6" />
        </button>

        <div className="flex gap-4">
          {activePlayers.map(p => {
            const isDead = eliminated.includes(p.id);
            const isActive = activePlayerId === p.id && !isDead && !winnerTeam;

            return (
              <div
                key={p.id}
                className={`
                  px-4 py-2 rounded-xl font-bold flex flex-col items-center border-b-4 transition-all
                  ${isActive ? 'bg-white border-primary scale-110 shadow-lg' : 'bg-white/50 border-transparent'}
                  ${isDead ? 'opacity-40 grayscale' : ''}
                `}
              >
                {mode === 'boss' && (
                  <span className="text-xs text-muted-foreground">
                    {p.team === 1 ? 'ボス' : 'チャレンジャー'}
                  </span>
                )}
                <span className={isActive ? 'text-primary' : ''}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center relative w-full max-w-5xl mx-auto">
        <GameCanvas
          players={activePlayers}
          customErasers={customErasers}
          onGameOver={handleGameOver}
          onTurnChange={setActivePlayerId}
          onPlayerEliminated={handlePlayerEliminated}
        />

        {/* Game Over Overlay */}
        <AnimatePresence>
          {winnerTeam !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl"
            >
              <div className="bg-white p-12 rounded-3xl shadow-2xl text-center flex flex-col items-center">
                <Trophy className="w-24 h-24 text-yellow-400 mb-6" />
                <h2 className="text-4xl font-black mb-2">{winnerLabel}</h2>
                <p className="text-xl text-muted-foreground mb-8">勝負あり！素晴らしいテクニックでした。</p>

                <div className="flex gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="playful-shadow bg-primary text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center gap-2 hover:brightness-110"
                  >
                    <RotateCcw /> もう一度遊ぶ
                  </button>
                  <button
                    onClick={() => setLocation('/setup')}
                    className="bg-slate-100 text-foreground px-8 py-4 rounded-2xl font-bold text-xl hover:bg-slate-200 transition-colors"
                  >
                    設定に戻る
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
