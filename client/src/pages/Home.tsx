import { Link } from "wouter";
import { motion } from "framer-motion";
import { Play, Settings, Eraser, Crown } from "lucide-react";
import { useGameStore } from "@/lib/game-store";

export default function Home() {
  const setMode = useGameStore(state => state.setMode);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-block p-4 bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl mb-6">
          <Eraser className="w-24 h-24 text-primary mx-auto" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm pb-4">
          消しゴム落とし
        </h1>
        <p className="text-xl font-bold text-muted-foreground mt-2">Eraser Drop Battle</p>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <Link href="/setup">
          <button 
            onClick={() => setMode('normal')}
            className="w-full playful-shadow bg-gradient-to-r from-primary to-pink-500 text-white rounded-2xl p-4 flex items-center justify-center gap-3 text-2xl font-bold hover:brightness-110 transition-all"
          >
            <Play fill="currentColor" />
            ノーマル対戦
          </button>
        </Link>

        <Link href="/setup">
          <button 
            onClick={() => setMode('boss')}
            className="w-full playful-shadow bg-gradient-to-r from-accent to-orange-500 text-white rounded-2xl p-4 flex items-center justify-center gap-3 text-2xl font-bold hover:brightness-110 transition-all"
          >
            <Crown fill="currentColor" />
            ボスバトル
          </button>
        </Link>

        <Link href="/custom">
          <button 
            className="w-full playful-shadow bg-white text-foreground rounded-2xl p-4 flex items-center justify-center gap-3 text-xl font-bold hover:bg-slate-50 transition-all mt-4 border-2 border-slate-100"
          >
            <Settings />
            オリジナル消しゴム作成
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
