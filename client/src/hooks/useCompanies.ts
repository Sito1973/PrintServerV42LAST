import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Tipos para compatibilidad con el sistema existente
interface Company {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  locations: Location[];
}

interface Location {
  id: number;
  name: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
}

interface CreateCompanyData {
  name: string;
}

interface UpdateCompanyData {
  name: string;
}

interface CreateLocationData {
  name: string;
  companyId: number;
}

interface UpdateLocationData {
  name: string;
  companyId?: number;
}

// Query Keys
export const COMPANIES_QUERY_KEY = ['companies'] as const;
export const LOCATIONS_QUERY_KEY = ['locations'] as const;

// Hook para obtener todas las empresas con sus sedes
export const useCompanies = () => {
  return useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: async (): Promise<Company[]> => {
      console.log('🔄 [useCompanies] Fetching companies from API...');
      const response = await apiRequest({ url: '/api/companies' });
      console.log('✅ [useCompanies] Companies fetched:', response?.length || 0);
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook para obtener una empresa específica
export const useCompany = (companyId: number) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async (): Promise<Company> => {
      console.log(`🔄 [useCompany] Fetching company ${companyId}...`);
      const response = await apiRequest({ url: `/api/companies/${companyId}` });
      console.log(`✅ [useCompany] Company ${companyId} fetched`);
      return response;
    },
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para crear una nueva empresa
export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCompanyData): Promise<Company> => {
      console.log('➕ [useCreateCompany] Creating company:', data.name);
      const response = await apiRequest({
        url: '/api/companies',
        method: 'POST',
        body: data
      });
      console.log('✅ [useCreateCompany] Company created:', response?.id);
      return response;
    },
    onSuccess: (newCompany) => {
      // Invalidar y refrescar la lista de empresas
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });

      toast({
        title: "Empresa creada",
        description: `La empresa "${newCompany.name}" ha sido creada exitosamente.`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateCompany] Error:', error);
      toast({
        title: "Error al crear empresa",
        description: error.message || 'Error desconocido al crear empresa',
        variant: "destructive"
      });
    }
  });
};

// Hook para actualizar una empresa
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCompanyData }): Promise<Company> => {
      console.log(`✏️ [useUpdateCompany] Updating company ${id}:`, data.name);
      const response = await apiRequest({
        url: `/api/companies/${id}`,
        method: 'PUT',
        body: data
      });
      console.log(`✅ [useUpdateCompany] Company ${id} updated`);
      return response;
    },
    onSuccess: (updatedCompany) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['company', updatedCompany.id] });

      toast({
        title: "Empresa actualizada",
        description: `La empresa "${updatedCompany.name}" ha sido actualizada exitosamente.`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdateCompany] Error:', error);
      toast({
        title: "Error al actualizar empresa",
        description: error.message || 'Error desconocido al actualizar empresa',
        variant: "destructive"
      });
    }
  });
};

// Hook para eliminar una empresa
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (companyId: number): Promise<{ message: string; companyName: string }> => {
      console.log(`🗑️ [useDeleteCompany] Deleting company ${companyId}...`);
      const response = await apiRequest({
        url: `/api/companies/${companyId}`,
        method: 'DELETE'
      });
      console.log(`✅ [useDeleteCompany] Company ${companyId} deleted`);
      return response;
    },
    onSuccess: (result) => {
      // Invalidar la lista de empresas
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });

      toast({
        title: "Empresa eliminada",
        description: `La empresa "${result.companyName}" ha sido eliminada exitosamente.`,
        variant: "destructive"
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useDeleteCompany] Error:', error);
      toast({
        title: "Error al eliminar empresa",
        description: error.message || 'Error desconocido al eliminar empresa',
        variant: "destructive"
      });
    }
  });
};

// Hook para obtener todas las sedes (opcionalmente filtradas por empresa)
export const useLocations = (companyId?: number) => {
  return useQuery({
    queryKey: companyId ? ['locations', 'company', companyId] : LOCATIONS_QUERY_KEY,
    queryFn: async (): Promise<Location[]> => {
      const url = companyId ? `/api/locations?companyId=${companyId}` : '/api/locations';
      console.log(`🔄 [useLocations] Fetching locations from: ${url}`);
      const response = await apiRequest({ url });
      console.log('✅ [useLocations] Locations fetched:', response?.length || 0);
      return response || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook para obtener una sede específica
export const useLocation = (locationId: number) => {
  return useQuery({
    queryKey: ['location', locationId],
    queryFn: async (): Promise<Location> => {
      console.log(`🔄 [useLocation] Fetching location ${locationId}...`);
      const response = await apiRequest({ url: `/api/locations/${locationId}` });
      console.log(`✅ [useLocation] Location ${locationId} fetched`);
      return response;
    },
    enabled: !!locationId && locationId > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook para crear una nueva sede
export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLocationData): Promise<Location> => {
      console.log('➕ [useCreateLocation] Creating location:', data.name, 'for company:', data.companyId);
      const response = await apiRequest({
        url: '/api/locations',
        method: 'POST',
        body: data
      });
      console.log('✅ [useCreateLocation] Location created:', response?.id);
      return response;
    },
    onSuccess: (newLocation) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['locations', 'company', newLocation.companyId] });

      toast({
        title: "Sede creada",
        description: `La sede "${newLocation.name}" ha sido creada exitosamente.`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useCreateLocation] Error:', error);
      toast({
        title: "Error al crear sede",
        description: error.message || 'Error desconocido al crear sede',
        variant: "destructive"
      });
    }
  });
};

// Hook para actualizar una sede
export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateLocationData }): Promise<Location> => {
      console.log(`✏️ [useUpdateLocation] Updating location ${id}:`, data.name);
      const response = await apiRequest({
        url: `/api/locations/${id}`,
        method: 'PUT',
        body: data
      });
      console.log(`✅ [useUpdateLocation] Location ${id} updated`);
      return response;
    },
    onSuccess: (updatedLocation) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['location', updatedLocation.id] });
      queryClient.invalidateQueries({ queryKey: ['locations', 'company', updatedLocation.companyId] });

      toast({
        title: "Sede actualizada",
        description: `La sede "${updatedLocation.name}" ha sido actualizada exitosamente.`,
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useUpdateLocation] Error:', error);
      toast({
        title: "Error al actualizar sede",
        description: error.message || 'Error desconocido al actualizar sede',
        variant: "destructive"
      });
    }
  });
};

// Hook para eliminar una sede
export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (locationId: number): Promise<{ message: string; locationName: string; companyName: string }> => {
      console.log(`🗑️ [useDeleteLocation] Deleting location ${locationId}...`);
      const response = await apiRequest({
        url: `/api/locations/${locationId}`,
        method: 'DELETE'
      });
      console.log(`✅ [useDeleteLocation] Location ${locationId} deleted`);
      return response;
    },
    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });

      toast({
        title: "Sede eliminada",
        description: `La sede "${result.locationName}" de ${result.companyName} ha sido eliminada exitosamente.`,
        variant: "destructive"
      });
    },
    onError: (error: Error) => {
      console.error('❌ [useDeleteLocation] Error:', error);
      toast({
        title: "Error al eliminar sede",
        description: error.message || 'Error desconocido al eliminar sede',
        variant: "destructive"
      });
    }
  });
};

// Utility functions para compatibilidad con el código existente
export const findCompanyById = (companies: Company[], companyId: number): Company | undefined => {
  return companies.find(company => company.id === companyId);
};

export const findLocationById = (companies: Company[], locationId: number): Location | undefined => {
  for (const company of companies) {
    const location = company.locations.find(loc => loc.id === locationId);
    if (location) return location;
  }
  return undefined;
};

export const getLocationsByCompanyId = (companies: Company[], companyId: number): Location[] => {
  const company = findCompanyById(companies, companyId);
  return company?.locations || [];
};

// Hook para obtener todas las sedes de una empresa específica
export const useCompanyLocations = (companyId: number) => {
  return useQuery({
    queryKey: ['locations', 'company', companyId],
    queryFn: async (): Promise<Location[]> => {
      console.log(`🔄 [useCompanyLocations] Fetching locations for company ${companyId}...`);
      const response = await apiRequest({ url: `/api/locations/company/${companyId}` });
      console.log(`✅ [useCompanyLocations] Locations for company ${companyId} fetched:`, response?.length || 0);
      return response || [];
    },
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000,
  });
};