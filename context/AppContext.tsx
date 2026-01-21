import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Vehicle, Maintenance, FuelEntry, GeneralExpense, Contract, 
  VehicleType, VehicleStatus, ContractType, MaintenanceType, MaintenanceItem 
} from '../types';
import { v4 as uuidv4 } from 'uuid'; // We will simulate uuid with a simple math random for this demo if needed, but lets try to allow uuid import or mock it.
// Since I cannot install packages, I will use a helper for ID.

const generateId = () => Math.random().toString(36).substring(2, 9);

interface AppContextType {
  vehicles: Vehicle[];
  maintenances: Maintenance[];
  fuels: FuelEntry[];
  expenses: GeneralExpense[];
  contracts: Contract[];
  
  // Actions
  addVehicle: (v: Omit<Vehicle, 'id' | 'isActive'>) => void;
  updateVehicle: (id: string, v: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void; // Soft delete

  addMaintenance: (m: Omit<Maintenance, 'id' | 'totalCost'>) => void;
  deleteMaintenance: (id: string) => void;

  addFuel: (f: Omit<FuelEntry, 'id' | 'totalValue'>) => void;
  deleteFuel: (id: string) => void;

  addExpense: (e: Omit<GeneralExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  addContract: (c: Omit<Contract, 'id' | 'status'>) => void;
  endContract: (id: string, endDate: string) => void;
  deleteContract: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Real Data Initialization from Documents
const initialVehicles: Vehicle[] = [
  // --- GUINDASTES ---
  {
    id: '1', code: 'GD-01', type: VehicleType.GUINDASTE, brand: 'SANY', model: 'STC 800T5', year: 2024,
    plate: 'TJR3D89', chassis: 'LFCNPG6P7R3002100', capacity: '80 Ton', status: VehicleStatus.PARADO,
    defaultDailyRate: 4000, defaultMonthlyRate: 60000, isActive: true
  },
  {
    id: '2', code: 'GD-02', type: VehicleType.GUINDASTE, brand: 'SANY', model: 'STC 75', year: 2012,
    plate: 'EOE4294', chassis: '962S75425CS000066', capacity: '75 Ton', status: VehicleStatus.PARADO,
    defaultDailyRate: 3500, defaultMonthlyRate: 50000, isActive: true
  },
  {
    id: '3', code: 'GD-03', type: VehicleType.GUINDASTE, brand: 'SANY', model: 'STC 900T5', year: 2022,
    plate: 'GCZ8J15', chassis: 'LFCNPG6P2N3001379', capacity: '90 Ton', status: VehicleStatus.PARADO,
    defaultDailyRate: 4500, defaultMonthlyRate: 70000, isActive: true
  },
  {
    id: '4', code: 'GD-04', type: VehicleType.GUINDASTE, brand: 'SANY', model: 'STC2200T7', year: 2025,
    plate: 'UFU1G28', chassis: 'LFCNRG7P1S3003192', capacity: '220 Ton', status: VehicleStatus.PARADO,
    defaultDailyRate: 10000, defaultMonthlyRate: 150000, isActive: true
  },
  {
    id: '5', code: 'GD-05', type: VehicleType.GUINDASTE, brand: 'XCMG', model: 'QY 25K 5-I', year: 2012,
    plate: 'IUL1J52', chassis: 'LXGCPA325CA009872', capacity: '25 Ton', status: VehicleStatus.PARADO,
    defaultDailyRate: 2000, defaultMonthlyRate: 35000, isActive: true
  },
  {
    id: '6', code: 'GD-06', type: VehicleType.GUINDASTE, brand: 'XCMG', model: 'QY 50K-II', year: 2011,
    plate: 'ODF8207', chassis: 'LXGCPA413BA001113', capacity: '50 Ton', status: VehicleStatus.PARADO,
    defaultDailyRate: 3000, defaultMonthlyRate: 45000, isActive: true
  },
  {
    id: '7', code: 'GD-07', type: VehicleType.GUINDASTE, brand: 'XCMG', model: 'XCT110 BR', year: 2022,
    plate: 'FUS7E64', chassis: 'LXGCPA453NA000051', capacity: '110 Ton', status: VehicleStatus.PARADO,
    defaultDailyRate: 6000, defaultMonthlyRate: 90000, isActive: true
  },
  
  // --- MUNCKS ---
  {
    id: '8', code: 'MK-01', type: VehicleType.MUNCK, brand: 'SCANIA', model: 'P 310 B8X2', year: 2014,
    plate: 'FHY9J50', chassis: '9BSP8X200E3863948', capacity: '-', status: VehicleStatus.PARADO,
    defaultDailyRate: 1500, defaultMonthlyRate: 25000, isActive: true
  },
  {
    id: '9', code: 'MK-02', type: VehicleType.MUNCK, brand: 'VOLVO', model: 'VM 330 8X2R', year: 2021,
    plate: 'JBD6H98', chassis: '93KP0S1F5NE179342', capacity: '-', status: VehicleStatus.PARADO,
    defaultDailyRate: 1800, defaultMonthlyRate: 28000, isActive: true
  },
  {
    id: '10', code: 'MK-03', type: VehicleType.MUNCK, brand: 'VW', model: '23.220', year: 2003,
    plate: 'HRO7F92', chassis: '9BW2M82TX3R317700', capacity: '-', status: VehicleStatus.PARADO,
    defaultDailyRate: 1000, defaultMonthlyRate: 18000, isActive: true
  },
  {
    id: '11', code: 'MK-04', type: VehicleType.MUNCK, brand: 'VW', model: '24.280 CRM 6X2', year: 2020,
    plate: 'GIX2D98', chassis: '953658242MR121989', capacity: '-', status: VehicleStatus.PARADO,
    defaultDailyRate: 1600, defaultMonthlyRate: 26000, isActive: true
  },
  {
    id: '12', code: 'MK-05', type: VehicleType.MUNCK, brand: 'VW', model: '24.280 CRM 6X2', year: 2013,
    plate: 'FNF4421', chassis: '953658245DR352787', capacity: '-', status: VehicleStatus.PARADO,
    defaultDailyRate: 1400, defaultMonthlyRate: 22000, isActive: true
  }
];

const initialContracts: Contract[] = [];
const initialMaintenances: Maintenance[] = [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [maintenances, setMaintenances] = useState<Maintenance[]>(initialMaintenances);
  const [fuels, setFuels] = useState<FuelEntry[]>([]);
  const [expenses, setExpenses] = useState<GeneralExpense[]>([]);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);

  // --- Actions ---

  const addVehicle = (data: Omit<Vehicle, 'id' | 'isActive'>) => {
    const newVehicle: Vehicle = { ...data, id: generateId(), isActive: true };
    setVehicles([...vehicles, newVehicle]);
  };

  const updateVehicle = (id: string, data: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  };

  const deleteVehicle = (id: string) => {
    // Soft delete
    updateVehicle(id, { isActive: false });
  };

  const addMaintenance = (data: Omit<Maintenance, 'id' | 'totalCost'>) => {
    const totalCost = data.laborCost + data.partsCost;
    const newM: Maintenance = { ...data, id: generateId(), totalCost };
    setMaintenances([...maintenances, newM]);
    
    // Update vehicle status
    if (!data.endDate) {
      updateVehicle(data.vehicleId, { status: VehicleStatus.MANUTENCAO });
    } else {
      updateVehicle(data.vehicleId, { status: VehicleStatus.OPERANDO });
    }
  };

  const deleteMaintenance = (id: string) => {
    setMaintenances(prev => prev.filter(m => m.id !== id));
  };

  const addFuel = (data: Omit<FuelEntry, 'id' | 'totalValue'>) => {
    const totalValue = data.liters * data.pricePerLiter;
    setFuels([...fuels, { ...data, id: generateId(), totalValue }]);
  };

  const deleteFuel = (id: string) => {
    setFuels(prev => prev.filter(f => f.id !== id));
  };

  const addExpense = (data: Omit<GeneralExpense, 'id'>) => {
    setExpenses([...expenses, { ...data, id: generateId() }]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addContract = (data: Omit<Contract, 'id' | 'status'>) => {
    setContracts([...contracts, { ...data, id: generateId(), status: 'Active' }]);
    // Set vehicle to Operando or Reservado?
    updateVehicle(data.vehicleId, { status: VehicleStatus.OPERANDO });
  };

  const endContract = (id: string, endDate: string) => {
    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, endDate, status: 'Finished' };
      }
      return c;
    }));
    // We might want to set vehicle to Parado, but we need to know which vehicle.
    const contract = contracts.find(c => c.id === id);
    if(contract) {
        updateVehicle(contract.vehicleId, { status: VehicleStatus.PARADO });
    }
  };

  const deleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppContext.Provider value={{
      vehicles, maintenances, fuels, expenses, contracts,
      addVehicle, updateVehicle, deleteVehicle,
      addMaintenance, deleteMaintenance,
      addFuel, deleteFuel,
      addExpense, deleteExpense,
      addContract, endContract, deleteContract
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};