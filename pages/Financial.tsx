
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Contract, ContractType } from '../types';
import { calculateContractRevenue } from '../utils/calculations';
import { Plus, CheckCircle, XCircle, DollarSign, Calendar as CalendarIcon, RefreshCcw, Truck, Edit, Info, ChevronLeft, ChevronRight, Clock, Filter } from 'lucide-react';
import { startOfMonth, endOfMonth, format, eachDayOfInterval, parseISO, getDay, addMonths, subMonths, isSameMonth, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Financial: React.FC = () => {
  const { contracts, vehicles, addContract, updateContract, deleteContract } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isIndefinite, setIsIndefinite] = useState(false);

  // --- SELETOR DE MÊS / COMPETÊNCIA ---
  const [selectedMonthStr, setSelectedMonthStr] = useState(format(new Date(), 'yyyy-MM'));
  
  // Converte a string YYYY-MM para datas de início e fim
  const viewDate = parseISO(selectedMonthStr + '-01'); // Dia 1 do mês selecionado
  const viewStart = startOfMonth(viewDate);
  const viewEnd = endOfMonth(viewDate);
  
  const initialFormState: Partial<Contract> = {
    clientName: '', 
    vehicleId: '', 
    type: ContractType.MENSAL,
    startDate: format(new Date(), 'yyyy-MM-dd'), 
    dailyRate: 0, 
    monthlyRate: 0,
    workingDays: [1, 2, 3, 4, 5, 6], // Default: Seg-Sab (Sem Domingo)
    manualDeductionDays: 0,
    excludedDates: [],
    includedDates: [],
    hoursPerDay: 8, // Padrão 8 horas
    extraHours: {
        amount0: 0,
        amount30: 0,
        amount100: 0
    },
    demobilization: {
        distance: 0,
        pricePerKm: 0,
        totalValue: 0
    }
  };

  // State separado para desmobilização e dias
  const [demobDistance, setDemobDistance] = useState(0);
  const [demobPrice, setDemobPrice] = useState(0);
  const [formData, setFormData] = useState<Partial<Contract>>(initialFormState);
  
  // Calendar View State inside Modal
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // Helper para exibir data sem timezone offset
  const formatDateDisplay = (isoDateString: string) => {
      if (!isoDateString) return '';
      const [year, month, day] = isoDateString.split('-');
      return `${day}/${month}/${year}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const demobTotal = demobDistance * demobPrice;
    
    const payload = {
        ...formData,
        endDate: isIndefinite ? undefined : formData.endDate,
        demobilization: {
            distance: demobDistance,
            pricePerKm: demobPrice,
            totalValue: demobTotal
        }
    };

    if (editingId) {
        updateContract(editingId, payload);
    } else {
        addContract(payload as any);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (contract: Contract) => {
      setEditingId(contract.id);
      setFormData({
          clientName: contract.clientName,
          vehicleId: contract.vehicleId,
          type: contract.type,
          startDate: contract.startDate,
          endDate: contract.endDate,
          dailyRate: contract.dailyRate,
          monthlyRate: contract.monthlyRate,
          workingDays: contract.workingDays || [0,1,2,3,4,5,6],
          manualDeductionDays: contract.manualDeductionDays || 0,
          excludedDates: contract.excludedDates || [],
          includedDates: contract.includedDates || [],
          hoursPerDay: contract.hoursPerDay || 8,
          extraHours: contract.extraHours || { amount0: 0, amount30: 0, amount100: 0 }
      });

      if (contract.demobilization) {
          setDemobDistance(contract.demobilization.distance);
          setDemobPrice(contract.demobilization.pricePerKm);
      } else {
          setDemobDistance(0);
          setDemobPrice(0);
      }

      setIsIndefinite(!contract.endDate);
      setCalendarViewDate(parseISO(contract.startDate));
      setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setDemobDistance(0);
    setDemobPrice(0);
    setIsIndefinite(false);
    setEditingId(null);
    setCalendarViewDate(new Date());
  }

  // --- Calendar Logic ---

  const toggleDayBasePattern = (dayIndex: number) => {
      const current = formData.workingDays || [];
      if (current.includes(dayIndex)) {
          setFormData({ ...formData, workingDays: current.filter(d => d !== dayIndex) });
      } else {
          setFormData({ ...formData, workingDays: [...current, dayIndex] });
      }
  };

  const toggleSpecificDate = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = getDay(date);
      const isBaseIncluded = (formData.workingDays || []).includes(dayOfWeek);
      
      const excluded = new Set(formData.excludedDates || []);
      const included = new Set(formData.includedDates || []);

      if (isBaseIncluded) {
          // Se está no padrão base, clicar significa EXCLUIR (feriado, folga)
          if (excluded.has(dateStr)) {
              excluded.delete(dateStr); // Remove a exclusão (volta a ser ativo)
          } else {
              excluded.add(dateStr); // Adiciona exclusão
          }
          // Garante que não está na lista de incluídos (limpeza)
          included.delete(dateStr);
      } else {
          // Se NÃO está no padrão base (ex: Domingo), clicar significa INCLUIR (trabalho extra)
          if (included.has(dateStr)) {
              included.delete(dateStr); // Remove inclusão (volta a ser inativo)
          } else {
              included.add(dateStr); // Adiciona inclusão
          }
          // Garante que não está na lista de excluídos
          excluded.delete(dateStr);
      }

      setFormData({
          ...formData,
          excludedDates: Array.from(excluded),
          includedDates: Array.from(included)
      });
  };

  const getDayStatus = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = getDay(date);
      const isBaseIncluded = (formData.workingDays || []).includes(dayOfWeek);
      const isExcluded = (formData.excludedDates || []).includes(dateStr);
      const isIncluded = (formData.includedDates || []).includes(dateStr);

      if (isIncluded) return 'active-override'; // Verde (Extra)
      if (isExcluded) return 'inactive-override'; // Cinza/Vermelho (Feriado)
      return isBaseIncluded ? 'active-base' : 'inactive-base';
  };

  const renderCalendar = () => {
      const monthStart = startOfMonth(calendarViewDate);
      const monthEnd = endOfMonth(monthStart);
      const startDateGrid = startOfWeek(monthStart);
      const endDateGrid = endOfWeek(monthEnd);

      const dateFormat = "d";
      const rows = [];
      let days = [];
      let day = startDateGrid;
      let formattedDate = "";

      while (day <= endDateGrid) {
          for (let i = 0; i < 7; i++) {
              formattedDate = format(day, dateFormat);
              const cloneDay = day;
              
              const status = getDayStatus(cloneDay);
              let bgClass = "";
              if (status === 'active-override') bgClass = "bg-green-600 text-white font-bold ring-2 ring-green-300";
              else if (status === 'inactive-override') bgClass = "bg-red-100 text-red-400 line-through decoration-red-500";
              else if (status === 'active-base') bgClass = "bg-brand-50 text-brand-700 font-medium border border-brand-200";
              else bgClass = "bg-slate-50 text-slate-300";

              if (!isSameMonth(day, monthStart)) {
                  bgClass += " opacity-40";
              }

              days.push(
                  <div
                      key={day.toString()}
                      className={`flex items-center justify-center p-2 cursor-pointer rounded-lg text-sm transition-all h-10 w-10 mx-auto select-none ${bgClass}`}
                      onClick={() => toggleSpecificDate(cloneDay)}
                  >
                      {formattedDate}
                  </div>
              );
              day = addDays(day, 1);
          }
          rows.push(
              <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
                  {days}
              </div>
          );
          days = [];
      }
      
      return <div className="mt-2">{rows}</div>;
  };

  const weekDaysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Helper para cálculo do valor da hora na UI
  const estimatedHourlyRate = (formData.dailyRate || 0) / (formData.hoursPerDay || 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Gestão Financeira</h1>
           <p className="text-slate-500 text-sm">Contratos Mensais (Base Diária) e Diárias Avulsas.</p>
        </div>
        
        <div className="flex gap-4 items-center">
             {/* Filtro de Mês */}
            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-300 shadow-sm">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase">Mês Ref:</span>
                <input 
                    type="month" 
                    value={selectedMonthStr}
                    onChange={(e) => setSelectedMonthStr(e.target.value)}
                    className="text-sm border-none focus:ring-0 text-slate-800 bg-transparent outline-none cursor-pointer font-bold"
                />
            </div>

            <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
            <Plus className="w-4 h-4" /> Novo Contrato
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente / Veículo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Período Contrato</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valores Base</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-green-50/50">
                        Receita ({format(viewDate, 'MMM/yyyy', { locale: ptBR })})
                    </th>
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
                // Calcula com base no mês selecionado no filtro (viewStart a viewEnd)
                const monthRevenue = calculateContractRevenue(c, viewStart, viewEnd);
                
                return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{c.clientName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><CalendarIcon className="w-3 h-3"/> {v?.code} - {v?.model}</p>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs border ${c.type === ContractType.MENSAL ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                {c.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex flex-col text-xs text-slate-600">
                                <span>Início: {formatDateDisplay(c.startDate)}</span>
                                {c.endDate ? (
                                    <span>Fim: {formatDateDisplay(c.endDate)}</span>
                                ) : (
                                    <span className="text-brand-600 font-medium flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> Em andamento</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                            <div>
                                <span>R$ {c.dailyRate.toLocaleString()}/dia</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                                {(c.extraHours?.amount0 || 0) + (c.extraHours?.amount30 || 0) + (c.extraHours?.amount100 || 0)}h Extras
                            </div>
                        </td>
                        <td className="px-6 py-4 bg-green-50/30">
                            <div className="flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-1 rounded-md w-fit text-sm border border-green-200 shadow-sm">
                                <DollarSign className="w-3 h-3" />
                                {monthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {/* Dica visual sobre o cálculo */}
                            {isSameMonth(viewDate, new Date()) ? (
                                <p className="text-[10px] text-slate-500 mt-1 italic">Realizado até hoje</p>
                            ) : (
                                <p className="text-[10px] text-slate-500 mt-1 italic">Fechamento do mês</p>
                            )}
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
                             <button onClick={() => handleEdit(c)} className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:bg-brand-50 p-1.5 rounded transition-colors inline-flex items-center gap-1">
                                <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button onClick={() => deleteContract(c.id)} className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline p-1.5">Excluir</button>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
               <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Contrato' : 'Novo Contrato'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Header Inputs */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                        <input required type="text" placeholder="Nome da empresa ou cliente" className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                     </div>
                     <div className="col-span-2">
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
                            {vehicles.filter(v => v.isActive && (v.status !== 'Em Manutenção' || v.id === formData.vehicleId)).map(v => <option key={v.id} value={v.id}>{v.code} - {v.model}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                        <input type="date" required className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Contrato</label>
                         <select className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500 bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ContractType})}>
                             <option value={ContractType.MENSAL}>Mensal (Pacote)</option>
                             <option value={ContractType.DIARIA}>Diária (Avulsa)</option>
                         </select>
                     </div>
                </div>

                {/* Rates & Hours - NEW */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Valores & Horários
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Valor Diária (R$)</label>
                            <input type="number" className="w-full border-slate-300 rounded-lg p-2" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Carga Horária (h/dia)</label>
                            <input type="number" min="1" max="24" className="w-full border-slate-300 rounded-lg p-2" value={formData.hoursPerDay} onChange={e => setFormData({...formData, hoursPerDay: parseFloat(e.target.value) || 8})} />
                        </div>
                    </div>
                    <div className="mt-2 text-right text-xs text-slate-500 italic border-t border-slate-200 pt-2">
                        Valor Hora Base: <span className="font-bold text-slate-700">R$ {estimatedHourlyRate.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>

                    {/* Extra Hours */}
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Horas Extras (Quantidade Total)</label>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <span className="block text-[10px] text-slate-500 mb-1">Normal (0%)</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border-slate-300 rounded-lg p-1.5 text-sm" 
                                    placeholder="0h"
                                    value={formData.extraHours?.amount0 || ''}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        extraHours: { ...formData.extraHours!, amount0: parseFloat(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                            <div>
                                <span className="block text-[10px] text-slate-500 mb-1">Extra 30%</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border-slate-300 rounded-lg p-1.5 text-sm" 
                                    placeholder="0h"
                                    value={formData.extraHours?.amount30 || ''}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        extraHours: { ...formData.extraHours!, amount30: parseFloat(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                            <div>
                                <span className="block text-[10px] text-slate-500 mb-1">Extra 100%</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border-slate-300 rounded-lg p-1.5 text-sm" 
                                    placeholder="0h"
                                    value={formData.extraHours?.amount100 || ''}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        extraHours: { ...formData.extraHours!, amount100: parseFloat(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar & Working Days */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        Calendário (Dias Trabalhados)
                        <Info className="w-4 h-4 text-slate-400" />
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        O sistema calcula automaticamente do início até hoje. Clique nos dias para marcar faltas ou trabalhos extras.
                    </p>
                    
                    {/* Pattern Selector */}
                    <div className="flex gap-1 justify-between mb-4">
                        {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                             const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
                             return (
                                <button
                                    key={dayIdx}
                                    type="button"
                                    onClick={() => toggleDayBasePattern(dayIdx)}
                                    className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                                        formData.workingDays?.includes(dayIdx) 
                                        ? 'bg-brand-600 text-white shadow-md' 
                                        : 'bg-white text-slate-400 border border-slate-200'
                                    }`}
                                >
                                    {labels[dayIdx].substring(0,1)}
                                </button>
                             );
                        })}
                    </div>

                    {/* Interactive Month Grid */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                         <div className="flex justify-between items-center mb-2">
                             <button type="button" onClick={() => setCalendarViewDate(subMonths(calendarViewDate, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4"/></button>
                             <span className="text-sm font-bold text-slate-700 capitalize">{format(calendarViewDate, 'MMMM yyyy', { locale: ptBR })}</span>
                             <button type="button" onClick={() => setCalendarViewDate(addMonths(calendarViewDate, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4"/></button>
                         </div>
                         <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 font-medium mb-1">
                             {weekDaysLabels.map(d => <div key={d}>{d}</div>)}
                         </div>
                         {renderCalendar()}
                         <div className="mt-2 flex gap-3 text-[10px] justify-center text-slate-500">
                             <span className="flex items-center gap-1"><div className="w-2 h-2 bg-brand-50 border border-brand-200"></div> Padrão</span>
                             <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-600"></div> Extra/Incluído</span>
                             <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-100 decoration-red-500 line-through text-red-400">X</div> Falta/Excluído</span>
                         </div>
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
                        <label htmlFor="indefinite" className="ml-2 text-sm font-medium text-slate-700">Em andamento (Sem data fim)</label>
                    </div>
                    
                    {!isIndefinite && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                             <div>
                                 <label className="block text-xs font-medium text-slate-500 mb-1">Data de Término / Finalização</label>
                                 <input type="date" required={!isIndefinite} className="w-full border-slate-300 rounded-lg p-2 focus:ring-brand-500 focus:border-brand-500 text-sm" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                             </div>
                        </div>
                    )}
                </div>

                <hr className="border-slate-100"/>

                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="w-4 h-4"/> Taxa de Desmobilização
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Distância (KM)</label>
                        <input type="number" min="0" className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={demobDistance} onChange={e => setDemobDistance(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Valor por KM (R$)</label>
                         <input type="number" min="0" className="w-full border-slate-300 rounded-lg p-2.5 focus:ring-brand-500 focus:border-brand-500" value={demobPrice} onChange={e => setDemobPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4 sticky bottom-0 bg-white z-10">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                    <button type="submit" className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-md transition-colors">
                        {editingId ? 'Salvar Alterações' : 'Iniciar Contrato'}
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
