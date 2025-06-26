// client/src/components/printers/PrinterList.tsx - ACTUALIZADO PARA API

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Printer as PrinterIcon, 
  Search, 
  Edit, 
  Trash2,
  Building2,
  MapPin,
  Copy,
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompanyLocationSelector from "@/components/ui/CompanyLocationSelector";
import { useCompanies } from "@/hooks/useCompanies"; // ✅ NUEVO: Usar hook de API

interface Printer {
  id: number;           // ← ID numérico de la BD (auto-increment)
  name: string;
  location: string;
  model: string;
  status: string;
  floor: string;
  lastPrintTime: string | null;
  uniqueId: string;     // ← ID único que tú ingresas (texto)
  isActive: boolean;
  apiKeyUser?: string;  // ← API Key de usuario (opcional)
}

interface PrinterEditForm extends Partial<Printer> {
  locationName?: string;
  floorName?: string;
}

// ✅ NUEVO: Hook actualizado para usar API
const useLocationNames = () => {
  const { data: companies = [] } = useCompanies(); // ✅ Usar hook de API

  const getLocationNames = (locationId: string, floorId: string) => {
    // Convertir a números para comparación
    const companyId = Number(locationId);
    const sedeId = Number(floorId);

    // Buscar empresa
    const empresa = companies.find(e => e.id === companyId);

    // Buscar sede dentro de la empresa
    const sede = empresa?.locations.find(s => s.id === sedeId);

    return {
      empresaName: empresa?.name || '',
      sedeName: sede?.name || ''
    };
  };

  return { getLocationNames, companies };
};

// ✅ ACTUALIZADO: Componente para mostrar empresa y sede en la tabla
const PrinterLocationDisplay: React.FC<{ printer: Printer }> = ({ printer }) => {
  const { companies } = useLocationNames(); // ✅ Usar hook actualizado

  const getLocationDisplay = () => {
    if (!printer.location && !printer.floor) {
      return (
        <div className="text-gray-500 italic">
          Sin asignar
        </div>
      );
    }

    // Convertir a números para comparación
    const companyId = Number(printer.location);
    const sedeId = Number(printer.floor);

    const empresa = companies.find(e => e.id === companyId);
    const sede = empresa?.locations.find(s => s.id === sedeId);

    if (empresa && sede) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Building2 className="h-3 w-3 text-blue-600" />
            <span className="font-medium">{empresa.name}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3 w-3 text-green-600" />
            <span>{sede.name}</span>
          </div>
        </div>
      );
    }

    // Fallback para datos antiguos o IDs no válidos
    return (
      <div className="space-y-1">
        <div className="text-sm text-amber-600">
          {printer.location || 'Sin empresa'}
        </div>
        <div className="text-xs text-gray-500">
          {printer.floor || 'Sin sede'}
        </div>
        <div className="text-xs text-amber-500 italic">
          (Datos antiguos)
        </div>
      </div>
    );
  };

  return getLocationDisplay();
};

const PrinterList: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<PrinterEditForm>({});

  // Estados para el selector de empresa y sede en edición
  const [editSelectedEmpresa, setEditSelectedEmpresa] = useState('');
  const [editSelectedSede, setEditSelectedSede] = useState('');

  const { getLocationNames } = useLocationNames();

  const { data: printers = [], isLoading } = useQuery<Printer[]>({
    queryKey: ['/api/printers'],
    queryFn: () => apiRequest({ url: '/api/printers' }),
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest({
        method: "DELETE",
        url: `/api/printers/${id}`  // ← Usa el ID numérico para eliminar
      });
    },
    onSuccess: () => {
      toast({
        title: "Impresora eliminada",
        description: "La impresora ha sido eliminada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/printers'] });
      setConfirmDelete(false);
    },
    onError: (error) => {
      console.error("❌ [PRINTER-DELETE] Error en deleteMutation:", error);
      console.error("❌ [PRINTER-DELETE] Error message:", error.message);
      console.error("❌ [PRINTER-DELETE] Error tipo:", typeof error);

      toast({
        title: "Error",
        description: `Error al eliminar impresora: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {id: number, printerData: Partial<Printer>}) => {
      await apiRequest({
        method: "PUT",
        url: `/api/printers/${data.id}`,  // ← Usa el ID numérico para actualizar
        body: data.printerData
      });
    },
    onSuccess: () => {
      toast({
        title: "Impresora actualizada",
        description: "La impresora ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/printers'] });
      closeEditDialog();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar impresora: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Función para abrir el diálogo de edición
  const openEditDialog = (printer: Printer) => {
    setSelectedPrinter(printer);

    // Obtener nombres actuales
    const { empresaName, sedeName } = getLocationNames(printer.location || '', printer.floor || '');

    setEditFormData({
      name: printer.name,
      location: printer.location || '',
      floor: printer.floor || '',
      model: printer.model || '',
      status: printer.status,
      isActive: printer.isActive,
      uniqueId: printer.uniqueId,
      apiKeyUser: printer.apiKeyUser || '',
      locationName: empresaName,
      floorName: sedeName,
    });

    // Configurar selecciones del selector
    setEditSelectedEmpresa(printer.location || '');
    setEditSelectedSede(printer.floor || '');

    setShowEditDialog(true);
  };

  // Manejar cambio de empresa en edición
  const handleEditEmpresaChange = (empresaId: string, empresaName: string) => {
    setEditSelectedEmpresa(empresaId);
    setEditFormData(prev => ({
      ...prev,
      location: empresaId,
      locationName: empresaName,
      floor: '', // Limpiar sede
      floorName: ''
    }));
    // Limpiar sede cuando cambia empresa
    setEditSelectedSede('');
  };

  // Manejar cambio de sede en edición
  const handleEditSedeChange = (sedeId: string, sedeName: string) => {
    setEditSelectedSede(sedeId);
    setEditFormData(prev => ({
      ...prev,
      floor: sedeId,
      floorName: sedeName
    }));
  };

  // Función para cerrar el diálogo de edición
  const closeEditDialog = () => {
    setShowEditDialog(false);
    setSelectedPrinter(null);
    setEditFormData({});
    setEditSelectedEmpresa('');
    setEditSelectedSede('');
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Nunca";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `hace ${diffDay}d`;
    if (diffHour > 0) return `hace ${diffHour}h`;
    if (diffMin > 0) return `hace ${diffMin}m`;
    return `hace ${diffSec}s`;
  };

  const filteredPrinters = printers
    ?.filter((printer) => {
        const matchesSearch =
          printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          printer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          printer.model.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || printer.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
    || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search and filter */}
      <div className="mt-4 mb-6 flex flex-col sm:flex-row">
        <div className="flex-1 min-w-0">
          <label htmlFor="search-printers" className="sr-only">
            Buscar
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              id="search-printers"
              className="pl-10"
              placeholder="Buscar impresoras"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="online">En línea</SelectItem>
              <SelectItem value="offline">Desconectada</SelectItem>
              <SelectItem value="busy">Ocupada</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Printers table */}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impresora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último trabajo
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPrinters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                  {searchTerm || statusFilter !== "all" 
                    ? 'No se encontraron impresoras que coincidan con los filtros.' 
                    : 'No se encontraron impresoras.'}
                </td>
              </tr>
            ) : (
              filteredPrinters.map((printer) => (
                <tr key={printer.id} className="hover:bg-gray-50">

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <PrinterIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {printer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {printer.model}
                        </div>
                        {/* ✅ ID numérico con ícono de copiar */}
                        <div className="flex items-center text-xs text-gray-400 font-mono">
                          <span>ID: #{printer.id}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(printer.id.toString());
                              toast({
                                title: "ID copiado",
                                description: `ID #${printer.id} copiado al portapapeles.`,
                              });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PrinterLocationDisplay printer={printer} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        printer.status === "online"
                          ? "bg-green-100 text-green-800"
                          : printer.status === "busy"
                          ? "bg-blue-100 text-blue-800"
                          : printer.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {
                        printer.status === "online" ? "En línea" :
                        printer.status === "busy" ? "Ocupada" :
                        printer.status === "error" ? "Error" :
                        "Desconectada"
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTimeAgo(printer.lastPrintTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user?.isAdmin && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(printer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPrinter(printer);
                            setConfirmDelete(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={closeEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Impresora</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la impresora seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ''}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input
                  id="edit-model"
                  value={editFormData.model || ''}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, model: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-uniqueId">ID Único</Label>
                <Input
                  id="edit-uniqueId"
                  value={editFormData.uniqueId || ''}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, uniqueId: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apiKeyUser">API Key de Usuario (Opcional)</Label>
                <Input
                  id="edit-apiKeyUser"
                  placeholder="Ingrese la API Key"
                  value={editFormData.apiKeyUser || ''}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, apiKeyUser: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Selector de Empresa y Sede */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Ubicación de la Impresora</Label>
              <CompanyLocationSelector
                selectedEmpresa={editSelectedEmpresa}
                selectedSede={editSelectedSede}
                onEmpresaChange={handleEditEmpresaChange}
                onSedeChange={handleEditSedeChange}
                required={false}
                showLabels={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select
                value={editFormData.status || 'offline'}
                onValueChange={(value) =>
                  setEditFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">En línea</SelectItem>
                  <SelectItem value="offline">Desconectada</SelectItem>
                  <SelectItem value="busy">Ocupada</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedPrinter) {
                  updateMutation.mutate({
                    id: selectedPrinter.id,
                    printerData: {
                      name: editFormData.name,
                      model: editFormData.model,
                      uniqueId: editFormData.uniqueId,
                      location: editSelectedEmpresa,
                      floor: editSelectedSede,
                      status: editFormData.status,
                      isActive: editFormData.isActive,
                      apiKeyUser: editFormData.apiKeyUser,
                    }
                  });
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La impresora "{selectedPrinter?.name}" 
              será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPrinter) {
                  deleteMutation.mutate(selectedPrinter.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PrinterList;