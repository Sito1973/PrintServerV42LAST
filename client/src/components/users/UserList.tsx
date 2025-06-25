// client/src/components/users/UserList.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CompanyLocationSelector from '@/components/ui/CompanyLocationSelector';
import { useLocationNames } from '@/hooks/useLocationNames';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  MapPin,
  Circle, // Para el indicador de estado
  Wifi,   // Para el icono de conectado
  WifiOff, // Para el icono de desconectado
  Copy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserEditForm {
  username?: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
  location?: string;
  floor?: string;
  locationName?: string;
  floorName?: string;
  regenerateApiKey?: boolean;
}

interface ActiveUser {
  userId: string;
  username: string;
  joinTime: string;
  lastActivity: string;
  duration: number;
}

interface StatsResponse {
  activePrinters: number;
  jobsToday: number;
  pendingJobs: number;
  failedJobs: number;
  activeUsers: number;
  totalPrinters: number;
  totalUsers: number;
  totalJobs: number;
  activeUsersList: ActiveUser[];
}

// Componente para mostrar ubicación con iconos
const LocationDisplay: React.FC<{ user: User }> = ({ user }) => {
  const { getLocationNames } = useLocationNames();

  const getLocationDisplay = () => {
    // Obtener nombres actuales de ubicación
    const { empresaName, sedeName } = getLocationNames(user.location || '', user.floor || '');

    if (empresaName && sedeName) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Building2 className="h-3 w-3 text-blue-600" />
            <span className="font-medium">{empresaName}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3 w-3 text-green-600" />
            <span>{sedeName}</span>
          </div>
        </div>
      );
    }

    // Fallback para datos antiguos
    return (
      <div className="space-y-1">
        <div className="text-sm text-amber-600">
          {user.location || 'Sin empresa'}
        </div>
        <div className="text-xs text-gray-500">
          {user.floor || 'Sin sede'}
        </div>
        <div className="text-xs text-amber-500 italic">
          (Datos antiguos)
        </div>
      </div>
    );
  };

  return getLocationDisplay();
};

