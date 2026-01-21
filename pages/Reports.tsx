import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { startOfMonth, endOfMonth, format, isWithinInterval, parseISO } from 'date-fns';
import { calculateTotalRevenue, calculateTotalExpenses, calculateContractRevenue } from '../utils/calculations';
import { Download, Filter, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports: React.FC = () => {
  const { contracts, maintenances, fuels, expenses, vehicles } = useApp();
  
  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedVehicle, setSelectedVehicle] = useState('all');

  // Calculations
  const reportData = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Filter Contracts for Revenue
    const activeContracts = contracts.filter(c => selectedVehicle === 'all' || c.vehicleId === selectedVehicle);
    const totalRevenue = calculateTotalRevenue(activeContracts, start, end);

    // Filter Expenses
    // 1. Maintenance
    const filteredMaintenances = maintenances.filter(m => {
        const d = parseISO(m.startDate);
        const matchVehicle = selectedVehicle === 'all' || m.vehicleId === selectedVehicle;
        return matchVehicle && isWithinInterval(d, { start, end });
    });
    const maintenanceCost = filteredMaintenances.reduce((acc, curr) => acc + curr.totalCost, 0);

    // 2. Fuel
    const filteredFuel = fuels.filter(f => {
        const d = parseISO(f.date);
        const matchVehicle = selectedVehicle === 'all' || f.vehicleId === selectedVehicle;
        return matchVehicle && isWithinInterval(d, { start, end });
    });
    const fuelCost = filteredFuel.reduce((acc, curr) => acc + curr.totalValue, 0);

    // 3. General Expenses
    const filteredExpenses = expenses.filter(e => {
        const d = parseISO(e.date);
        const matchVehicle = selectedVehicle === 'all' || !e.vehicleId || e.vehicleId === selectedVehicle;
        return matchVehicle && isWithinInterval(d, { start, end });
    });
    const generalCost = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);

    const totalExpenses = maintenanceCost + fuelCost + generalCost;
    const netProfit = totalRevenue - totalExpenses;

    return {
        totalRevenue,
        maintenanceCost,
        fuelCost,
        generalCost,
        totalExpenses,
        netProfit,
        filteredMaintenances,
        filteredFuel,
        filteredExpenses
    };
  }, [startDate, endDate, selectedVehicle, contracts, maintenances, fuels, expenses]);

  const chartData = [
    { name: 'Receita', value: reportData.totalRevenue, fill: '#16a34a' },
    { name: 'Despesas', value: reportData.totalExpenses, fill: '#dc2626' },
    { name: 'Lucro', value: reportData.netProfit, fill: reportData.netProfit >= 0 ? '#0ea5e9' : '#f97316' },
  ];

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Relatório Gerencial de Frotas\n";
    csvContent += `Período: ${format(parseISO(startDate), 'dd/MM/yyyy')} a ${format(parseISO(endDate), 'dd/MM/yyyy')}\n\n`;
    csvContent += "RESUMO FINANCEIRO\n";
    csvContent += `Faturamento Bruto;R$ ${reportData.totalRevenue.toFixed(2)}\n`;
    csvContent += `Custos Manutenção;R$ ${reportData.maintenanceCost.toFixed(2)}\n`;
    csvContent += `Combustível;R$ ${reportData.fuelCost.toFixed(2)}\n`;
    csvContent += `Despesas Gerais;R$ ${reportData.generalCost.toFixed(2)}\n`;
    csvContent += `Lucro Líquido;R$ ${reportData.netProfit.toFixed(2)}\n\n`;
    
    csvContent += "DETALHAMENTO DE DESPESAS\n";
    csvContent += "Data;Tipo;Categoria/Veículo;Descrição;Valor\n";
    
    // Merge rows for CSV
    const rows = [
        ...reportData.filteredMaintenances.map(m => ({ date: m.startDate, type: 'Manutenção', cat: vehicles.find(v => v.id === m.vehicleId)?.code, desc: m.description, val: m.totalCost })),
        ...reportData.filteredFuel.map(f => ({ date: f.date, type: 'Combustível', cat: vehicles.find(v => v.id === f.vehicleId)?.code, desc: `${f.liters}L ${f.fuelType}`, val: f.totalValue })),
        ...reportData.filteredExpenses.map(e => ({ date: e.date, type: 'Geral', cat: e.vehicleId ? vehicles.find(v => v.id === e.vehicleId)?.code : 'Geral', desc: e.description, val: e.value }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    rows.forEach(r => {
        csvContent += `${r.date};${r.type};${r.cat || '-'};${r.desc};${r.val.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_frota_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-800">Relatórios Gerenciais</h1>
            <p className="text-slate-500 text-sm">Análise detalhada de performance financeira.</p>
         </div>
         <button onClick={handleExportCSV} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all">
             <Download className="w-4 h-4" /> Exportar CSV
         </button>
       </div>

       {/* Filter Bar */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full md:w-auto">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Veículo</label>
             <select className="w-full border-slate-300 rounded-lg p-2 text-sm" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                 <option value="all">Todas as máquinas</option>
                 {vehicles.map(v => <option key={v.id} value={v.id}>{v.code} - {v.model}</option>)}
             </select>
          </div>
          <div className="flex-1 w-full md:w-auto">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Inicial</label>
             <input type="date" className="w-full border-slate-300 rounded-lg p-2 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 w-full md:w-auto">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Final</label>
             <input type="date" className="w-full border-slate-300 rounded-lg p-2 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="h-10 flex items-center justify-center bg-slate-100 rounded-lg px-3 text-slate-500">
             <Filter className="w-5 h-5" />
          </div>
       </div>

       {/* Metrics */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Faturamento Bruto</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">R$ {reportData.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Despesas</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">R$ {reportData.totalExpenses.toLocaleString()}</h3>
            </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lucro Líquido</p>
                <h3 className={`text-2xl font-bold mt-1 ${reportData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>R$ {reportData.netProfit.toLocaleString()}</h3>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Margem</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {reportData.totalRevenue > 0 ? ((reportData.netProfit / reportData.totalRevenue) * 100).toFixed(1) : 0}%
                </h3>
            </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Detailed Cost Breakdown */}
           <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="font-bold text-slate-800 mb-4">Composição de Custos</h3>
               <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Manutenção</span>
                          <span className="font-medium">R$ {reportData.maintenanceCost.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(reportData.maintenanceCost / (reportData.totalExpenses || 1)) * 100}%` }}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Combustível</span>
                          <span className="font-medium">R$ {reportData.fuelCost.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${(reportData.fuelCost / (reportData.totalExpenses || 1)) * 100}%` }}></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Gerais</span>
                          <span className="font-medium">R$ {reportData.generalCost.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(reportData.generalCost / (reportData.totalExpenses || 1)) * 100}%` }}></div>
                      </div>
                  </div>
               </div>
               
               <div className="mt-8 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString()}`} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
               </div>
           </div>

           {/* Quick Stats / Legend */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="font-bold text-slate-800 mb-4">Resumo</h3>
               <ul className="space-y-4">
                   <li className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp className="w-5 h-5"/></div>
                           <div>
                               <p className="text-xs text-slate-500">Receitas</p>
                               <p className="font-bold text-slate-800">100%</p>
                           </div>
                       </div>
                   </li>
                   <li className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingDown className="w-5 h-5"/></div>
                           <div>
                               <p className="text-xs text-slate-500">Despesas</p>
                               <p className="font-bold text-slate-800">
                                   {reportData.totalRevenue > 0 ? ((reportData.totalExpenses / reportData.totalRevenue) * 100).toFixed(1) : 0}%
                               </p>
                           </div>
                       </div>
                   </li>
               </ul>
               <div className="mt-6 p-4 bg-brand-50 rounded-lg border border-brand-100">
                   <p className="text-brand-800 text-sm font-medium">Dica de Gestão</p>
                   <p className="text-brand-600 text-xs mt-1">Mantenha os custos de manutenção abaixo de 15% do faturamento bruto para garantir saúde financeira.</p>
               </div>
           </div>
       </div>
    </div>
  );
};

export default Reports;