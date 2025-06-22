// client/src/components/users/UserFormExample.tsx
// Ejemplo de cómo actualizar el formulario de usuarios para usar el selector

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
import CompanyLocationSelector from "@/components/ui/CompanyLocationSelector";

interface UserFormData {
  username: string;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  location: string; // ID de la empresa
  floor: string;    // ID de la sede
  locationName?: string; // Nombre de la empresa (para mostrar)
  floorName?: string;    // Nombre de la sede (para mostrar)
  regenerateApiKey?: boolean;
}

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: Partial<UserFormData>;
  title: string;
  submitText: string;
  isLoading?: boolean;
}

const UserFormExample: React.FC<UserFormProps> = ({
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
  } = useForm<UserFormData>({
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      isAdmin: false,
      location: '',
      floor: '',
      regenerateApiKey: false,
      ...initialData
    }
  });

  // Estados para el selector de empresa y sede
  const [selectedEmpresa, setSelectedEmpresa] = useState(initialData?.location || '');
  const [selectedSede, setSelectedSede] = useState(initialData?.floor || '');

  // Observar cambios en isAdmin para el switch
  const isAdmin = watch('isAdmin');

  // Resetear formulario cuando se cierra o cambian los datos iniciales
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setSelectedEmpresa(initialData.location || '');
      setSelectedSede(initialData.floor || '');
    } else {
      reset({
        username: '',
        name: '',
        email: '',
        password: '',
        isAdmin: false,
        location: '',
        floor: '',
        regenerateApiKey: false
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
  const onFormSubmit = (data: UserFormData) => {
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
              ? "Modifica los datos del usuario seleccionado."
              : "Completa los datos para crear un nuevo usuario."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Nombre de usuario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                {...register("username", { 
                  required: "El nombre de usuario es requerido" 
                })}
                placeholder="usuario123"
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "El nombre es requerido" 
                })}
                placeholder="Juan Pérez"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Correo electrónico <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email", { 
                required: "El correo es requerido",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Formato de correo inválido"
                }
              })}
              placeholder="juan@empresa.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Contraseña {initialData && "(dejar vacío para no cambiar)"}
              {!initialData && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="password"
              type="password"
              {...register("password", !initialData ? { 
                required: "La contraseña es requerida",
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres"
                }
              } : {})}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Selector de Empresa y Sede */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Asignación de Ubicación</Label>
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

          {/* Configuraciones adicionales */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isAdmin" className="text-sm font-medium">
                  Administrador
                </Label>
                <p className="text-xs text-muted-foreground">
                  Otorga permisos administrativos completos
                </p>
              </div>
              <Switch
                id="isAdmin"
                checked={isAdmin}
                onCheckedChange={(checked) => setValue('isAdmin', checked)}
              />
            </div>

            {initialData && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="regenerateApiKey" className="text-sm font-medium">
                    Regenerar API Key
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Genera una nueva clave API para este usuario
                  </p>
                </div>
                <Switch
                  id="regenerateApiKey"
                  checked={watch('regenerateApiKey')}
                  onCheckedChange={(checked) => setValue('regenerateApiKey', checked)}
                />
              </div>
            )}
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

export default UserFormExample;

// Ejemplo de uso del componente:
/*
const UserListComponent = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleCreateUser = (userData: UserFormData) => {
    // Aquí userData.location contendrá el ID de la empresa
    // y userData.floor contendrá el ID de la sede
    // También tendrás userData.locationName y userData.floorName 
    // con los nombres legibles para mostrar

    console.log('Datos del usuario:', userData);
    // Llamar a la API para crear usuario...
    setShowCreateDialog(false);
  };

  const handleEditUser = (userData: UserFormData) => {
    // Similar al crear, pero para editar
    console.log('Datos actualizados:', userData);
    // Llamar a la API para actualizar usuario...
    setShowEditDialog(false);
  };

  return (
    <div>
      <Button onClick={() => setShowCreateDialog(true)}>
        Crear Usuario
      </Button>

      <UserFormExample
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateUser}
        title="Crear Nuevo Usuario"
        submitText="Crear Usuario"
      />

      <UserFormExample
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSubmit={handleEditUser}
        initialData={selectedUser ? {
          username: selectedUser.username,
          name: selectedUser.name,
          email: selectedUser.email,
          isAdmin: selectedUser.isAdmin,
          location: selectedUser.location, // ID de empresa
          floor: selectedUser.floor,       // ID de sede
        } : undefined}
        title="Editar Usuario"
        submitText="Guardar Cambios"
      />
    </div>
  );
};
*/