// Componente para mostrar el estado de conexión
const OnlineIndicator: React.FC<{ user: User; activeUsers: ActiveUser[] }> = ({ user, activeUsers }) => {
  const isOnline = activeUsers.some(activeUser => activeUser.userId === user.id.toString());
  const activeUserData = activeUsers.find(activeUser => activeUser.userId === user.id.toString());

  if (isOnline && activeUserData) {
    const duration = Math.floor(activeUserData.duration / 60); // convertir a minutos
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
          <Wifi className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-xs">
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            En línea
          </Badge>
          <div className="text-gray-500 mt-1">
            {duration > 0 ? `${duration}m conectado` : ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
        <WifiOff className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-xs">
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-300">
          Desconectado
        </Badge>
      </div>
    </div>
  );
};

const UserList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<UserEditForm>({});
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  // Estados para el selector de empresa y sede en edición
  const [editSelectedEmpresa, setEditSelectedEmpresa] = useState('');
  const [editSelectedSede, setEditSelectedSede] = useState('');

  const { getLocationNames } = useLocationNames();

  // Query para obtener usuarios
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest({ url: '/api/users' }),
    staleTime: 5000,
    refetchInterval: 10000,
  });

  // Query para obtener estadísticas de usuarios activos (solo cuando se necesite)
  const { data: stats, refetch: refetchStats } = useQuery<StatsResponse>({
    queryKey: ['/api/stats-users'],
    queryFn: () => apiRequest({ url: '/api/stats' }),
    staleTime: 60000, // Datos válidos por 1 minuto
    refetchOnWindowFocus: false, // No refrescar automáticamente
    refetchOnMount: true, // Solo refrescar al montar el componente
  });

  // Actualizar lista de usuarios activos cuando cambian las estadísticas
  useEffect(() => {
    if (stats?.activeUsersList) {
      setActiveUsers(stats.activeUsersList);
    }
  }, [stats]);

  // Función para actualizar manualmente los datos de usuarios online
  const refreshOnlineUsers = () => {
    refetchStats();
  };

  // Refrescar datos cuando el componente se monta
  useEffect(() => {
    refreshOnlineUsers();
  }, []);

  // Mutation para actualizar usuario
  const updateMutation = useMutation({
    mutationFn: async (data: {id: number, userData: Partial<User>}) => {
      await apiRequest({
        method: "PUT",
        url: `/api/users/${data.id}`,
        body: data.userData
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar usuario: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest({
        method: "DELETE",
        url: `/api/users/${id}`
      });
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setConfirmDelete(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al eliminar usuario: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Asegurar que users sea siempre un array
  const usersArray = Array.isArray(users) ? users : [];

  const filteredUsers = usersArray.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para abrir el diálogo de edición
  const openEditDialog = (user: User) => {
    setSelectedUser(user);

    // Obtener nombres actuales
    const { empresaName, sedeName } = getLocationNames(user.location || '', user.floor || '');

    setEditFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      location: user.location || '',
      floor: user.floor || '',
      locationName: empresaName,
      floorName: sedeName,
    });

    // Configurar selecciones del selector
    setEditSelectedEmpresa(user.location || '');
    setEditSelectedSede(user.floor || '');

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
    setSelectedUser(null);
    setEditFormData({});
    setEditSelectedEmpresa('');
    setEditSelectedSede('');
  };

  // Función para manejar la actualización del usuario
  const handleUpdateUser = () => {
    if (!selectedUser) return;

    const updateData: Partial<User> = {
      username: editFormData.username,
      name: editFormData.name,
      email: editFormData.email,
      isAdmin: editFormData.isAdmin,
      location: editFormData.location,
      floor: editFormData.floor,
    };

    // Agregar regenerateApiKey si está marcado
    if (editFormData.regenerateApiKey) {
      (updateData as any).regenerateApiKey = true;
    }

    updateMutation.mutate({
      id: selectedUser.id,
      userData: updateData
    });
  };

  if (isLoading) {
    return <div>Cargando usuarios...</div>;
  }

  if (error) {
    return <div>Error al cargar usuarios: {error.message}</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Header con estadísticas de usuarios activos */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Lista de Usuarios</h3>
            <p className="text-sm text-gray-600">
              {usersArray.length} usuarios totales
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
                <span className="text-lg font-bold text-green-600">
                  {activeUsers.length}
                </span>
              </div>
              <div className="text-xs text-gray-600">En línea ahora</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
                <span className="text-lg font-bold text-gray-600">
                  {usersArray.length - activeUsers.length}
                </span>
              </div>
              <div className="text-xs text-gray-600">Desconectados</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshOnlineUsers}
              className="ml-4"
            >
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 mb-6 flex">
        <div className="flex-1 min-w-0">
          <label htmlFor="search-users" className="sr-only">
            Buscar
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              id="search-users"
              className="pl-10"
              placeholder="Buscar usuarios"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Key
              </th>
              <th className="relative px-6 py-3 min-w-[140px]">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                  {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No se encontraron usuarios.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* Columna de Estado - NUEVA */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <OnlineIndicator user={user} activeUsers={activeUsers} />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 ml-2">
                        @{user.username}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <LocationDisplay user={user} />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isAdmin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 font-mono">
                        {user.apiKey.substring(0, 20)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(user.apiKey);
                          toast({
                            title: "API Key copiada",
                            description: "La API Key ha sido copiada al portapapeles.",
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[140px]">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => {
                          setSelectedUser(user);
                          setConfirmDelete(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cuenta de usuario "{selectedUser?.name}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={closeEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado. Los cambios se guardarán inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input 
                id="edit-name" 
                value={editFormData.name || ''} 
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                placeholder="Nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuario</Label>
              <Input 
                id="edit-username" 
                value={editFormData.username || ''} 
                onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                placeholder="Nombre de usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={editFormData.email || ''} 
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                placeholder="correo@empresa.com"
              />
            </div>

            {/* Selector de Empresa y Sede */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Asignación de Ubicación</Label>
              <CompanyLocationSelector
                selectedEmpresa={editSelectedEmpresa}
                selectedSede={editSelectedSede}
                onEmpresaChange={handleEditEmpresaChange}
                onSedeChange={handleEditSedeChange}
                required={true}
                showLabels={true}
              />

              {/* Mostrar selección actual si hay una */}
              {editFormData.locationName && editFormData.floorName && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border">
                  <div><strong>Empresa:</strong> {editFormData.locationName}</div>
                  <div><strong>Sede:</strong> {editFormData.floorName}</div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="edit-admin" 
                className="w-4 h-4" 
                checked={editFormData.isAdmin || false} 
                onChange={(e) => setEditFormData({...editFormData, isAdmin: e.target.checked})}
              />
              <Label htmlFor="edit-admin">Administrador</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="edit-regenerate-key" 
                className="w-4 h-4" 
                checked={editFormData.regenerateApiKey || false} 
                onChange={(e) => setEditFormData({...editFormData, regenerateApiKey: e.target.checked})}
              />
              <Label htmlFor="edit-regenerate-key">Regenerar API Key</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={updateMutation.isPending || !editSelectedEmpresa || !editSelectedSede}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserList;