import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatFilterMode, getTimezoneDisplay, getDateBoundaries } from '@/utils/dateHelpers';
import { useDashboard } from '@/contexts/DashboardContext';

export const FilterStatusPill: React.FC = () => {
  const { globalDateFilter, lastUpdated } = useDashboard();
  
  const filterDisplay = formatFilterMode(globalDateFilter);
  const timezone = getTimezoneDisplay();
  const boundaries = getDateBoundaries(globalDateFilter);
  
  const computedTime = lastUpdated.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        Filter: {filterDisplay} (local {timezone})
      </Badge>
      <span className="text-foreground-muted">
        computed {computedTime}
      </span>
      <span className="text-xs text-foreground-muted">
        {boundaries.startDate.toLocaleDateString()} - {boundaries.endDate.toLocaleDateString()}
      </span>
    </div>
  );
};