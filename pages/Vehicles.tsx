import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Vehicle, VehicleType, VehicleStatus } from '../types';
import { Plus, Edit2, Trash2, Search, Truck } from 'lucide-react';

const Vehicles: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState: Partial<Vehicle> = {
    code: '', type: VehicleType.MUNCK, brand: '', model: '', year: new Date().getFullYear(),
    plate: '', chassis: '', capacity: '', status: VehicleStatus.PARADO,
    defaultDailyRate: 0, defaultMonthlyRate: 0
  };

  const [formData, setFormData] = useState<Partial<Vehicle>>(initialFormState);

  const activeVehicles = vehicles.filter(v => v.isActive && (
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plate.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateVehicle(editingId, formData);
    } else {
      addVehicle(formData as any);
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData(vehicle);
    setEditingId(vehicle.id);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: VehicleStatus) => {
    switch(status) {
      case VehicleStatus.OPERANDO: return 'bg-green-100 text-green-800';
      case VehicleStatus.PARADO: return 'bg-red-100 text-red-800';
      case VehicleStatus.MANUTENCAO: return 'bg-yellow-100 text-yellow-800';
      case VehicleStatus.RESERVADO: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Gestão de Veículos</h1>
        <button 
          onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Veículo
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por código, modelo ou placa..." 
          className="flex-1 border-none focus:ring-0 text-slate-700 placeholder-slate-400 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Veículo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Placa/Chassi</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Capacidade</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{v.code} - {v.model}</p>
                        <p className="text-sm text-slate-500">{v.type} • {v.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900 font-medium">{v.plate}</p>
                    <p className="text-xs text-slate-500">{v.chassis}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{v.capacity}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(v.status)}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(v)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteVehicle(v.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeVehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Veículo' : 'Novo Veículo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código Interno</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select className="w-full border rounded-lg p-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as VehicleType})}>
                    {Object.values(VehicleType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
                  <input required type="number" className="w-full border rounded-lg p-2" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chassi</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={formData.chassis} onChange={e => setFormData({...formData, chassis: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor Diária Padrão</label>
                  <input type="number" className="w-full border rounded-lg p-2" value={formData.defaultDailyRate} onChange={e => setFormData({...formData, defaultDailyRate: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor Mensal Padrão</label>
                  <input type="number" className="w-full border rounded-lg p-2" value={formData.defaultMonthlyRate} onChange={e => setFormData({...formData, defaultMonthlyRate: parseFloat(e.target.value)})} />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select className="w-full border rounded-lg p-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as VehicleStatus})}>
                    {Object.values(VehicleStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
