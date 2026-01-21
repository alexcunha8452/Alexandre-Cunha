
import { Contract, ContractType, Maintenance, FuelEntry, GeneralExpense } from '../types';
import { differenceInDays, getDaysInMonth, isWithinInterval, parseISO, max, min, isAfter } from 'date-fns';

/**
 * Calculates revenue for a specific contract within a target period (usually a specific month).
 */
export const calculateContractRevenue = (contract: Contract, periodStart: Date, periodEnd: Date): number => {
  const contractStart = parseISO(contract.startDate);
  // Se estiver em andamento, assumimos o fim do período de análise como teto para cálculo
  const contractEnd = contract.endDate ? parseISO(contract.endDate) : periodEnd; 
  
  // Intersection of [contractStart, contractEnd] and [periodStart, periodEnd]
  const effectiveStart = max([contractStart, periodStart]);
  const effectiveEnd = min([contractEnd, periodEnd]);

  let revenue = 0;

  // Verifica se há sobreposição de datas
  if (!isAfter(effectiveStart, effectiveEnd)) {
    const daysOverlap = differenceInDays(effectiveEnd, effectiveStart) + 1;

    if (daysOverlap > 0) {
      if (contract.type === ContractType.DIARIA) {
        revenue = daysOverlap * contract.dailyRate;
      } else {
        // Monthly Calculation (Pro-rata)
        // Rule: Daily Value = Monthly Value / Days in that specific month
        // Simpificação: Considerando o mês do periodStart para cálculo pro-rata
        const daysInMonth = getDaysInMonth(periodStart);
        const dailyRateProRata = contract.monthlyRate / daysInMonth;
        
        revenue = daysOverlap * dailyRateProRata;
      }
    }
  }

  // Adicionar valor de Desmobilização
  // Regra: A desmobilização é somada se a data de fim do contrato (se existir) cair DENTRO deste período.
  if (contract.demobilization && contract.endDate) {
    const demobDate = parseISO(contract.endDate);
    if (isWithinInterval(demobDate, { start: periodStart, end: periodEnd })) {
      revenue += contract.demobilization.totalValue;
    }
  }

  return revenue;
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
