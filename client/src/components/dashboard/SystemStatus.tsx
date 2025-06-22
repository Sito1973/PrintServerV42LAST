
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Activity, Printer, FileText, Clock, Users } from "lucide-react";

interface SystemStats {
  activePrinters: number;
  totalPrinters: number;
  jobsToday: number;
  pendingJobs: number;
  failedJobs: number;
  activeUsers: number;
  totalUsers: number;
  totalJobs: number;
  // NUEVO: Lista detallada de usuarios activos
  activeUsersList: Array<{
    userId: string;
    username: string;
    joinTime: string;
    lastActivity: string;
  }>;
}

const SystemStatus: React.FC = () => {
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ['/api/stats'],
    queryFn: () => apiRequest({ url: '/api/stats' }),
    refetchInterval: 5000, // Actualizar cada 5 segundos
    refetchIntervalInBackground: true, // Continuar actualizando en background
  });

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const statCards = [
    {
      title: "Active Printers",
      value: stats ? `${stats.activePrinters}` : "0",
      subtitle: stats ? `${stats.totalPrinters} total` : "0 total",
      icon: Printer,
      gradient: "from-blue-500 via-blue-600 to-indigo-700",
      bgGradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      percentage: stats ? calculatePercentage(stats.activePrinters, stats.totalPrinters) : 0,
      status: stats && stats.activePrinters === stats.totalPrinters ? 'excellent' : 
              stats && stats.activePrinters > 0 ? 'good' : 'critical'
    },
    {
      title: "Print Jobs Today",
      value: stats ? `${stats.jobsToday}` : "0",
      subtitle: "completed today",
      icon: FileText,
      gradient: "from-green-500 via-emerald-600 to-teal-700",
      bgGradient: "from-green-50 to-emerald-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      percentage: stats ? Math.min((stats.jobsToday / 10) * 100, 100) : 0,
      status: stats && stats.jobsToday > 5 ? 'excellent' : 
              stats && stats.jobsToday > 0 ? 'good' : 'neutral'
    },
    {
      title: "Failed Jobs",
      value: stats ? `${stats.failedJobs}` : "0",
      subtitle: "con errores",
      icon: Clock,
      gradient: "from-red-500 via-red-600 to-red-700",
      bgGradient: "from-red-50 to-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      percentage: stats ? Math.min((stats.failedJobs / 10) * 100, 100) : 0,
      status: stats && stats.failedJobs === 0 ? 'excellent' : 
              stats && stats.failedJobs < 3 ? 'warning' : 'critical'
    },
    {
      title: "Active Users",
      value: stats ? `${stats.activeUsers}` : "0",
      subtitle: stats ? `${stats.totalUsers} total` : "0 total",
      icon: Users,
      gradient: "from-purple-500 via-violet-600 to-indigo-700",
      bgGradient: "from-purple-50 to-violet-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      percentage: stats ? calculatePercentage(stats.activeUsers, stats.totalUsers) : 0,
      status: stats && stats.activeUsers > 0 ? 'good' : 'neutral'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent">
            System Status
          </h2>
          <p className="text-gray-600 mt-1">Real-time system performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      {/* Modern Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-2xl glass-effect hover-lift animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
            
            {/* Content */}
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(stat.status)} shadow-lg`}></div>
              </div>

              {/* Value */}
              <div className="mb-3">
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">{stat.title}</div>
                <div className="text-xs text-gray-500">{stat.subtitle}</div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-600 font-medium">
                  {stat.percentage}% capacity
                </div>
              </div>
            </div>

            {/* Hover Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}></div>
          </div>
        ))}
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Overall Health Card */}
        <Card className="glass-effect hover-lift border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                System Health
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Overall Status</span>
                <Badge className={`
                  ${stats && stats.activePrinters > 0 && stats.pendingJobs < 5 && stats.failedJobs === 0
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : stats && stats.activePrinters > 0 && stats.failedJobs < 3
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }
                `}>
                  {stats ? (
                    stats.activePrinters === 0 
                      ? "🔴 Critical" 
                      : stats.activePrinters === stats.totalPrinters && stats.pendingJobs < 3 && stats.failedJobs === 0
                        ? "🟢 Excellent"
                        : stats.activePrinters > 0 && stats.failedJobs < 3
                          ? "🟡 Good"
                          : "🟠 Warning"
                  ) : "⚪ Loading..."}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">System Performance</span>
                  <span className="font-medium text-gray-900">
                    {stats ? `${Math.round((stats.activePrinters / stats.totalPrinters) * 100)}%` : "0%"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: stats 
                        ? `${Math.round((stats.activePrinters / stats.totalPrinters) * 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-effect hover-lift border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                System Info
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Database</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">API Server</span>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Running
                </Badge>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStatus;
