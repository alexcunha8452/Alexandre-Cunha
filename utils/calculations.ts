
import { Contract, ContractType, Maintenance, FuelEntry, GeneralExpense } from '../types';
import { differenceInDays, getDaysInMonth, isWithinInterval, parseISO, max, min, isAfter, eachDayOfInterval, getDay, format, startOfDay, endOfDay } from 'date-fns';

/**
 * Calculates revenue for a specific contract within a target period.
 * IMPORTANT: Logic updated to accumulate value day-by-day up to TODAY for active contracts.
 */
export const calculateContractRevenue = (contract: Contract, periodStart: Date, periodEnd: Date): number => {
  const contractStart = parseISO(contract.startDate);
  // Se não tiver data fim, o teto teórico é infinito, mas na prática limitamos ao fim do período analisado
  const contractEndRaw = contract.endDate ? parseISO(contract.endDate) : null;
  
  // Limitação "Até a data atual":
  // Se estamos olhando para o mês atual, não queremos projetar o futuro, queremos o realizado até hoje.
  const today = endOfDay(new Date()); // Considera até o fim de hoje
  
  // O fim efetivo do cálculo é o menor valor entre:
  // 1. O fim do contrato (se houver)
  // 2. O fim do período selecionado (ex: dia 31 do mês)
  // 3. Hoje (para não calcular dias futuros ainda não trabalhados)
  
  let effectiveEndCalc = periodEnd;
  
  // Se o período de análise inclui o futuro (ex: selecionou este mês inteiro), limitamos a "Hoje".
  // Mas apenas se o contrato ainda estiver ativo (sem endDate) ou se o endDate for no futuro.
  if (isAfter(periodEnd, today)) {
      effectiveEndCalc = min([periodEnd, today]);
  }
  
  if (contractEndRaw) {
      effectiveEndCalc = min([effectiveEndCalc, contractEndRaw]);
  }

  // Intersection of [contractStart, effectiveEndCalc] and [periodStart, periodEnd]
  // Precisamos garantir que a janela de cálculo esteja dentro da janela do contrato E dentro da janela do período
  const effectiveStart = max([contractStart, periodStart]);
  const effectiveEnd = min([effectiveEndCalc, periodEnd]); // Redundante mas seguro

  // Se o inicio efetivo for depois do fim efetivo, não há receita neste período/intervalo
  if (isAfter(effectiveStart, effectiveEnd)) {
      return 0;
  }

  let revenue = 0;
  let billableDaysCount = 0;

  // Gerar todos os dias no intervalo efetivo
  const daysInterval = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
  
  // Padrão Base (Se undefined, assume todos)
  const baseAllowedDays = contract.workingDays || [0, 1, 2, 3, 4, 5, 6];
  const excludedSet = new Set(contract.excludedDates || []);
  const includedSet = new Set(contract.includedDates || []);

  daysInterval.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);

      let isBillable = false;

      // 1. Verifica se foi forçado manualmente (Inclusão)
      if (includedSet.has(dateStr)) {
          isBillable = true;
      } 
      // 2. Verifica se foi forçado manualmente (Exclusão)
      else if (excludedSet.has(dateStr)) {
          isBillable = false;
      }
      // 3. Aplica regra base
      else if (baseAllowedDays.includes(dayOfWeek)) {
          isBillable = true;
      }

      if (isBillable) {
          billableDaysCount++;
      }
  });

  // Cálculo Financeiro
  if (billableDaysCount > 0) {
    if (contract.type === ContractType.DIARIA) {
      revenue = billableDaysCount * contract.dailyRate;
    } else {
      // Cálculo Mensal Proporcional
      // Regra: Valor Mensal / Dias Totais do Mês * Dias Trabalhados
      // Isso é mais justo para contratos quebrados
      
      const startOfMonthDate = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
      const daysInMonth = getDaysInMonth(startOfMonthDate);
      
      const dailyRateProRata = contract.monthlyRate / daysInMonth;
      
      revenue = billableDaysCount * dailyRateProRata;
    }
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
