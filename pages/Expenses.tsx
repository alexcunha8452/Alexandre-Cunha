import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FuelEntry, GeneralExpense } from '../types';
import { Plus, Trash2, Droplets, ShoppingBag, Gauge, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Expenses: React.FC = () => {
  const { vehicles, fuels, expenses, addFuel, deleteFuel, addExpense, deleteExpense } = useApp();
  const [activeTab, setActiveTab] = useState<'fuel' | 'general'>('fuel');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Forms
  const initFuel = { vehicleId: '', date: format(new Date(), 'yyyy-MM-dd'), fuelType: 'Diesel', liters: 0, pricePerLiter: 0, odometer: 0, supplier: '', paymentMethod: 'Boleto' };
  const initExpense = { date: format(new Date(), 'yyyy-MM-dd'), category: 'Manutenção Preventiva', description: '', value: 0, vehicleId: '' };

  const [fuelForm, setFuelForm] = useState(initFuel);
  const [expenseForm, setExpenseForm] = useState(initExpense);

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFuel(fuelForm);
    setIsModalOpen(false);
    setFuelForm(initFuel);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense(expenseForm);
    setIsModalOpen(false);
    setExpenseForm(initExpense);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Despesas & Abastecimento</h1>
           <p className="text-slate-500 text-sm">Controle de combustíveis e gastos operacionais diversos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> 
          {activeTab === 'fuel' ? 'Novo Abastecimento' : 'Nova Despesa'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
         <button 
            onClick={() => setActiveTab('fuel')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'fuel' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
         >
            <Droplets className="w-4 h-4" /> Combustível
         </button>
         <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
         >
            <ShoppingBag className="w-4 h-4" /> Despesas Gerais
         </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
         {activeTab === 'fuel' ? (
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Data</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Veículo</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Combustível</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Litros</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Preço/L</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Total</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">KM/HR</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {fuels.length === 0 && <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">Nenhum abastecimento registrado.</td></tr>}
                        {fuels.map(f => {
                            const v = vehicles.find(veh => veh.id === f.vehicleId);
                            return (
                                <tr key={f.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(f.date), 'dd/MM/yyyy')}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{v?.code}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{f.fuelType}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{f.liters} L</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">R$ {f.pricePerLiter.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">R$ {f.totalValue.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-1"><Gauge className="w-3 h-3"/> {f.odometer}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => deleteFuel(f.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
             </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Data</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Veículo (Opcional)</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Valor</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {expenses.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhuma despesa registrada.</td></tr>}
                        {expenses.map(e => {
                             const v = vehicles.find(veh => veh.id === e.vehicleId);
                             return (
                                <tr key={e.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(e.date), 'dd/MM/yyyy')}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{e.category}</span></td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{e.description}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{v ? v.code : '-'}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">R$ {e.value.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => deleteExpense(e.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
             </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="text-xl font-bold text-slate-800">{activeTab === 'fuel' ? 'Registrar Abastecimento' : 'Registrar Despesa'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>
             
             {activeTab === 'fuel' ? (
                 <form onSubmit={handleFuelSubmit} className="p-6 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                            <input type="date" required className="w-full border-slate-300 rounded-lg p-2.5" value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Veículo</label>
                            <select required className="w-full border-slate-300 rounded-lg p-2.5" value={fuelForm.vehicleId} onChange={e => setFuelForm({...fuelForm, vehicleId: e.target.value})}>
                                <option value="">Selecione...</option>
                                {vehicles.filter(v => v.isActive).map(v => <option key={v.id} value={v.id}>{v.code}</option>)}
                            </select>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Combustível</label>
                            <select className="w-full border-slate-300 rounded-lg p-2.5" value={fuelForm.fuelType} onChange={e => setFuelForm({...fuelForm, fuelType: e.target.value})}>
                                <option>Diesel</option>
                                <option>Gasolina</option>
                                <option>Etanol</option>
                                <option>ARLA 32</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Litros</label>
                            <input type="number" step="0.1" required className="w-full border-slate-300 rounded-lg p-2.5" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: parseFloat(e.target.value)})} />
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Preço / Litro</label>
                            <input type="number" step="0.01" required className="w-full border-slate-300 rounded-lg p-2.5" value={fuelForm.pricePerLiter} onChange={e => setFuelForm({...fuelForm, pricePerLiter: parseFloat(e.target.value)})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">KM / Horímetro</label>
                            <input type="number" required className="w-full border-slate-300 rounded-lg p-2.5" value={fuelForm.odometer} onChange={e => setFuelForm({...fuelForm, odometer: parseFloat(e.target.value)})} />
                         </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
                        <input type="text" className="w-full border-slate-300 rounded-lg p-2.5" value={fuelForm.supplier} onChange={e => setFuelForm({...fuelForm, supplier: e.target.value})} />
                     </div>
                     
                     <div className="bg-slate-50 p-3 rounded text-right">
                         <span className="text-slate-500 text-sm">Total Estimado:</span>
                         <span className="block text-xl font-bold text-brand-700">R$ {(fuelForm.liters * fuelForm.pricePerLiter).toFixed(2)}</span>
                     </div>

                     <button type="submit" className="w-full py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-md">Salvar</button>
                 </form>
             ) : (
                 <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                            <input type="date" required className="w-full border-slate-300 rounded-lg p-2.5" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                            <input type="number" step="0.01" required className="w-full border-slate-300 rounded-lg p-2.5" value={expenseForm.value} onChange={e => setExpenseForm({...expenseForm, value: parseFloat(e.target.value)})} />
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                        <select className="w-full border-slate-300 rounded-lg p-2.5" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                            <option>Peças/Materiais</option>
                            <option>Limpeza/Higiene</option>
                            <option>EPIs</option>
                            <option>Ferramentas</option>
                            <option>Administrativo</option>
                            <option>Outros</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                        <input type="text" required placeholder="Ex: Silicone, Estopa, Luvas..." className="w-full border-slate-300 rounded-lg p-2.5" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Veículo Relacionado (Opcional)</label>
                        <select className="w-full border-slate-300 rounded-lg p-2.5" value={expenseForm.vehicleId} onChange={e => setExpenseForm({...expenseForm, vehicleId: e.target.value})}>
                            <option value="">Nenhum / Despesa Geral</option>
                            {vehicles.filter(v => v.isActive).map(v => <option key={v.id} value={v.id}>{v.code} - {v.model}</option>)}
                        </select>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-md">Salvar</button>
                 </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;