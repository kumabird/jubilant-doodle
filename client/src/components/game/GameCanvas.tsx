import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { PlayerSetup } from '@/lib/game-store';
import { PRESET_ERASERS, EraserConfig } from '@/lib/eraser-configs';

interface GameCanvasProps {
  players: PlayerSetup[];
  customErasers: any[];
  onGameOver: (winningTeam: number) => void;
  onTurnChange: (activePlayerId: string) => void;
  onPlayerEliminated: (playerId: string) => void;
}

interface Trail {
  x: number;
  y: number;
  type: 'slippery' | 'debuff';
  turnsLeft: number;
  ownerId: string;
}

interface Effect {
  x: number;
  y: number;
  type: 'explosion' | 'spin' | 'debuff';
  age: number;
  maxAge: number;
}

interface Debuff {
  playerId: string;
  turnsLeft: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  players,
  customErasers,
  onGameOver,
  onTurnChange,
  onPlayerEliminated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // All game state kept in refs so the effect runs only once
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const rafRef = useRef<number>(0);
  const activeIndexRef = useRef(0);
  const aliveIdsRef = useRef<Set<string>>(new Set(players.map(p => p.id)));
  const gamePhaseRef = useRef<'idle' | 'dragging' | 'moving'>('idle');
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurPos = useRef<{ x: number; y: number } | null>(null);
  const trailsRef = useRef<Trail[]>([]);
  const effectsRef = useRef<Effect[]>([]);
  const debuffsRef = useRef<Debuff[]>([]);
  const turnCountRef = useRef(0);
  const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React state only for UI overlays
  const [showHint, setShowHint] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState<number | null>(null);

