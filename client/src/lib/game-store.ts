import { create } from 'zustand';

export interface Eraser {
  id: string;
  name: string;
  color: string;
  attack: number;
  defense: number;
  speed: number;
  weight: number;
  ability?: string;
  type?: 'normal' | 'boss';
}

export interface Player {
  id: string;
  name: string;
  eraserId: string;
  eraser: Eraser;
  team: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
}

interface GameStore {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  mode: 'normal' | 'boss';
  setMode: (mode: 'normal' | 'boss') => void;
}

export const useGameStore = create<GameStore>((set) => ({
  players: [],
  setPlayers: (players) => set({ players }),
  mode: 'normal',
  setMode: (mode) => set({ mode }),
}));
