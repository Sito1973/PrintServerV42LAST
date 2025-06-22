// client/src/components/users/AddUserForm.tsx - VERSIÓN ACTUALIZADA

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { UserPlus } from "lucide-react";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CompanyLocationSelector from "@/components/ui/CompanyLocationSelector";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  location: z.string().min(1, "Empresa is required"),
  floor: z.string().min(1, "Sede is required"),
  isAdmin: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface AddUserFormProps {
  trigger?: React.ReactNode;
}

const AddUserForm: React.FC<AddUserFormProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para el selector de empresa y sede
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [empresaName, setEmpresaName] = useState('');
  const [sedeName, setSedeName] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      location: "",
      floor: "",
      isAdmin: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest({
        method: "POST",
        url: "/api/users",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuario creado exitosamente",
        description: `El usuario ${form.getValues("name")} ha sido agregado.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
        title: "Error al crear usuario",
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

  const onSubmit = (data: FormData) => {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with the specified permissions.
            An API key will be automatically generated.
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector de Empresa y Sede */}
              <div className="col-span-2 space-y-2">
                <FormLabel className="text-base font-medium">Asignación de Ubicación</FormLabel>
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
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 col-span-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Administrator</FormLabel>
                      <FormDescription>
                        Admins have full access to manage printers, users, and print jobs.
                      </FormDescription>
                    </div>
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
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={mutation.isPending || !selectedEmpresa || !selectedSede}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {mutation.isPending ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserForm;