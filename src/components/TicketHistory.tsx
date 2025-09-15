import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Search, Clock, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface TicketHistoryEntry {
  id: string;
  submission_date: string;
  ticket_number: string;
  university: string;
  domain: string;
  category: string;
  subcategory: string;
  activity_type: string;
  task_name: string;
  status: string;
  time_logged_seconds: number;
  comments: string;
  created_at: string;
}

interface TicketHistoryProps {
  userId: string;
}

export const TicketHistory: React.FC<TicketHistoryProps> = ({ userId }) => {
  const [historyEntries, setHistoryEntries] = useState<TicketHistoryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TicketHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTicketHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_history')
        .select('*')
        .eq('user_id', userId)
        .order('submission_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ticket history:', error);
        toast({
          title: "Error",
          description: "Failed to load ticket history",
          variant: "destructive"
        });
        return;
      }

      setHistoryEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error fetching ticket history:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTicketHistory();
    }
  }, [userId]);

  const handleSearch = () => {
    let filtered = historyEntries;

    if (searchDate) {
      filtered = filtered.filter(entry => 
        entry.submission_date === searchDate
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(entry => 
        entry.submission_date >= startDate && entry.submission_date <= endDate
      );
    } else if (startDate) {
      filtered = filtered.filter(entry => 
        entry.submission_date >= startDate
      );
    } else if (endDate) {
      filtered = filtered.filter(entry => 
        entry.submission_date <= endDate
      );
    }

    setFilteredEntries(filtered);
  };

  const clearFilters = () => {
    setSearchDate('');
    setStartDate('');
    setEndDate('');
    setFilteredEntries(historyEntries);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const groupEntriesByDate = (entries: TicketHistoryEntry[]) => {
    const grouped = entries.reduce((acc, entry) => {
      const date = entry.submission_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, TicketHistoryEntry[]>);

    return Object.entries(grouped).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  };

  const groupedEntries = groupEntriesByDate(filteredEntries);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Ticket History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">Search by Date</label>
                <Input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  placeholder="Select date"
                />
              </div>
              
              <div className="flex gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">From Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End date"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </Button>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </div>

            <Separator />

            {/* Results */}
            {loading ? (
              <div className="text-center py-8">Loading ticket history...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {historyEntries.length === 0 
                  ? "No ticket history found. Submit some timesheets to see your history here."
                  : "No tickets found for the selected date range."
                }
              </div>
            ) : (
              <div className="space-y-6">
                {groupedEntries.map(([date, entries]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Calendar className="w-5 h-5" />
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      <Badge variant="secondary">{entries.length} tickets</Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      {entries.map((entry) => (
                        <Card key={entry.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="font-semibold text-primary">
                                  Ticket #{entry.ticket_number}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {entry.university} • {entry.domain}
                                </div>
                                <Badge variant="outline" className="w-fit">
                                  {entry.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="font-medium">Category:</span> {entry.category}
                                </div>
                                {entry.subcategory && (
                                  <div className="text-sm">
                                    <span className="font-medium">Subcategory:</span> {entry.subcategory}
                                  </div>
                                )}
                                {entry.activity_type && (
                                  <div className="text-sm">
                                    <span className="font-medium">Activity:</span> {entry.activity_type}
                                  </div>
                                )}
                                {entry.task_name && (
                                  <div className="text-sm">
                                    <span className="font-medium">Task:</span> {entry.task_name}
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(entry.time_logged_seconds)}
                                </div>
                                {entry.comments && (
                                  <div className="text-sm">
                                    <span className="font-medium">Comments:</span>
                                    <div className="mt-1 p-2 bg-muted rounded text-xs">
                                      {entry.comments}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};