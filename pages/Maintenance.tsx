import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Maintenance, MaintenanceType, MaintenanceItem } from '../types';
import { Plus, Trash2, Calendar, Wrench, Info, Package, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const MaintenancePage: React.FC = () => {
  const { maintenances, vehicles, addMaintenance, deleteMaintenance } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper ID generator for temporary items
  const genId = () => Math.random().toString(36).substr(2, 9);

  const initialFormState: Partial<Maintenance> = {
    vehicleId: '', 
    type: MaintenanceType.PREVENTIVA, 
    startDate: format(new Date(), 'yyyy-MM-dd'),
    horometer: 0, 
    laborCost: 0, 
    partsCost: 0, 
    description: '', 
    items: []
  };

  const [formData, setFormData] = useState<Partial<Maintenance>>(initialFormState);
  const [items, setItems] = useState<MaintenanceItem[]>([]);

  // Calculate totals whenever items change
  useEffect(() => {
    const labor = items.filter(i => i.type === 'Labor').reduce((acc, curr) => acc + curr.totalValue, 0);
    const parts = items.filter(i => i.type === 'Part').reduce((acc, curr) => acc + curr.totalValue, 0);
    
    setFormData(prev => ({
      ...prev,
      laborCost: labor,
      partsCost: parts
    }));
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, {
      id: genId(),
      type: 'Part',
      description: '',
      quantity: 1,
      unitValue: 0,
      totalValue: 0
    }]);
  };

  const handleUpdateItem = (id: string, field: keyof MaintenanceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalc total line value
        if (field === 'quantity' || field === 'unitValue') {
           updated.totalValue = updated.quantity * updated.unitValue;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenance({ ...formData, items } as any);
    setIsModalOpen(false);
    setFormData(initialFormState);
    setItems([]);
  };

  const openModal = () => {
    setFormData(initialFormState);
    setItems([]);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Gestão de Manutenção</h1>
           <p className="text-slate-500 text-sm">Controle de preventivas, corretivas e custos de peças.</p>
        </div>
        <button 
          onClick={openModal}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Manutenção
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {maintenances.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
             <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500">Nenhuma manutenção registrada.</p>
          </div>
        )}
        {maintenances.map((m) => {
          const v = vehicles.find(veh => veh.id === m.vehicleId);
          return (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                       {v?.code} - {v?.model}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(m.startDate), 'dd/MM/yyyy')}</span>
                      </div>
                      {m.endDate && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">
                          Finalizado: {format(parseISO(m.endDate), 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border
                    ${m.type === MaintenanceType.CORRETIVA ? 'bg-red-50 text-red-700 border-red-100' : 
                      m.type === MaintenanceType.PREVENTIVA ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                      'bg-orange-50 text-orange-700 border-orange-100'}`}>
                    {m.type}
                  </span>
                </div>
                
                <div className="mb-4">
                  <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{m.description}"</p>
                </div>

                {/* Items Preview */}
                {m.items && m.items.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Itens Trocados/Serviços</p>
                    <ul className="text-sm space-y-1">
                      {m.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-slate-600 border-b border-dotted border-slate-100 pb-1 last:border-0">
                          <span>{item.quantity}x {item.description}</span>
                          <span className="font-medium text-slate-900">R$ {item.totalValue.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 grid grid-cols-3 gap-4">
                <div>
                   <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Mão de Obra</p>
                   <p className="font-medium text-slate-700">R$ {m.laborCost.toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Peças</p>
                   <p className="font-medium text-slate-700">R$ {m.partsCost.toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total Geral</p>
                   <p className="font-bold text-brand-700 text-lg">R$ {m.totalCost.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white border-t border-slate-200 px-6 py-2 flex justify-end">
                 <button onClick={() => deleteMaintenance(m.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" /> Excluir Registro
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="text-xl font-bold text-slate-800">Lançar Manutenção</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
             </div>
             
             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Veículo</label>
                        <select required className="w-full border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                            <option value="">Selecione a máquina...</option>
                            {vehicles.filter(v => v.isActive).map(v => <option key={v.id} value={v.id}>{v.code} - {v.model}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Serviço</label>
                        <select className="w-full border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as MaintenanceType})}>
                            {Object.values(MaintenanceType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                        <input type="date" required className="w-full border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data Término (Opcional)</label>
                        <input type="date" className="w-full border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Geral do Problema/Serviço</label>
                    <textarea required className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500" rows={2} placeholder="Ex: Motor superaquecendo, troca de mangueiras..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>

                {/* Items Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                         <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Peças e Mão de Obra</h3>
                         <button type="button" onClick={handleAddItem} className="text-sm text-brand-600 font-medium hover:text-brand-800 flex items-center gap-1">
                             <Plus className="w-4 h-4" /> Adicionar Item
                         </button>
                    </div>
                    
                    <div className="space-y-3">
                        {items.length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-4 italic">Nenhum item adicionado.</p>
                        )}
                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="col-span-12 md:col-span-3">
                                    <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
                                    <select 
                                        className="w-full text-sm border-slate-200 rounded p-1.5"
                                        value={item.type}
                                        onChange={(e) => handleUpdateItem(item.id, 'type', e.target.value)}
                                    >
                                        <option value="Part">Peça</option>
                                        <option value="Labor">Mão de Obra</option>
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <label className="text-xs text-slate-500 mb-1 block">Descrição</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Filtro de Óleo"
                                        className="w-full text-sm border-slate-200 rounded p-1.5"
                                        value={item.description}
                                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-1">
                                    <label className="text-xs text-slate-500 mb-1 block">Qtd</label>
                                    <input 
                                        type="number" 
                                        className="w-full text-sm border-slate-200 rounded p-1.5"
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="text-xs text-slate-500 mb-1 block">Vl. Unit.</label>
                                    <input 
                                        type="number" 
                                        className="w-full text-sm border-slate-200 rounded p-1.5"
                                        value={item.unitValue}
                                        onChange={(e) => handleUpdateItem(item.id, 'unitValue', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2 flex items-center justify-between gap-2">
                                    <div className="text-right w-full">
                                         <span className="text-xs text-slate-400 block">Total</span>
                                         <span className="font-bold text-slate-800 text-sm">R$ {item.totalValue.toFixed(2)}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-6 text-sm">
                    <div className="text-right">
                        <span className="text-slate-500 block">Total Mão de Obra</span>
                        <span className="font-bold text-slate-800 text-lg">R$ {formData.laborCost?.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-500 block">Total Peças</span>
                        <span className="font-bold text-slate-800 text-lg">R$ {formData.partsCost?.toFixed(2)}</span>
                    </div>
                </div>

             </form>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
                <button onClick={handleSubmit} type="button" className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-md transition-colors">Salvar Manutenção</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;