// client/src/components/printers/PrinterFormExample.tsx
// Ejemplo de cómo actualizar el formulario de impresoras para usar el selector

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompanyLocationSelector from "@/components/ui/CompanyLocationSelector";

interface PrinterFormData {
  name: string;
  model?: string;
  uniqueId: string;
  location: string; // ID de la empresa
  floor: string;    // ID de la sede
  status: string;
  isActive: boolean;
  locationName?: string; // Nombre de la empresa (para mostrar)
  floorName?: string;    // Nombre de la sede (para mostrar)
}

interface PrinterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PrinterFormData) => void;
  initialData?: Partial<PrinterFormData>;
  title: string;
  submitText: string;
  isLoading?: boolean;
}

const PrinterFormExample: React.FC<PrinterFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  submitText,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PrinterFormData>({
    defaultValues: {
      name: '',
      model: '',
      uniqueId: '',
      location: '',
      floor: '',
      status: 'offline',
      isActive: true,
      ...initialData
    }
  });

  // Estados para el selector de empresa y sede
  const [selectedEmpresa, setSelectedEmpresa] = useState(initialData?.location || '');
  const [selectedSede, setSelectedSede] = useState(initialData?.floor || '');

  // Observar cambios en isActive para el switch
  const isActive = watch('isActive');
  const status = watch('status');

  // Resetear formulario cuando se cierra o cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setSelectedEmpresa(initialData.location || '');
      setSelectedSede(initialData.floor || '');
    } else {
      reset({
        name: '',
        model: '',
        uniqueId: '',
        location: '',
        floor: '',
        status: 'offline',
        isActive: true
      });
      setSelectedEmpresa('');
      setSelectedSede('');
    }
  }, [initialData, reset]);

  // Manejar cambio de empresa
  const handleEmpresaChange = (empresaId: string, empresaName: string) => {
    setSelectedEmpresa(empresaId);
    setValue('location', empresaId);
    setValue('locationName', empresaName);
    // Limpiar sede cuando cambia empresa
    setSelectedSede('');
    setValue('floor', '');
    setValue('floorName', '');
  };

  // Manejar cambio de sede
  const handleSedeChange = (sedeId: string, sedeName: string) => {
    setSelectedSede(sedeId);
    setValue('floor', sedeId);
    setValue('floorName', sedeName);
  };

  // Manejar envío del formulario
  const onFormSubmit = (data: PrinterFormData) => {
    // Asegurar que tenemos los IDs correctos
    const formData = {
      ...data,
      location: selectedEmpresa,
      floor: selectedSede
    };

    onSubmit(formData);
  };

  // Manejar cierre del diálogo
  const handleClose = () => {
    reset();
    setSelectedEmpresa('');
    setSelectedSede('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Modifica los datos de la impresora seleccionada."
              : "Completa los datos para registrar una nueva impresora."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre de la impresora <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "El nombre es requerido" 
                })}
                placeholder="Ej: Impresora Principal"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                {...register("model")}
                placeholder="Ej: HP LaserJet Pro"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uniqueId">
              ID Único <span className="text-red-500">*</span>
            </Label>
            <Input
              id="uniqueId"
              {...register("uniqueId", { 
                required: "El ID único es requerido" 
              })}
              placeholder="Identificador único de la impresora"
            />
            {errors.uniqueId && (
              <p className="text-sm text-red-500">{errors.uniqueId.message}</p>
            )}
          </div>

          {/* Selector de Empresa y Sede */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Ubicación de la Impresora</Label>
            <CompanyLocationSelector
              selectedEmpresa={selectedEmpresa}
              selectedSede={selectedSede}
              onEmpresaChange={handleEmpresaChange}
              onSedeChange={handleSedeChange}
              required={true}
              showLabels={true}
            />
            {(!selectedEmpresa || !selectedSede) && (
              <p className="text-sm text-red-500">
                Debe seleccionar tanto la empresa como la sede
              </p>
            )}
          </div>

          {/* Estado de la impresora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">En línea</SelectItem>
                  <SelectItem value="offline">Fuera de línea</SelectItem>
                  <SelectItem value="busy">Ocupada</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Impresora Activa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permite uso de esta impresora
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !selectedEmpresa || !selectedSede}
            >
              {isLoading ? "Guardando..." : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PrinterFormExample;

// Ejemplo de uso del componente:
/*
const PrinterListComponent = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  const handleCreatePrinter = (printerData: PrinterFormData) => {
    // Aquí printerData.location contendrá el ID de la empresa
    // y printerData.floor contendrá el ID de la sede

    console.log('Datos de la impresora:', printerData);
    // Llamar a la API para crear impresora...
    setShowCreateDialog(false);
  };

  const handleEditPrinter = (printerData: PrinterFormData) => {
    // Similar al crear, pero para editar
    console.log('Datos actualizados:', printerData);
    // Llamar a la API para actualizar impresora...
    setShowEditDialog(false);
  };

  return (
    <div>
      <Button onClick={() => setShowCreateDialog(true)}>
        Agregar Impresora
      </Button>

      <PrinterFormExample
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreatePrinter}
        title="Registrar Nueva Impresora"
        submitText="Registrar Impresora"
      />

      <PrinterFormExample
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSubmit={handleEditPrinter}
        initialData={selectedPrinter ? {
          name: selectedPrinter.name,
          model: selectedPrinter.model,
          uniqueId: selectedPrinter.uniqueId,
          location: selectedPrinter.location, // ID de empresa
          floor: selectedPrinter.floor,       // ID de sede
          status: selectedPrinter.status,
          isActive: selectedPrinter.isActive,
        } : undefined}
        title="Editar Impresora"
        submitText="Guardar Cambios"
      />
    </div>
  );
};
*/