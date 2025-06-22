import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Printer, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: number;
  documentName: string;
  printerName: string;
  userName: string;
  createdAt: string;
  status: string;
}

const RecentActivity: React.FC = () => {
  const { data: activity, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/recent-activity'],
    queryFn: () => apiRequest({ url: '/api/recent-activity' }),
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Print Activity</h2>
      <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="divide-y divide-gray-200">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-4 sm:px-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activity && activity.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {activity.map((item) => (
              <li key={item.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {item.documentName}
                          </p>
                          <p className="mt-1 flex items-center text-sm text-gray-500">
                            <Printer className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                            <span>{item.printerName}</span>
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <div>
                            <p className="text-sm text-gray-900">
                              Printed on <time>{formatDate(item.createdAt)}</time>
                            </p>
                            <p className="mt-1 flex items-center text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-sm text-gray-500">No recent activity found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;