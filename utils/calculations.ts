
import { Contract, ContractType, Maintenance, FuelEntry, GeneralExpense } from '../types';
import { differenceInDays, getDaysInMonth, isWithinInterval, parseISO, max, min, isAfter, eachDayOfInterval, getDay, format, startOfDay, endOfDay, isSameMonth } from 'date-fns';

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
  
  // O fim efetivo do cálculo depende se estamos olhando para o passado ou presente.
  // Se o periodEnd é no passado (mês anterior), calculamos até o fim daquele período.
  // Se o periodEnd é futuro ou hoje, limitamos a hoje para não projetar receitas não realizadas,
  // A MENOS que o contrato já tenha acabado antes de hoje.
  
  let effectiveEndCalc = periodEnd;
  
  // Se estamos no mês atual ou futuro, limitamos ao 'hoje' para mostrar o realizado.
  if (isAfter(periodEnd, today) || isSameMonth(periodEnd, today)) {
      effectiveEndCalc = min([periodEnd, today]);
  }
  // Se estamos num mês passado, periodEnd (que é o fim daquele mês) permanece como o teto.

  // Se o contrato tem data fim, respeitamos ela.
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

  try {
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
  } catch (error) {
      // Fallback para evitar crash em datas inválidas
      return 0;
  }

  // --- CÁLCULO FINANCEIRO BASE ---
  // Agora tanto Diária quanto Mensal usam a Diária como base multiplicadora pelos dias reais
  revenue = billableDaysCount * contract.dailyRate;

  // --- CÁLCULO DE HORAS EXTRAS ---
  // As horas extras são globais no objeto do contrato.
  // Para visualização mensal correta, o ideal seria que horas extras fossem lançadas por dia.
  // Como o requisito atual é um campo acumulador simples no contrato:
  // Se estivermos visualizando o mês atual (ou acumulado geral), somamos as horas extras.
  // Se estivermos visualizando um mês passado onde o contrato estava ativo, somamos também?
  // Isso gera um problema de duplicação visual se somarmos o total "do contrato" em todos os meses.
  // Pela simplicidade pedida, somaremos as horas extras APENAS se o mês selecionado for o ATUAL
  // OU se o contrato terminou DENTRO do mês selecionado (fechamento).
  
  const isCurrentMonth = isSameMonth(periodEnd, today);
  const contractEndsInThisPeriod = contractEndRaw && isWithinInterval(contractEndRaw, { start: periodStart, end: periodEnd });
  
  if ((isCurrentMonth || contractEndsInThisPeriod) && contract.extraHours && contract.dailyRate > 0) {
      // Calcular valor da hora
      const hoursPerDay = contract.hoursPerDay || 8; // Default 8h se não definido
      const hourlyRate = contract.dailyRate / hoursPerDay;

      const cost0 = (contract.extraHours.amount0 || 0) * hourlyRate * 1.0; 
      const cost30 = (contract.extraHours.amount30 || 0) * hourlyRate * 1.30;
      const cost100 = (contract.extraHours.amount100 || 0) * hourlyRate * 2.0;

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