  const getConfig = (eraserId: string): EraserConfig => {
    if (eraserId.startsWith('custom-')) {
      const id = parseInt(eraserId.replace('custom-', ''));
      const c = customErasers.find(x => x.id === id);
      if (c) {
        return {
          id: eraserId,
          name: c.name,
          color: c.color,
          width: c.type === 'boss' ? 44 : 32,
          height: c.type === 'boss' ? 72 : 52,
          mass: Math.max(0.1, c.weight / 100),
          frictionAir: Math.max(0.005, 0.1 - c.speed / 5000),
          restitution: Math.min(0.95, c.defense / 500),
          isBoss: c.type === 'boss',
        };
      }
    }
    return PRESET_ERASERS[eraserId] || PRESET_ERASERS['red'];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 800, H = 600;
    canvas.width = W;
    canvas.height = H;

    const DESK = { x1: 50, y1: 50, x2: W - 50, y2: H - 50 };

    const engine = Matter.Engine.create({ enableSleeping: true, gravity: { x: 0, y: 0, scale: 0 } });
    engineRef.current = engine;
    const runner = Matter.Runner.create();
    runnerRef.current = runner;

    // Create bodies
    const bodies = players.map((p, i) => {
      const cfg = getConfig(p.eraserId);
      const angle = (i / players.length) * Math.PI * 2;
      const body = Matter.Bodies.rectangle(
        W / 2 + Math.cos(angle) * 200,
        H / 2 + Math.sin(angle) * 200,
        cfg.width, cfg.height,
        {
          mass: cfg.mass,
          frictionAir: cfg.frictionAir,
          restitution: cfg.restitution,
          friction: 0.1,
          angle: angle + Math.PI / 2,
          plugin: { playerId: p.id, team: p.team, cfg, exploded: false, baseFrictionAir: cfg.frictionAir },
        }
      );
      return body;
    });
    Matter.World.add(engine.world, bodies);
    Matter.Runner.run(runner, engine);

    // Collision: spin effect
    Matter.Events.on(engine, 'collisionStart', (evt) => {
      evt.pairs.forEach(({ bodyA, bodyB }) => {
        const cfgA = bodyA.plugin.cfg as EraserConfig | undefined;
        const cfgB = bodyB.plugin.cfg as EraserConfig | undefined;
        if (cfgA?.power === 'spin' && bodyA.speed > 1) {
          Matter.Body.setAngularVelocity(bodyB, 0.5);
          effectsRef.current.push({ x: bodyB.position.x, y: bodyB.position.y, type: 'spin', age: 0, maxAge: 40 });
        }
        if (cfgB?.power === 'spin' && bodyB.speed > 1) {
          Matter.Body.setAngularVelocity(bodyA, 0.5);
          effectsRef.current.push({ x: bodyA.position.x, y: bodyA.position.y, type: 'spin', age: 0, maxAge: 40 });
        }
      });
    });

    // Advance turn
    const advanceTurn = () => {
      turnCountRef.current += 1;
      // Tick down trails
      trailsRef.current = trailsRef.current
        .map(t => ({ ...t, turnsLeft: t.turnsLeft - 1 }))
        .filter(t => t.turnsLeft > 0);
      // Tick down debuffs
      debuffsRef.current = debuffsRef.current
        .map(d => ({ ...d, turnsLeft: d.turnsLeft - 1 }))
        .filter(d => d.turnsLeft > 0);

      const allBodies = Matter.Composite.allBodies(engine.world);
      const alive = aliveIdsRef.current;
      if (alive.size <= 1) return;

      let next = (activeIndexRef.current + 1) % players.length;
      let guard = 0;
      while (!alive.has(players[next].id) && guard < players.length) {
        next = (next + 1) % players.length;
        guard++;
      }
      activeIndexRef.current = next;
      const nextPlayer = players[next];
      onTurnChange(nextPlayer.id);
      gamePhaseRef.current = 'idle';

      // Restore frictionAir for bodies not on trail
      allBodies.forEach(b => {
        if (!b.plugin.playerId) return;
        const onSlippery = trailsRef.current.some(t => t.type === 'slippery' &&
          Math.hypot(b.position.x - t.x, b.position.y - t.y) < 20);
        if (!onSlippery) {
          b.frictionAir = b.plugin.baseFrictionAir;
        }
      });

      if (nextPlayer.isCpu) {
        scheduleCpu(nextPlayer, allBodies);
      } else {
        setShowHint(true);
      }
    };

    const scheduleCpu = (player: PlayerSetup, allBodies: Matter.Body[]) => {
      if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
      cpuTimerRef.current = setTimeout(() => {
        const myBody = allBodies.find(b => b.plugin.playerId === player.id);
        if (!myBody) { advanceTurn(); return; }
        let bestTarget: Matter.Body | null = null;
        let bestDist = Infinity;
        allBodies.forEach(b => {
          if (b.plugin.team && b.plugin.team !== player.team) {
            const d = Math.hypot(b.position.x - myBody.position.x, b.position.y - myBody.position.y);
            if (d < bestDist) { bestDist = d; bestTarget = b; }
          }
        });
        if (bestTarget) {
          const dx = (bestTarget as Matter.Body).position.x - myBody.position.x;
          const dy = (bestTarget as Matter.Body).position.y - myBody.position.y;
          const len = Math.hypot(dx, dy) || 1;
          const power = (0.05 + Math.random() * 0.05) * myBody.mass;
          allBodies.forEach(b => Matter.Sleeping.set(b, false));
          // Reset explosion flag so special ability fires each turn
          myBody.plugin.exploded = false;
          Matter.Body.applyForce(myBody, myBody.position, { x: (dx / len) * power, y: (dy / len) * power });
          gamePhaseRef.current = 'moving';
          setShowHint(false);
        } else {
          advanceTurn();
        }
      }, 1200);
    };

    // Render loop
    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, W, H);
      // Desk
      ctx.fillStyle = '#f0ede4';
      ctx.strokeStyle = '#d4c9b0';
      ctx.lineWidth = 2;
      ctx.fillRect(DESK.x1, DESK.y1, DESK.x2 - DESK.x1, DESK.y2 - DESK.y1);
      ctx.strokeRect(DESK.x1, DESK.y1, DESK.x2 - DESK.x1, DESK.y2 - DESK.y1);

