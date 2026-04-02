export interface EraserConfig {
  id: string;
  name: string;
  color: string;
  width: number;
  height: number;
  mass: number;
  frictionAir: number;
  restitution: number;
  isBoss?: boolean;
  power?: 'explosion' | 'trail' | 'spin' | 'debuff' | null;
}

export const PRESET_ERASERS: Record<string, EraserConfig> = {
  red: {
    id: 'red',
    name: '赤消しゴム',
    color: '#ef4444',
    width: 30,
    height: 50,
    mass: 2.0,
    frictionAir: 0.08,
    restitution: 0.2,
  },
  blue: {
    id: 'blue',
    name: '青消しゴム',
    color: '#3b82f6',
    width: 25,
    height: 45,
    mass: 0.8,
    frictionAir: 0.01,
    restitution: 0.8,
  },
  yellow: {
    id: 'yellow',
    name: '黄消しゴム',
    color: '#eab308',
    width: 28,
    height: 48,
    mass: 0.5,
    frictionAir: 0.03,
    restitution: 0.5,
    power: 'spin', // Applies torque on impact
  },
  green: {
    id: 'green',
    name: '緑消しゴム',
    color: '#22c55e',
    width: 30,
    height: 50,
    mass: 1.0,
    frictionAir: 0.05,
    restitution: 0.4,
    power: 'trail', // Leaves slippery trail
  },
  orange: {
    id: 'orange',
    name: '橙消しゴム',
    color: '#f97316',
    width: 30,
    height: 50,
    mass: 1.2,
    frictionAir: 0.06,
    restitution: 0.3,
    power: 'explosion', // Explodes on stop
  },
  // Bosses
  metal: {
    id: 'metal',
    name: 'メタルボス',
    color: '#94a3b8',
    width: 40,
    height: 70,
    mass: 10.0,
    frictionAir: 0.15,
    restitution: 0.1,
    isBoss: true,
  },
  gold: {
    id: 'gold',
    name: 'ゴールドボス',
    color: '#fbbf24',
    width: 50,
    height: 80,
    mass: 20.0,
    frictionAir: 0.2,
    restitution: 0.5,
    isBoss: true,
    power: 'spin',
  },
  galaxy: {
    id: 'galaxy',
    name: 'ギャラクシーボス',
    color: '#a855f7',
    width: 35,
    height: 60,
    mass: 5.0,
    frictionAir: 0.05,
    restitution: 0.6,
    isBoss: true,
    power: 'debuff',
    attack: 500, // Explicit stats for bosses
    defense: 500,
    speed: 500,
    weight: 1000,
  }
};
