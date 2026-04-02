import { create } from 'zustand';

export type GameMode = 'normal' | 'boss';

export type PlayerSetup = {
  id: string; // Unique ID
  name: string;
  isCpu: boolean;
  eraserId: string; // "red", "blue", or "custom-1"
  team: number; // 1 or 2
};

interface GameStore {
  mode: GameMode;
  players: PlayerSetup[];
  setMode: (mode: GameMode) => void;
  setPlayers: (players: PlayerSetup[]) => void;
  updatePlayer: (id: string, updates: Partial<PlayerSetup>) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  mode: 'normal',
  players: [
    { id: '1', name: 'Player 1', isCpu: false, eraserId: 'red', team: 1 },
    { id: '2', name: 'CPU 1', isCpu: true, eraserId: 'blue', team: 2 },
  ],
  setMode: (mode) => set({ mode }),
  setPlayers: (players) => set({ players }),
  updatePlayer: (id, updates) => set((state) => ({
    players: state.players.map((p) => p.id === id ? { ...p, ...updates } : p)
  })),
}));