      // Draw trails
      trailsRef.current.forEach(t => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = t.type === 'slippery' ? 'rgba(34,197,94,0.35)' : 'rgba(168,85,247,0.35)';
        ctx.fill();
        ctx.restore();
      });

      // Draw effects
      effectsRef.current = effectsRef.current.filter(e => e.age < e.maxAge);
      effectsRef.current.forEach(eff => {
        const progress = eff.age / eff.maxAge;
        const alpha = 1 - progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        if (eff.type === 'explosion') {
          const r = progress * 90;
          const grad = ctx.createRadialGradient(eff.x, eff.y, 0, eff.x, eff.y, r);
          grad.addColorStop(0, 'rgba(255,200,50,0.9)');
          grad.addColorStop(0.5, 'rgba(249,115,22,0.7)');
          grad.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.beginPath();
          ctx.arc(eff.x, eff.y, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        } else if (eff.type === 'spin') {
          ctx.translate(eff.x, eff.y);
          ctx.rotate(eff.age * 0.45);
          ctx.fillStyle = `rgba(234,179,8,${alpha})`;
          for (let k = 0; k < 4; k++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(8 + 28, -4);
            ctx.lineTo(8 + 28, 4);
            ctx.closePath();
            ctx.fill();
          }
        } else if (eff.type === 'debuff') {
          const r = progress * 60;
          ctx.beginPath();
          ctx.arc(eff.x, eff.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();
        eff.age++;
      });

      // Draw eraser bodies
      const allBodies = Matter.Composite.allBodies(engine.world);
      const activePlayer = players[activeIndexRef.current];
      allBodies.forEach(body => {
        const cfg = body.plugin.cfg as EraserConfig;
        if (!cfg) return;
        const isActive = body.plugin.playerId === activePlayer?.id;
        const hasDebuff = debuffsRef.current.some(d => d.playerId === body.plugin.playerId);

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        ctx.shadowBlur = 8;

        // Body fill
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.roundRect(-cfg.width / 2, -cfg.height / 2, cfg.width, cfg.height, 5);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // Active highlight
        if (isActive && gamePhaseRef.current === 'idle') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Team stripe
        ctx.fillStyle = body.plugin.team === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
        ctx.fillRect(-cfg.width / 2, -4, cfg.width, 8);

        // Debuff ring
        if (hasDebuff) {
          ctx.strokeStyle = 'rgba(168,85,247,0.9)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-cfg.width / 2 - 3, -cfg.height / 2 - 3, cfg.width + 6, cfg.height + 6);
          ctx.setLineDash([]);
        }

        ctx.restore();
      });

      // Drag line
      if (gamePhaseRef.current === 'dragging' && dragStartRef.current && dragCurPos.current) {
        const s = dragStartRef.current;
        const c = dragCurPos.current;
        const dx = s.x - c.x;
        const dy = s.y - c.y;

        // Rubber band line
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(c.x, c.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Launch direction arrow
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + dx, s.y + dy);
        ctx.strokeStyle = 'rgba(239,68,68,0.85)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrow head
        const len = Math.hypot(dx, dy);
        if (len > 10) {
          const nx = dx / len, ny = dy / len;
          const ax = s.x + dx, ay = s.y + dy;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - nx * 14 + ny * 7, ay - ny * 14 - nx * 7);
          ctx.lineTo(ax - nx * 14 - ny * 7, ay - ny * 14 + nx * 7);
          ctx.closePath();
          ctx.fillStyle = 'rgba(239,68,68,0.85)';
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };
    render();

    // Game logic interval (10 fps)
    const intervalId = setInterval(() => {
      const allBodies = Matter.Composite.allBodies(engine.world);
      const alive = aliveIdsRef.current;

      // Check falls and trail/debuff
      allBodies.forEach(body => {
        if (!body.plugin.playerId) return;
        const cfg = body.plugin.cfg as EraserConfig;
        const { x, y } = body.position;

        // Leave trail while moving
        if (body.speed > 0.5) {
          if (cfg.power === 'trail') {
            trailsRef.current.push({ x, y, type: 'slippery', turnsLeft: 2, ownerId: body.plugin.playerId });
          } else if (cfg.power === 'debuff') {
            trailsRef.current.push({ x, y, type: 'debuff', turnsLeft: 6, ownerId: body.plugin.playerId });
          }
        }

        const pid = body.plugin.playerId as string;

        // Apply trail effects (self-immunity: skip own trails)
        const onSlippery = trailsRef.current.some(t =>
          t.type === 'slippery' && t.ownerId !== pid && Math.hypot(x - t.x, y - t.y) < 22);
        const onDebuff = trailsRef.current.some(t =>
          t.type === 'debuff' && t.ownerId !== pid && Math.hypot(x - t.x, y - t.y) < 22);

        if (onSlippery) {
          body.frictionAir = 0.002;
        } else {
          body.frictionAir = body.plugin.baseFrictionAir;
        }

        if (onDebuff) {
          const alreadyDebuffed = debuffsRef.current.some(d => d.playerId === pid);
          if (!alreadyDebuffed) {
            debuffsRef.current.push({ playerId: pid, turnsLeft: 2 });
            effectsRef.current.push({ x, y, type: 'debuff', age: 0, maxAge: 35 });
          }
        }

        // Fell off desk
        if (x < DESK.x1 || x > DESK.x2 || y < DESK.y1 || y > DESK.y2) {
          Matter.World.remove(engine.world, body);
          alive.delete(body.plugin.playerId);
          onPlayerEliminated(body.plugin.playerId);

          // Check win
          const remainingBodies = Matter.Composite.allBodies(engine.world);
          const teams = new Set(remainingBodies.filter(b => b.plugin.team).map(b => b.plugin.team as number));
          if (teams.size === 1) {
            setWinnerTeam(Array.from(teams)[0]);
            onGameOver(Array.from(teams)[0]);
          }
        }
      });

      // Explosion: fires once when orange eraser stops
      allBodies.forEach(body => {
        const cfg = body.plugin.cfg as EraserConfig;
        if (cfg?.power === 'explosion' && !body.plugin.exploded && body.speed < 0.3) {
          body.plugin.exploded = true;
          effectsRef.current.push({ x: body.position.x, y: body.position.y, type: 'explosion', age: 0, maxAge: 45 });
          allBodies.forEach(other => {
            if (other === body) return;
            const d = Math.hypot(other.position.x - body.position.x, other.position.y - body.position.y);
            if (d < 130) {
              const nx = (other.position.x - body.position.x) / (d || 1);
              const ny = (other.position.y - body.position.y) / (d || 1);
              Matter.Body.applyForce(other, other.position, { x: nx * 0.06 * other.mass, y: ny * 0.06 * other.mass });
            }
          });
        }
      });

      // Detect turn end
      if (gamePhaseRef.current === 'moving') {
        const stillMoving = allBodies.some(b => b.plugin.playerId && !b.isSleeping && b.speed > 0.15);
        if (!stillMoving) {
          advanceTurn();
        }
      }
    }, 100);

    // Initial hint for first human player
    const firstPlayer = players[activeIndexRef.current];
    if (!firstPlayer.isCpu) setShowHint(true);
    else scheduleCpu(firstPlayer, Matter.Composite.allBodies(engine.world));

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(intervalId);
      if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, []); // ← runs only ONCE

  // Mouse handlers
  const toCanvas = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhaseRef.current !== 'idle') return;
    const activePlayer = players[activeIndexRef.current];
    if (activePlayer.isCpu || !aliveIdsRef.current.has(activePlayer.id)) return;

    const pos = toCanvas(e);
    const engine = engineRef.current;
    if (!engine) return;

    const myBody = Matter.Composite.allBodies(engine.world).find(b => b.plugin.playerId === activePlayer.id);
    if (myBody) {
      const d = Math.hypot(pos.x - myBody.position.x, pos.y - myBody.position.y);
      if (d < 60) {
        dragStartRef.current = { x: myBody.position.x, y: myBody.position.y };
        dragCurPos.current = pos;
        gamePhaseRef.current = 'dragging';
        setShowHint(false);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhaseRef.current !== 'dragging') return;
    dragCurPos.current = toCanvas(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhaseRef.current !== 'dragging') return;
    const engine = engineRef.current;
    const ds = dragStartRef.current;
    const dc = dragCurPos.current;
    if (!engine || !ds || !dc) return;

    const activePlayer = players[activeIndexRef.current];
    const myBody = Matter.Composite.allBodies(engine.world).find(b => b.plugin.playerId === activePlayer.id);
    if (myBody) {
      let dx = ds.x - dc.x;
      let dy = ds.y - dc.y;
      const maxDrag = 160;
      const len = Math.hypot(dx, dy);
      if (len > maxDrag) { dx = (dx / len) * maxDrag; dy = (dy / len) * maxDrag; }

      const powerScale = 0.0006 * myBody.mass;
      // Wake all bodies
      Matter.Composite.allBodies(engine.world).forEach(b => Matter.Sleeping.set(b, false));
      Matter.Body.applyForce(myBody, myBody.position, { x: dx * powerScale, y: dy * powerScale });

      // Reset explosion flag when launched
      myBody.plugin.exploded = false;

      gamePhaseRef.current = 'moving';
    }

    dragStartRef.current = null;
    dragCurPos.current = null;
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: '800/600' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full rounded-2xl shadow-2xl cursor-crosshair touch-none border-4 border-white/20"
        style={{ display: 'block' }}
      />
      {showHint && !winnerTeam && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg font-bold text-primary animate-bounce pointer-events-none whitespace-nowrap">
          消しゴムをクリック＆ドラッグで発射！
        </div>
      )}
    </div>
  );
};
