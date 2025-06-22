// client/src/hooks/useLocationNames.ts

import { useCompanies } from '@/hooks/useCompanies';

export const useLocationNames = () => {
  const { data: companies = [] } = useCompanies();

  const getLocationNames = (locationId: string | number, floorId: string | number) => {
    // Convertir a números para comparación
    const companyId = Number(locationId);
    const sedeId = Number(floorId);

    // Buscar empresa
    const empresa = companies.find(e => e.id === companyId);

    // Buscar sede dentro de la empresa
    const sede = empresa?.locations.find(s => s.id === sedeId);

    return {
      empresaName: empresa?.name || '',
      sedeName: sede?.name || '',
      empresa: empresa || null,
      sede: sede || null
    };
  };

  const getCompanyById = (companyId: string | number) => {
    const id = Number(companyId);
    return companies.find(c => c.id === id) || null;
  };

  const getLocationById = (locationId: string | number) => {
    const id = Number(locationId);
    for (const company of companies) {
      const location = company.locations.find(loc => loc.id === id);
      if (location) {
        return {
          ...location,
          companyName: company.name,
          company: company
        };
      }
    }
    return null;
  };

  const getAllCompanies = () => companies;

  const getLocationsByCompanyId = (companyId: string | number) => {
    const id = Number(companyId);
    const company = companies.find(c => c.id === id);
    return company?.locations || [];
  };

  return { 
    getLocationNames,
    getCompanyById,
    getLocationById,
    getAllCompanies,
    getLocationsByCompanyId,
    isLoading: companies.length === 0, // Simple check, ideally pass loading state
    companies
  };
};