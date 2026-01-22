
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Checklist, ChecklistItem } from '../types';
import { Plus, Trash2, ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ChecklistPage: React.FC = () => {
    const { vehicles, checklists, addChecklist, deleteChecklist } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);

    // Initial Templates
    const defaultItems: ChecklistItem[] = [
        { id: '1', name: 'Cintas', isChecked: false, condition: 'Bom', observation: '' },
        { id: '2', name: 'Anilhas', isChecked: false, condition: 'Bom', observation: '' },
        { id: '3', name: 'Cabos de Aço', isChecked: false, condition: 'Bom', observation: '' },
        { id: '4', name: 'Ferramentas Gerais', isChecked: false, condition: 'Bom', observation: '' },
        { id: '5', name: 'Nível de Óleo', isChecked: false, condition: 'Bom', observation: '' },
        { id: '6', name: 'Pneus', isChecked: false, condition: 'Bom', observation: '' },
        { id: '7', name: 'Luzes/Sinalização', isChecked: false, condition: 'Bom', observation: '' },
    ];

    const [formData, setFormData] = useState<Partial<Checklist>>({
        date: format(new Date(), 'yyyy-MM-dd'),
        vehicleId: '',
        responsible: '',
        generalObservation: '',
        items: JSON.parse(JSON.stringify(defaultItems)) // Deep copy
    });

    const handleItemChange = (index: number, field: keyof ChecklistItem, value: any) => {
        const newItems = [...(formData.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addChecklist(formData as any);
        setIsModalOpen(false);
        setFormData({
            date: format(new Date(), 'yyyy-MM-dd'),
            vehicleId: '',
            responsible: '',
            generalObservation: '',
            items: JSON.parse(JSON.stringify(defaultItems))
        });
    };

    const handleView = (c: Checklist) => {
        setSelectedChecklist(c);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Checklist de Máquinas</h1>
                    <p className="text-slate-500 text-sm">Vistoria de equipamentos e acessórios.</p>
                </div>
                <button
                    onClick={() => { setSelectedChecklist(null); setIsModalOpen(true); }}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> Novo Checklist
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Data</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Veículo</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Responsável</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status Geral</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {checklists.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum checklist registrado.</td></tr>}
                        {checklists.map(c => {
                            const v = vehicles.find(veh => veh.id === c.vehicleId);
                            // Simple logic to determine if "Ok"
                            const hasIssues = c.items.some(i => i.condition === 'Ruim' || i.condition === 'Ausente');
                            return (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(c.date), 'dd/MM/yyyy')}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{v?.code} - {v?.model}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{c.responsible}</td>
                                    <td className="px-6 py-4">
                                        {hasIssues ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                                                <AlertCircle className="w-3 h-3"/> Atenção
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                                <CheckCircle2 className="w-3 h-3"/> Tudo Ok
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleView(c)} className="text-slate-400 hover:text-brand-600 p-1"><Eye className="w-4 h-4"/></button>
                                        <button onClick={() => deleteChecklist(c.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de Criação */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800">Novo Checklist</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Veículo</label>
                                    <select required className="w-full border-slate-300 rounded-lg p-2.5" value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        {vehicles.filter(v => v.isActive).map(v => <option key={v.id} value={v.id}>{v.code} - {v.model}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                    <input type="date" required className="w-full border-slate-300 rounded-lg p-2.5" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                                    <input type="text" required placeholder="Nome do operador" className="w-full border-slate-300 rounded-lg p-2.5" value={formData.responsible} onChange={e => setFormData({ ...formData, responsible: e.target.value })} />
                                </div>
                            </div>

                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="p-3 font-semibold text-slate-600">Item</th>
                                            <th className="p-3 font-semibold text-slate-600 text-center">Conferido?</th>
                                            <th className="p-3 font-semibold text-slate-600">Condição</th>
                                            <th className="p-3 font-semibold text-slate-600">Observações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {formData.items?.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-medium text-slate-800">{item.name}</td>
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                                                        checked={item.isChecked} 
                                                        onChange={e => handleItemChange(index, 'isChecked', e.target.checked)} 
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <select 
                                                        className={`border rounded p-1.5 w-full text-xs font-medium ${item.condition === 'Ruim' ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-300'}`}
                                                        value={item.condition}
                                                        onChange={e => handleItemChange(index, 'condition', e.target.value)}
                                                    >
                                                        <option value="Bom">Bom / Ok</option>
                                                        <option value="Ruim">Ruim / Danificado</option>
                                                        <option value="Ausente">Ausente</option>
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Obs..." 
                                                        className="w-full border-slate-200 rounded p-1.5 text-xs"
                                                        value={item.observation}
                                                        onChange={e => handleItemChange(index, 'observation', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Observações Gerais</label>
                                <textarea className="w-full border-slate-300 rounded-lg p-3" rows={3} value={formData.generalObservation} onChange={e => setFormData({ ...formData, generalObservation: e.target.value })}></textarea>
                            </div>
                            
                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Salvar Checklist</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Visualização */}
            {selectedChecklist && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Detalhes do Checklist</h2>
                                <p className="text-slate-500 text-sm">Realizado em {format(parseISO(selectedChecklist.date), 'dd/MM/yyyy')}</p>
                            </div>
                            <button onClick={() => setSelectedChecklist(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-slate-400 uppercase font-bold">Veículo</span>
                                    <p className="font-medium text-slate-800">
                                        {vehicles.find(v => v.id === selectedChecklist.vehicleId)?.code} - 
                                        {vehicles.find(v => v.id === selectedChecklist.vehicleId)?.model}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 uppercase font-bold">Responsável</span>
                                    <p className="font-medium text-slate-800">{selectedChecklist.responsible}</p>
                                </div>
                            </div>

                            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                                {selectedChecklist.items.map(item => (
                                    <li key={item.id} className="p-3 flex items-start gap-3">
                                        <div className="mt-1">
                                            {item.condition === 'Bom' && item.isChecked 
                                                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                : <XCircle className="w-5 h-5 text-red-500" />
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="font-medium text-slate-800">{item.name}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                                    item.condition === 'Bom' ? 'bg-green-100 text-green-700' : 
                                                    item.condition === 'Ruim' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                }`}>{item.condition}</span>
                                            </div>
                                            {item.observation && (
                                                <p className="text-sm text-slate-500 mt-1 italic">Obs: {item.observation}</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {selectedChecklist.generalObservation && (
                                <div>
                                    <h4 className="font-bold text-sm text-slate-700 mb-1">Observações Gerais</h4>
                                    <p className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">{selectedChecklist.generalObservation}</p>
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ChecklistPage;
