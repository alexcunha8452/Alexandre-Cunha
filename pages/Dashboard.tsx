import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { calculateTotalRevenue, calculateTotalExpenses } from '../utils/calculations';
import { VehicleStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { DollarSign, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { vehicles, maintenances, fuels, expenses, contracts } = useApp();
  
  // Date Filter State
  const [currentDate, setCurrentDate] = useState(new Date());

  // KPIs
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);

  const revenue = useMemo(() => calculateTotalRevenue(contracts, start, end), [contracts, start, end]);
  const expenseTotal = useMemo(() => calculateTotalExpenses(maintenances, fuels, expenses, start, end), [maintenances, fuels, expenses, start, end]);
  const profit = revenue - expenseTotal;
  const stoppedMachines = vehicles.filter(v => v.status === VehicleStatus.PARADO || v.status === VehicleStatus.MANUTENCAO).length;

  // Chart Data: Status
  const statusData = [
    { name: 'Operando', value: vehicles.filter(v => v.status === VehicleStatus.OPERANDO).length, color: '#22c55e' },
    { name: 'Parado', value: vehicles.filter(v => v.status === VehicleStatus.PARADO).length, color: '#ef4444' },
    { name: 'Manutenção', value: vehicles.filter(v => v.status === VehicleStatus.MANUTENCAO).length, color: '#f59e0b' },
    { name: 'Reservado', value: vehicles.filter(v => v.status === VehicleStatus.RESERVADO).length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Chart Data: Revenue by Vehicle Type (Simulated for this month)
  // We need to map contracts to vehicle types
  const revenueByType = useMemo(() => {
    const data: Record<string, number> = {};
    contracts.forEach(c => {
        const v = vehicles.find(veh => veh.id === c.vehicleId);
        if(v) {
            const rev = calculateTotalRevenue([c], start, end);
            data[v.type] = (data[v.type] || 0) + rev;
        }
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [contracts, vehicles, start, end]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Executivo</h1>
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <label className="text-sm text-slate-500 font-medium">Período:</label>
          <input 
            type="month" 
            value={format(currentDate, 'yyyy-MM')}
            onChange={(e) => setCurrentDate(new Date(e.target.value + '-01'))}
            className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Receita Total</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Despesas Totais</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                R$ {expenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Lucro Líquido</p>
              <h3 className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
                R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-brand-50 rounded-lg">
              <Activity className="w-6 h-6 text-brand-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Máquinas Paradas</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stoppedMachines}</h3>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Status da Frota</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Faturamento por Tipo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
