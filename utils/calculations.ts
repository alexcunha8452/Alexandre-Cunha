
import { Contract, ContractType, Maintenance, FuelEntry, GeneralExpense } from '../types';
import { differenceInDays, getDaysInMonth, isWithinInterval, parseISO, max, min, isAfter, eachDayOfInterval, getDay } from 'date-fns';

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
    
    // Gerar todos os dias no intervalo e filtrar pelos dias trabalhados configurados
    const daysInterval = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
    
    // Filtra apenas os dias da semana permitidos (ex: remove domingos se não estiverem em workingDays)
    // Se workingDays for undefined (contratos antigos), assume todos (0-6)
    const allowedDays = contract.workingDays || [0, 1, 2, 3, 4, 5, 6];
    
    const billableDaysCount = daysInterval.filter(day => allowedDays.includes(getDay(day))).length;

    // Aplicar desconto manual (Feriados/Chuva)
    // Nota: O desconto manual é aplicado proporcionalmente se o contrato for longo, 
    // mas aqui aplicamos direto se houver dias suficientes no periodo.
    // Para simplificar: Subtrai do total calculado se for o mês final ou se for curto.
    // Melhor abordagem segura: O desconto manual é um "total global". 
    // Se o contrato for mensal, é difícil saber em qual mês descontar.
    // Vamos assumir que o cálculo é bruto por dias úteis no período.
    
    // Logica simplificada para exibição mensal:
    // Consideramos apenas dias úteis reais encontrados no intervalo.
    
    let finalBillableDays = billableDaysCount;
    
    // Se for o mês exato de encerramento ou contrato curto, podemos tentar aplicar o desconto manual visualmente
    // Mas para consistência matemática no dashboard, usamos os dias calculados.
    // O desconto manual (manualDeductionDays) é usado principalmente no fechamento final.
    
    if (finalBillableDays > 0) {
      if (contract.type === ContractType.DIARIA) {
        revenue = finalBillableDays * contract.dailyRate;
      } else {
        // Monthly Calculation
        // Se o usuário selecionou dias específicos, o mensal vira um "Pro-Rata baseados em dias úteis"
        // Ou seja: (Valor Mensal / Dias Úteis Totais do Mês) * Dias Trabalhados
        
        const startOfMonthDate = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
        const endOfMonthDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
        
        const allDaysInMonth = eachDayOfInterval({ start: startOfMonthDate, end: endOfMonthDate });
        const workingDaysInMonth = allDaysInMonth.filter(day => allowedDays.includes(getDay(day))).length;
        
        // Evita divisão por zero
        const effectiveDivisor = workingDaysInMonth > 0 ? workingDaysInMonth : 30;
        const dailyRateProRata = contract.monthlyRate / effectiveDivisor;
        
        revenue = finalBillableDays * dailyRateProRata;
      }
    }
  }

  // Adicionar valor de Desmobilização
  if (contract.demobilization && contract.endDate) {
    const demobDate = parseISO(contract.endDate);
    if (isWithinInterval(demobDate, { start: periodStart, end: periodEnd })) {
      revenue += contract.demobilization.totalValue;
    }
  }
  
  // Subtração de dias manuais (Apenas se o contrato terminar neste período para abater do valor final)
  // Isso é uma regra de negócio: Descontos manuais (chuva) são abatidos no acerto final?
  // Vamos assumir que sim, para não ficar negativo em meses anteriores.
  if (contract.manualDeductionDays > 0 && contract.endDate) {
      const endDate = parseISO(contract.endDate);
      if (isWithinInterval(endDate, { start: periodStart, end: periodEnd })) {
          // Calcula valor do dia para descontar
          let deductionValue = 0;
          if (contract.type === ContractType.DIARIA) {
              deductionValue = contract.manualDeductionDays * contract.dailyRate;
          } else {
              // Pro-rata médio
              deductionValue = contract.manualDeductionDays * (contract.monthlyRate / 30);
          }
          revenue -= deductionValue;
      }
  }

  return Math.max(0, revenue); // Nunca retorna negativo
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
