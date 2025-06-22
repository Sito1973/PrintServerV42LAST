// client/src/components/printers/AddPrinterForm.tsx - VERSIÓN ACTUALIZADA

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/AuthProvider";
import CompanyLocationSelector from "@/components/ui/CompanyLocationSelector";

const formSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  model: z.string().optional(),
  uniqueId: z.string().min(1, "ID único es requerido"),
  location: z.string().min(1, "Empresa es requerida"),
  floor: z.string().min(1, "Sede es requerida"),
  status: z.enum(["online", "offline", "busy", "error"]),
});

type PrinterFormValues = z.infer<typeof formSchema>;

interface AddPrinterFormProps {
  trigger?: React.ReactNode;
}

const AddPrinterForm: React.FC<AddPrinterFormProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados para el selector de empresa y sede
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [empresaName, setEmpresaName] = useState('');
  const [sedeName, setSedeName] = useState('');

  const form = useForm<PrinterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      model: "",
      uniqueId: "",
      location: "",
      floor: "",
      status: "offline",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PrinterFormValues) => {
      return apiRequest({
        method: "POST",
        url: "/api/printers",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Impresora agregada exitosamente",
        description: `La impresora ${form.getValues("name")} ha sido registrada.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/printers"] });
      setOpen(false);
      form.reset();
      // Limpiar selecciones
      setSelectedEmpresa('');
      setSelectedSede('');
      setEmpresaName('');
      setSedeName('');
    },
    onError: (error: any) => {
      toast({
        title: "Error al agregar impresora",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  // Manejar cambio de empresa
  const handleEmpresaChange = (empresaId: string, empresaName: string) => {
    setSelectedEmpresa(empresaId);
    setEmpresaName(empresaName);
    form.setValue('location', empresaId);
    // Limpiar sede cuando cambia empresa
    setSelectedSede('');
    setSedeName('');
    form.setValue('floor', '');
    // Limpiar errores previos
    form.clearErrors('location');
    form.clearErrors('floor');
  };

  // Manejar cambio de sede
  const handleSedeChange = (sedeId: string, sedeName: string) => {
    setSelectedSede(sedeId);
    setSedeName(sedeName);
    form.setValue('floor', sedeId);
    // Limpiar errores previos
    form.clearErrors('floor');
  };

  const onSubmit = (data: PrinterFormValues) => {
    // Verificar que tenemos empresa y sede seleccionadas
    if (!selectedEmpresa || !selectedSede) {
      toast({
        title: "Selección incompleta",
        description: "Debe seleccionar tanto la empresa como la sede",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(data);
  };

  // Manejar cierre del diálogo
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Limpiar formulario y selecciones al cerrar
      form.reset();
      setSelectedEmpresa('');
      setSelectedSede('');
      setEmpresaName('');
      setSedeName('');
    }
  };

  // Solo mostrar para administradores
  if (!user?.isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Impresora
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Impresora</DialogTitle>
          <DialogDescription>
            Ingrese los detalles de la nueva impresora para agregarla al sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="HP LaserJet Pro M404dn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="LaserJet Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uniqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Único</FormLabel>
                    <FormControl>
                      <Input placeholder="impresora123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector de Empresa y Sede */}
              <div className="col-span-2 space-y-2">
                <FormLabel className="text-base font-medium">Ubicación de la Impresora</FormLabel>
                <CompanyLocationSelector
                  selectedEmpresa={selectedEmpresa}
                  selectedSede={selectedSede}
                  onEmpresaChange={handleEmpresaChange}
                  onSedeChange={handleSedeChange}
                  required={true}
                  showLabels={true}
                />

                {/* Mostrar selección actual */}
                {selectedEmpresa && selectedSede && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded border">
                    <div><strong>Empresa:</strong> {empresaName}</div>
                    <div><strong>Sede:</strong> {sedeName}</div>
                  </div>
                )}

                {/* Errores de validación para empresa y sede */}
                {form.formState.errors.location && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.location.message}
                  </p>
                )}
                {form.formState.errors.floor && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.floor.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">En línea</SelectItem>
                        <SelectItem value="offline">Desconectada</SelectItem>
                        <SelectItem value="busy">Ocupada</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={mutation.isPending || !selectedEmpresa || !selectedSede}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                {mutation.isPending ? "Agregando..." : "Agregar Impresora"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPrinterForm;