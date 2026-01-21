import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Contract, ContractType } from '../types';
import { calculateContractRevenue } from '../utils/calculations';
import { Plus, CheckCircle, XCircle, DollarSign, Calendar, RefreshCcw } from 'lucide-react';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

const Financial: React.FC = () => {
  const { contracts, vehicles, addContract, endContract, deleteContract } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIndefinite, setIsIndefinite] = useState(false);

  // Revenue Simulation for Current Month
  const currentMonth = new Date();
  
  const initialFormState: Partial<Contract> = {
    clientName: '', vehicleId: '', type: ContractType.MENSAL,
    startDate: format(new Date(), 'yyyy-MM-dd'), dailyRate: 0, monthlyRate: 0
  };

  const [formData, setFormData] = useState<Partial<Contract>>(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        ...formData,
        endDate: isIndefinite ? undefined : formData.endDate
    };
    addContract(payload as any);
    setIsModalOpen(false);
    setFormData(initialFormState);
    setIsIndefinite(false);
  };

  const handleEndContract = (id: string) => {
    const date = prompt("Data de término (YYYY-MM-DD):", format(new Date(), 'yyyy-MM-dd'));
    if (date) endContract(id, date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Gestão Financeira</h1>
           <p className="text-slate-500 text-sm">Contratos, renovações e previsão de faturamento mensal.</p>
        </div>
        <button 
          onClick={() => { setFormData(initialFormState); setIsIndefinite(false); setIsModalOpen(true); }}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Contrato
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente / Veículo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valores</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Receita (Mês Atual)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {contracts.length === 0 && (
                     <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                           Nenhum contrato ativo.
                        </td>
                     </tr>
                )}
                {contracts.map(c => {
                const v = vehicles.find(veh => veh.id === c.vehicleId);
                const currentRevenue = calculateContractRevenue(c, startOfMonth(currentMonth), endOfMonth(currentMonth));
                return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{c.clientName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {v?.code} - {v?.model}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs border ${c.type === ContractType.MENSAL ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                {c.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex flex-col text-xs text-slate-600">
                                <span>Início: {format(new Date(c.startDate), 'dd/MM/yyyy')}</span>
                                {c.endDate ? (
                                    <span>Fim: {format(new Date(c.endDate), 'dd/MM/yyyy')}</span>
                                ) : (
                                    <span className="text-brand-600 font-medium flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> Em andamento</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                            {c.type === ContractType.MENSAL ? (
                                <span>R$ {c.monthlyRate.toLocaleString()}/mês</span>
                            ) : (
                                <span>R$ {c.dailyRate.toLocaleString()}/dia</span>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-green-700 font-bold bg-green-50 px-2 py-1 rounded-md w-fit text-sm border border-green-100">
                                <DollarSign className="w-3 h-3" />
                                {currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {c.status === 'Active' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3" /> Ativo
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <XCircle className="w-3 h-3" /> Finalizado
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                            {c.status === 'Active' && (
                                <button onClick={() => handleEndContract(c.id)} className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline">Finalizar</button>
                            )}
                            <button onClick={() => deleteContract(c.id)} className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline">Excluir</button>
                        </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-800">Novo Contrato</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                    <input required type="text" placeholder="Nome da empresa ou cliente" className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Veículo</label>
                    <select required className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500 bg-white" value={formData.vehicleId} onChange={e => {
                        const vId = e.target.value;
                        const v = vehicles.find(veh => veh.id === vId);
                        setFormData({
                            ...formData, 
                            vehicleId: vId,
                            dailyRate: v?.defaultDailyRate || 0,
                            monthlyRate: v?.defaultMonthlyRate || 0
                        });
                    }}>
                        <option value="">Selecione...</option>
                        {vehicles.filter(v => v.isActive && v.status !== 'Em Manutenção').map(v => <option key={v.id} value={v.id}>{v.code} - {v.model}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Contrato</label>
                        <select className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500 bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ContractType})}>
                            <option value={ContractType.MENSAL}>Mensal</option>
                            <option value={ContractType.DIARIA}>Diária</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                        <input type="date" required className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                </div>
                
                {/* End Date Logic */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center mb-2">
                        <input 
                            type="checkbox" 
                            id="indefinite"
                            className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                            checked={isIndefinite}
                            onChange={e => {
                                setIsIndefinite(e.target.checked);
                                if(e.target.checked) setFormData({...formData, endDate: undefined});
                            }}
                        />
                        <label htmlFor="indefinite" className="ml-2 text-sm font-medium text-slate-700">Contrato por tempo indeterminado (Em andamento)</label>
                    </div>
                    
                    {!isIndefinite && (
                        <div className="animate-in fade-in duration-300">
                             <label className="block text-xs font-medium text-slate-500 mb-1">Data de Término Prevista</label>
                             <input type="date" required={!isIndefinite} className="w-full border-slate-300 rounded-lg p-2 focus:ring-brand-500 focus:border-brand-500 text-sm" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                        </div>
                    )}
                </div>

                {formData.type === ContractType.MENSAL ? (
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Valor Mensal (R$)</label>
                         <input type="number" className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={formData.monthlyRate} onChange={e => setFormData({...formData, monthlyRate: parseFloat(e.target.value)})} />
                         <p className="text-xs text-slate-400 mt-1">O cálculo será proporcional aos dias do mês se iniciar/terminar no meio do período.</p>
                    </div>
                ) : (
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Valor Diária (R$)</label>
                         <input type="number" className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: parseFloat(e.target.value)})} />
                    </div>
                )}
                
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                    <button type="submit" className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-md transition-colors">Iniciar Contrato</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;