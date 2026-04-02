import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Save, Trash2, Hexagon } from "lucide-react";
import { useCustomErasers, useCreateCustomEraser, useDeleteCustomEraser } from "@/hooks/use-custom-erasers";
import type { InsertCustomEraser } from "@shared/schema";

export default function CustomEraser() {
  const { data: erasers = [], isLoading } = useCustomErasers();
  const createMutation = useCreateCustomEraser();
  const deleteMutation = useDeleteCustomEraser();

  const [formType, setFormType] = useState<'normal' | 'boss'>('normal');
  const maxPoints = formType === 'normal' ? 500 : 2500;

  const [formData, setFormData] = useState<Omit<InsertCustomEraser, 'type'>>({
    name: "オレジナル",
    color: "#3b82f6",
    attack: 100,
    defense: 100,
    speed: 100,
    weight: 100
  });

  const totalUsed = formData.attack + formData.defense + formData.speed + formData.weight;
  const remaining = maxPoints - totalUsed;

  const handleStatChange = (stat: keyof typeof formData, value: number) => {
    const num = Math.max(0, value);
    const diff = num - formData[stat];
    if (remaining - diff >= 0) {
      setFormData(prev => ({ ...prev, [stat]: num }));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate({
      ...formData,
      type: formType
    }, {
      onSuccess: () => {
        setFormData({
          name: "オレジナル",
          color: "#3b82f6",
          attack: 100,
          defense: 100,
          speed: 100,
          weight: 100
        });
      }
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Editor Panel */}
      <div className="flex-1">
        <header className="flex items-center gap-4 mb-8">
          <Link href="/">
            <button className="p-3 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-3xl font-black text-foreground">オリジナル消しゴム作成</h1>
        </header>

        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex gap-4 p-2 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setFormType('normal')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${formType === 'normal' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:bg-white/50'}`}
            >
              ノーマル (Max 500pt)
            </button>
            <button 
              onClick={() => setFormType('boss')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${formType === 'boss' ? 'bg-white shadow text-accent' : 'text-slate-500 hover:bg-white/50'}`}
            >
              ボス (Max 2500pt)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <label className="font-bold text-sm text-muted-foreground">名前</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-50 border-2 border-slate-200 px-4 py-3 rounded-xl font-bold focus:outline-none focus:border-primary"
              />
            </div>
            <div className="col-span-2 md:col-span-1 space-y-2">
              <label className="font-bold text-sm text-muted-foreground">カラー</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={formData.color}
                  onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                  className="h-12 w-16 p-1 rounded-xl cursor-pointer bg-slate-50 border-2 border-slate-200"
                />
                <div className="flex-1 h-12 rounded-xl border-2 border-slate-200" style={{ backgroundColor: formData.color }} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/20 flex justify-between items-center">
            <span className="font-bold text-primary">残りポイント</span>
            <span className="text-3xl font-black text-primary">{remaining} <span className="text-lg">pt</span></span>
          </div>

          <div className="space-y-4">
            {[
              { id: 'attack', label: '攻撃力', color: 'bg-red-500' },
              { id: 'defense', label: '防御力', color: 'bg-blue-500' },
              { id: 'speed', label: 'スピード', color: 'bg-green-500' },
              { id: 'weight', label: '重さ (重量)', color: 'bg-orange-500' }
            ].map(stat => (
              <div key={stat.id} className="flex items-center gap-4">
                <span className="w-24 font-bold text-slate-600">{stat.label}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={maxPoints} 
                  value={formData[stat.id as keyof typeof formData]}
                  onChange={e => handleStatChange(stat.id as keyof typeof formData, parseInt(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <input 
                  type="number" 
                  value={formData[stat.id as keyof typeof formData]}
                  onChange={e => handleStatChange(stat.id as keyof typeof formData, parseInt(e.target.value))}
                  className="w-20 bg-slate-50 border-2 border-slate-200 px-2 py-2 rounded-lg font-bold text-center"
                />
              </div>
            ))}
          </div>

          <button 
            onClick={handleSave}
            disabled={createMutation.isPending || !formData.name.trim()}
            className="w-full playful-shadow bg-primary text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            <Save />
            {createMutation.isPending ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>

      {/* List Panel */}
      <div className="w-full md:w-80 space-y-4">
        <h2 className="text-xl font-black mb-4">保存された消しゴム</h2>
        
        {isLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-20 bg-slate-200 rounded-xl"></div>
              <div className="h-20 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        ) : erasers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
            <Hexagon className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="font-bold">まだありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {erasers.map(eraser => (
              <motion.div 
                key={eraser.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
              >
                <div 
                  className="w-10 h-10 rounded-lg shadow-inner"
                  style={{ backgroundColor: eraser.color }}
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{eraser.name}</h3>
                    {eraser.type === 'boss' && (
                      <span className="bg-accent/20 text-accent-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">ボス</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex gap-2 mt-1">
                    <span>攻:{eraser.attack}</span>
                    <span>防:{eraser.defense}</span>
                    <span>速:{eraser.speed}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteMutation.mutate(eraser.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
