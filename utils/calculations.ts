import { Contract, ContractType, Maintenance, FuelEntry, GeneralExpense } from '../types';
import { differenceInDays, endOfMonth, startOfMonth, isWithinInterval, parseISO, getDaysInMonth, isSameMonth, max, min, isAfter, isBefore } from 'date-fns';

/**
 * Calculates revenue for a specific contract within a target period (usually a specific month).
 */
export const calculateContractRevenue = (contract: Contract, periodStart: Date, periodEnd: Date): number => {
  const contractStart = parseISO(contract.startDate);
  const contractEnd = contract.endDate ? parseISO(contract.endDate) : new Date(); // If ongoing, assume "up to now" or end of period depending on context
  
  // Intersection of [contractStart, contractEnd] and [periodStart, periodEnd]
  const effectiveStart = max([contractStart, periodStart]);
  const effectiveEnd = min([contractEnd, periodEnd]);

  if (isAfter(effectiveStart, effectiveEnd)) {
    return 0; // No overlap
  }

  const daysOverlap = differenceInDays(effectiveEnd, effectiveStart) + 1;

  if (contract.type === ContractType.DIARIA) {
    return daysOverlap * contract.dailyRate;
  } else {
    // Monthly Calculation (Pro-rata)
    // Rule: Daily Value = Monthly Value / Days in that specific month
    let totalRevenue = 0;
    
    // We iterate day by day or simplify by month chunk for the period
    // For simplicity in this demo, let's look at the specific month of periodStart
    // Assuming the report is usually run per month.
    
    const daysInMonth = getDaysInMonth(periodStart);
    const dailyRateProRata = contract.monthlyRate / daysInMonth;
    
    return daysOverlap * dailyRateProRata;
  }
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
