
import { Contract, ContractType, Maintenance, FuelEntry, GeneralExpense } from '../types';
import { differenceInDays, getDaysInMonth, isWithinInterval, parseISO, max, min, isAfter, eachDayOfInterval, getDay, format, startOfDay, endOfDay } from 'date-fns';

/**
 * Calculates revenue for a specific contract within a target period.
 * IMPORTANT: Logic updated.
 * - Monthly contracts now calculate based on Daily Rate * Actual Working Days.
 * - Extra hours are added to the total.
 */
export const calculateContractRevenue = (contract: Contract, periodStart: Date, periodEnd: Date): number => {
  const contractStart = parseISO(contract.startDate);
  const contractEndRaw = contract.endDate ? parseISO(contract.endDate) : null;
  const today = endOfDay(new Date()); 
  
  // O fim efetivo do cálculo é o menor valor entre: Fim do Período, Fim do Contrato ou Hoje (se for futuro)
  let effectiveEndCalc = periodEnd;
  
  if (isAfter(periodEnd, today)) {
      effectiveEndCalc = min([periodEnd, today]);
  }
  
  if (contractEndRaw) {
      effectiveEndCalc = min([effectiveEndCalc, contractEndRaw]);
  }

  const effectiveStart = max([contractStart, periodStart]);
  const effectiveEnd = min([effectiveEndCalc, periodEnd]); 

  // Se o inicio efetivo for depois do fim efetivo, não há receita
  if (isAfter(effectiveStart, effectiveEnd)) {
      return 0;
  }

  let revenue = 0;
  let billableDaysCount = 0;

  // Gerar todos os dias no intervalo efetivo
  const daysInterval = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
  
  // Configurações do Contrato
  const baseAllowedDays = contract.workingDays || [0, 1, 2, 3, 4, 5, 6];
  const excludedSet = new Set(contract.excludedDates || []);
  const includedSet = new Set(contract.includedDates || []);

  daysInterval.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);

      let isBillable = false;

      // 1. Verifica inclusão manual (Prioridade máxima)
      if (includedSet.has(dateStr)) {
          isBillable = true;
      } 
      // 2. Verifica exclusão manual (Se não incluído manualmente, verifica se foi excluído)
      else if (excludedSet.has(dateStr)) {
          isBillable = false;
      }
      // 3. Aplica regra base (Dias da semana padrão)
      else if (baseAllowedDays.includes(dayOfWeek)) {
          isBillable = true;
      }

      if (isBillable) {
          billableDaysCount++;
      }
  });

  // --- CÁLCULO FINANCEIRO BASE ---
  // Agora tanto Diária quanto Mensal usam a Diária como base multiplicadora pelos dias reais
  revenue = billableDaysCount * contract.dailyRate;

  // --- CÁLCULO DE HORAS EXTRAS ---
  // As horas extras são somadas se estiverem dentro do período do contrato
  // Como as horas extras no objeto são "acumuladas" do contrato, vamos assumir que elas pertencem ao período total.
  // Se quisermos ser precisos por mês, teríamos que ter um log de horas extras por data.
  // Pela simplicidade solicitada, vamos adicionar o valor total das horas extras se o contrato estiver ativo neste período.
  // Para evitar duplicar o valor em visualizações de múltiplos meses, o ideal seria ratear, 
  // mas aqui vamos somar ao total acumulado "até hoje".
  
  if (contract.extraHours && contract.dailyRate > 0) {
      // Calcular valor da hora
      const hoursPerDay = contract.hoursPerDay || 8; // Default 8h se não definido
      const hourlyRate = contract.dailyRate / hoursPerDay;

      const cost0 = (contract.extraHours.amount0 || 0) * hourlyRate * 1.0; // 0% extra = 100% da hora (hora normal)
      const cost30 = (contract.extraHours.amount30 || 0) * hourlyRate * 1.30; // +30%
      const cost100 = (contract.extraHours.amount100 || 0) * hourlyRate * 2.0; // +100% (Dobro)

      revenue += (cost0 + cost30 + cost100);
  }

  // Adicionar valor de Desmobilização (Apenas se a data de fim cair neste intervalo exato)
  if (contract.demobilization && contract.endDate) {
    const demobDate = parseISO(contract.endDate);
    if (isWithinInterval(demobDate, { start: effectiveStart, end: effectiveEnd })) {
      revenue += contract.demobilization.totalValue;
    }
  }

  return Math.max(0, revenue);
};

export const calculateTotalRevenue = (contracts: Contract[], start: Date, end: Date): number => {
  return contracts.reduce((acc, contract) => {
    return acc + calculateContractRevenue(contract, start, end);
  }, 0);
};

export const calculateTotalExpenses = (
  maintenances: Maintenance[],
  fuels: FuelEntry[],
  expenses: GeneralExpense[],
  start: Date,
  end: Date
): number => {
  let total = 0;

  // Filter and sum Maintenances
  maintenances.forEach(m => {
    const d = parseISO(m.startDate);
    if (isWithinInterval(d, { start, end })) {
      total += m.totalCost;
    }
  });

  // Filter and sum Fuels
  fuels.forEach(f => {
    const d = parseISO(f.date);
    if (isWithinInterval(d, { start, end })) {
      total += f.totalValue;
    }
  });

  // Filter and sum General Expenses
  expenses.forEach(e => {
    const d = parseISO(e.date);
    if (isWithinInterval(d, { start, end })) {
      total += e.value;
    }
  });

  return total;
};
