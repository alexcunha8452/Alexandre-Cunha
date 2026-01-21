
export enum VehicleType {
  MUNCK = 'Caminhão Munck',
  GUINDASTE = 'Guindaste',
  CARRETA = 'Carreta',
  PRANCHA = 'Prancha',
  PTA = 'PTA',
  OUTRO = 'Outro'
}

export enum VehicleStatus {
  OPERANDO = 'Operando',
  PARADO = 'Parado',
  MANUTENCAO = 'Em Manutenção',
  RESERVADO = 'Reservado'
}

export enum MaintenanceType {
  CORRETIVA = 'Corretiva',
  PREVENTIVA = 'Preventiva',
  PROGRAMADA = 'Programada'
}

export enum ContractType {
  DIARIA = 'Diária',
  MENSAL = 'Mensal'
}

export interface Vehicle {
  id: string;
  code: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate: string;
  chassis: string;
  capacity: string;
  status: VehicleStatus;
  defaultDailyRate: number;
  defaultMonthlyRate: number;
  isActive: boolean;
}

export interface MaintenanceItem {
  id: string;
  type: 'Labor' | 'Part';
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  startDate: string; // ISO Date
  endDate?: string; // ISO Date
  horometer: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  description: string;
  items: MaintenanceItem[];
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;
  fuelType: string;
  liters: number;
  pricePerLiter: number;
  totalValue: number;
  odometer: number;
  supplier: string;
  paymentMethod: string;
}

export interface GeneralExpense {
  id: string;
  vehicleId?: string; // Optional linkage
  date: string;
  category: string;
  description: string;
  value: number;
}

export interface DemobilizationData {
  distance: number;
  pricePerKm: number;
  totalValue: number;
}

export interface ExtraHoursData {
    amount0: number;   // Quantidade de horas a 0% (Hora normal adicional)
    amount30: number;  // Quantidade de horas a 30%
    amount100: number; // Quantidade de horas a 100%
}

export interface Contract {
  id: string;
  clientName: string;
  vehicleId: string;
  type: ContractType;
  startDate: string;
  endDate?: string; // If undefined, it is "Em Andamento"
  dailyRate: number;
  monthlyRate: number; // Mantido para compatibilidade, mas o cálculo principal usará dailyRate
  
  // Configuração de Dias de Faturamento
  workingDays: number[]; // Array de 0 a 6 (0=Domingo, 1=Segunda...) -> Padrão base
  
  // Exceções Manuais (String YYYY-MM-DD)
  excludedDates: string[]; // Dias que cairiam no workingDays mas não foram trabalhados (ex: Feriado Terça)
  includedDates: string[]; // Dias que NÃO cairiam no workingDays mas foram trabalhados (ex: Domingo específico)

  manualDeductionDays: number; // Deprecated em favor do calendario visual, mas mantido

  // Extra Hours Configuration
  hoursPerDay: number; // Para calcular valor da hora (Ex: 8h, 9h)
  extraHours: ExtraHoursData;

  // New Demobilization Fields
  demobilization?: DemobilizationData;

  status: 'Active' | 'Finished';
}

export interface FinancialSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  periodStart: string;
  periodEnd: string;
}
