import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GlobalDateFilter, DateFilterMode } from '@/utils/dateHelpers';

interface DashboardContextType {
  globalDateFilter: GlobalDateFilter;
  setDateFilter: (mode: DateFilterMode, startDate?: Date, endDate?: Date) => void;
  refreshData: () => void;
  lastUpdated: Date;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [globalDateFilter, setGlobalDateFilter] = useState<GlobalDateFilter>({
    mode: 'this-month'
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const setDateFilter = useCallback((mode: DateFilterMode, startDate?: Date, endDate?: Date) => {
    setGlobalDateFilter({
      mode,
      startDate,
      endDate
    });
    setLastUpdated(new Date());
  }, []);

  const refreshData = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  const value: DashboardContextType = {
    globalDateFilter,
    setDateFilter,
    refreshData,
    lastUpdated
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};