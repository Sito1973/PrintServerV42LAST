import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  FileText,
  Printer,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCw,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PrintJob {
  id: number;
  documentName: string;
  documentUrl: string;
  printerName: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  copies: number;
  duplex: boolean;
  orientation: string;
}

const PrintJobsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: printJobs, isLoading } = useQuery<PrintJob[]>({
    queryKey: ['/api/print-jobs'],
    queryFn: () => apiRequest('/api/print-jobs'),
    staleTime: 15000, // 15 segundos
    refetchInterval: 30000, // Refresca automáticamente cada 30 segundos (menos agresivo)
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobIds: number[]) => {
      const apiKey = localStorage.getItem('apiKey') || localStorage.getItem('api_key');
      if (!apiKey) {
        throw new Error('No se encontró la clave API');
      }

      const promises = jobIds.map(async id => {
        console.log(`🗑️ [DELETE] Eliminando trabajo ${id}...`);
        const response = await fetch(`/api/print-jobs/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        console.log(`📊 [DELETE] Respuesta para trabajo ${id}:`, response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [DELETE] Error eliminando trabajo ${id}:`, errorText);
          throw new Error(`Error eliminando trabajo ${id}: ${response.status} ${errorText}`);
        }

        console.log(`✅ [DELETE] Trabajo ${id} eliminado exitosamente`);
        return response.json();
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/print-jobs'] });
      setSelectedJobs([]);
      toast({
        title: "Trabajos eliminados",
        description: `Se eliminaron ${selectedJobs.length} trabajo(s) exitosamente.`,
      });
    },
    onError: (error) => {
      console.error("Error al eliminar trabajos:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar los trabajos de impresión",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <RotateCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredJobs = (printJobs && Array.isArray(printJobs))
    ? printJobs
        .filter((job) => {
          const matchesSearch =
            job.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.printerName.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesStatus =
            statusFilter === "all" || job.status === statusFilter;

          return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
          // Ordenar por fecha de creación, más nuevos primero
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
    : [];

  const handleSelectJob = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedJobs.length > 0) {
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = () => {
    deleteMutation.mutate(selectedJobs);
    setShowDeleteDialog(false);
  };

  return (
    <div className="flex flex-col">
      {/* Search and filter */}
      <div className="mt-4 mb-6 flex flex-col sm:flex-row">
        <div className="flex-1 min-w-0">
          <label htmlFor="search-jobs" className="sr-only">
            Search
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              id="search-jobs"
              className="pl-10"
              placeholder="Search print jobs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk actions */}
      {filteredJobs.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <Checkbox
              checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
              onCheckedChange={handleSelectAll}
              aria-label="Select all jobs"
            />
            <span className="text-sm text-gray-700">
              {selectedJobs.length > 0 
                ? `${selectedJobs.length} trabajo(s) seleccionado(s)`
                : "Seleccionar todos"
              }
            </span>
          </div>
          {selectedJobs.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar seleccionados
            </Button>
          )}
        </div>
      )}

      {/* Print Jobs list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-4 sm:px-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
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
        ) : filteredJobs.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <li key={job.id}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-4">
                          <Checkbox
                            checked={selectedJobs.includes(job.id)}
                            onCheckedChange={() => handleSelectJob(job.id)}
                            aria-label={`Select ${job.documentName}`}
                          />
                        </div>
                        <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary-50 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                          <div>
                            <p className="text-sm font-medium text-primary-600 truncate">
                              {job.documentName}
                            </p>
                            <p className="mt-1 flex items-center text-sm text-gray-500">
                              <Printer className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              <span>{job.printerName}</span>
                            </p>
                          </div>
                          <div className="hidden md:block">
                            <div>
                              <p className="text-sm text-gray-900">
                                Created: <time>{formatDate(job.createdAt)}</time>
                              </p>
                              {job.completedAt && (
                                <p className="mt-1 text-sm text-gray-900">
                                  Completed: <time>{formatDate(job.completedAt)}</time>
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <Badge 
                                  className={`flex items-center gap-1 ${getStatusBadgeClass(job.status)}`}
                                  variant="outline"
                                >
                                  {getStatusIcon(job.status)}
                                  <span>
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                  </span>
                                </Badge>
                                <Badge variant="outline" className="bg-gray-50">
                                  {job.copies} {job.copies === 1 ? "copy" : "copies"}
                                </Badge>
                                {job.duplex && (
                                  <Badge variant="outline" className="bg-gray-50">
                                    Double-sided
                                  </Badge>
                                )}
                                <Badge variant="outline" className="bg-gray-50 capitalize">
                                  {job.orientation}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:p-6 text-center">
            <div className="flex flex-col items-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-base font-medium">No print jobs found</p>
              <p className="text-sm">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar trabajos de impresión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar {selectedJobs.length} trabajo(s) de impresión? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrintJobsList;