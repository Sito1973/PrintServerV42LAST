// client/src/components/settings/CompanyLocationSettings.tsx

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { 
  useCompanies, 
  useCreateCompany, 
  useUpdateCompany, 
  useDeleteCompany,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation
} from "@/hooks/useCompanies";

interface EmpresaFormData {
  name: string;
}

interface SedeFormData {
  name: string;
}

const CompanyLocationSettings: React.FC = () => {
  // Estados para diálogos
  const [showEmpresaDialog, setShowEmpresaDialog] = useState(false);
  const [showSedeDialog, setShowSedeDialog] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<{ id: number; name: string } | null>(null);
  const [editingSede, setEditingSede] = useState<{ 
    empresa: { id: number; name: string }; 
    sede: { id: number; name: string } 
  } | null>(null);
  const [selectedEmpresaForSede, setSelectedEmpresaForSede] = useState<number | null>(null);

  // API hooks
  const { data: companies = [], isLoading, error } = useCompanies();
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();

  // Formularios
  const empresaForm = useForm<EmpresaFormData>();
  const sedeForm = useForm<SedeFormData>();

  // Calcular estadísticas
  const totalSedes = companies.reduce((total, empresa) => total + empresa.locations.length, 0);

  // Handlers para empresas
  const handleAddEmpresa = (data: EmpresaFormData) => {
    createCompanyMutation.mutate(
      { name: data.name.trim() },
      {
        onSuccess: () => {
          empresaForm.reset();
          setShowEmpresaDialog(false);
        }
      }
    );
  };

  const handleEditEmpresa = (empresa: { id: number; name: string }) => {
    setEditingEmpresa(empresa);
    empresaForm.setValue('name', empresa.name);
    setShowEmpresaDialog(true);
  };

  const handleUpdateEmpresa = (data: EmpresaFormData) => {
    if (editingEmpresa) {
      updateCompanyMutation.mutate(
        { 
          id: editingEmpresa.id, 
          data: { name: data.name.trim() } 
        },
        {
          onSuccess: () => {
            empresaForm.reset();
            setShowEmpresaDialog(false);
            setEditingEmpresa(null);
          }
        }
      );
    }
  };

  const handleRemoveEmpresa = (empresaId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta empresa? También se eliminarán todas sus sedes.')) {
      deleteCompanyMutation.mutate(empresaId);
    }
  };

  // Handlers para sedes
  const handleAddSede = (data: SedeFormData) => {
    if (selectedEmpresaForSede) {
      createLocationMutation.mutate(
        {
          name: data.name.trim(),
          companyId: selectedEmpresaForSede
        },
        {
          onSuccess: () => {
            sedeForm.reset();
            setShowSedeDialog(false);
            setSelectedEmpresaForSede(null);
          }
        }
      );
    }
  };

  const handleEditSede = (empresa: { id: number; name: string }, sede: { id: number; name: string }) => {
    setEditingSede({ empresa, sede });
    sedeForm.setValue('name', sede.name);
    setShowSedeDialog(true);
  };

  const handleUpdateSede = (data: SedeFormData) => {
    if (editingSede) {
      updateLocationMutation.mutate(
        {
          id: editingSede.sede.id,
          data: { name: data.name.trim() }
        },
        {
          onSuccess: () => {
            sedeForm.reset();
            setShowSedeDialog(false);
            setEditingSede(null);
          }
        }
      );
    }
  };

  const handleRemoveSede = (sedeId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta sede?')) {
      deleteLocationMutation.mutate(sedeId);
    }
  };

  // Resetear diálogos
  const resetEmpresaDialog = () => {
    setShowEmpresaDialog(false);
    setEditingEmpresa(null);
    empresaForm.reset();
  };

  const resetSedeDialog = () => {
    setShowSedeDialog(false);
    setEditingSede(null);
    setSelectedEmpresaForSede(null);
    sedeForm.reset();
  };

  // Estados de carga
  const isAnyMutationLoading = 
    createCompanyMutation.isPending ||
    updateCompanyMutation.isPending ||
    deleteCompanyMutation.isPending ||
    createLocationMutation.isPending ||
    updateLocationMutation.isPending ||
    deleteLocationMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestión de Empresas y Sedes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando empresas y sedes...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestión de Empresas y Sedes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-500 bg-red-50 p-4 rounded border">
              <strong>Error:</strong> No se pudieron cargar las empresas y sedes.
              <br />
              <span className="text-sm">Verifica que el servidor esté funcionando y reintenta.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestión de Empresas y Sedes
          </CardTitle>
          <CardDescription>
            Configure las empresas y sus respectivas sedes para ser utilizadas en la asignación de usuarios e impresoras.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sedes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSedes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowEmpresaDialog(true)}
          disabled={isAnyMutationLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>

        <Button 
          variant="outline" 
          onClick={() => setShowSedeDialog(true)}
          disabled={isAnyMutationLoading || companies.length === 0}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Nueva Sede
        </Button>
      </div>

      {/* Lista de empresas y sedes */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas y Sedes Configuradas</CardTitle>
          <CardDescription>
            Gestiona las empresas existentes y sus sedes asociadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay empresas configuradas</p>
              <p className="text-sm">Comienza agregando tu primera empresa</p>
            </div>
          ) : (
            <div className="space-y-6">
              {companies.map((empresa) => (
                <div key={empresa.id} className="border rounded-lg p-4">
                  {/* Header de la empresa */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{empresa.name}</h3>
                        <p className="text-sm text-gray-500">
                          {empresa.locations.length} sede{empresa.locations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEmpresa(empresa)}
                        disabled={isAnyMutationLoading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEmpresa(empresa.id)}
                        disabled={isAnyMutationLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Lista de sedes */}
                  {empresa.locations.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 bg-gray-50 rounded">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No hay sedes para esta empresa</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {empresa.locations.map((sede) => (
                        <div key={sede.id} className="bg-gray-50 rounded border p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-sm">{sede.name}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSede(empresa, sede)}
                                disabled={isAnyMutationLoading}
                                className="h-7 w-7 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSede(sede.id)}
                                disabled={isAnyMutationLoading}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para Empresa */}
      <Dialog open={showEmpresaDialog} onOpenChange={resetEmpresaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? 'Editar Empresa' : 'Agregar Nueva Empresa'}
            </DialogTitle>
            <DialogDescription>
              {editingEmpresa 
                ? 'Modifica los datos de la empresa seleccionada.'
                : 'Ingresa los datos para crear una nueva empresa.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={empresaForm.handleSubmit(editingEmpresa ? handleUpdateEmpresa : handleAddEmpresa)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="empresa-name">Nombre de la Empresa</Label>
                <Input
                  id="empresa-name"
                  placeholder="Ej: Sede Principal, Sucursal Norte"
                  {...empresaForm.register('name', { required: 'El nombre es requerido' })}
                />
                {empresaForm.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {empresaForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={resetEmpresaDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
              >
                {(createCompanyMutation.isPending || updateCompanyMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingEmpresa ? 'Actualizar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Sede */}
      <Dialog open={showSedeDialog} onOpenChange={resetSedeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSede ? 'Editar Sede' : 'Agregar Nueva Sede'}
            </DialogTitle>
            <DialogDescription>
              {editingSede 
                ? 'Modifica los datos de la sede seleccionada.'
                : 'Selecciona una empresa e ingresa los datos para crear una nueva sede.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sedeForm.handleSubmit(editingSede ? handleUpdateSede : handleAddSede)}>
            <div className="space-y-4">
              {!editingSede && (
                <div className="space-y-2">
                  <Label htmlFor="empresa-select">Empresa</Label>
                  <select
                    id="empresa-select"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedEmpresaForSede || ''}
                    onChange={(e) => setSelectedEmpresaForSede(Number(e.target.value) || null)}
                    required
                  >
                    <option value="">Selecciona una empresa</option>
                    {companies.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sede-name">Nombre de la Sede</Label>
                <Input
                  id="sede-name"
                  placeholder="Ej: Piso 1 - Administración, Área Comercial"
                  {...sedeForm.register('name', { required: 'El nombre es requerido' })}
                />
                {sedeForm.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {sedeForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={resetSedeDialog}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={
                  (!editingSede && !selectedEmpresaForSede) ||
                  createLocationMutation.isPending ||
                  updateLocationMutation.isPending
                }
              >
                {(createLocationMutation.isPending || updateLocationMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingSede ? 'Actualizar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyLocationSettings;