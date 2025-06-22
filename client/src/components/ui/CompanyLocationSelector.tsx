// client/src/components/ui/CompanyLocationSelector.tsx

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";

interface CompanyLocationSelectorProps {
  selectedEmpresa?: string | number;
  selectedSede?: string | number;
  onEmpresaChange: (empresaId: string, empresaName: string) => void;
  onSedeChange: (sedeId: string, sedeName: string) => void;
  disabled?: boolean;
  required?: boolean;
  showLabels?: boolean;
}

const CompanyLocationSelector: React.FC<CompanyLocationSelectorProps> = ({
  selectedEmpresa = '',
  selectedSede = '',
  onEmpresaChange,
  onSedeChange,
  disabled = false,
  required = false,
  showLabels = true
}) => {
  // Usar hook de API en lugar de AppContext
  const { data: companies = [], isLoading, error } = useCompanies();

  // Convertir a string para consistencia
  const [currentEmpresa, setCurrentEmpresa] = useState(String(selectedEmpresa));
  const [currentSede, setCurrentSede] = useState(String(selectedSede));

  // Obtener sedes disponibles para la empresa seleccionada
  const sedesDisponibles = currentEmpresa 
    ? companies.find(c => String(c.id) === currentEmpresa)?.locations || []
    : [];

  // Efectos para sincronizar con props
  useEffect(() => {
    setCurrentEmpresa(String(selectedEmpresa));
  }, [selectedEmpresa]);

  useEffect(() => {
    setCurrentSede(String(selectedSede));
  }, [selectedSede]);

  // Limpiar sede si no está disponible en la nueva empresa
  useEffect(() => {
    if (currentEmpresa && currentSede) {
      const sedeExists = sedesDisponibles.some(s => String(s.id) === currentSede);
      if (!sedeExists && currentSede !== '') {
        setCurrentSede('');
        onSedeChange('', '');
      }
    }
  }, [currentEmpresa, sedesDisponibles, currentSede, onSedeChange]);

  // Manejar cambio de empresa
  const handleEmpresaChange = (empresaId: string) => {
    const empresa = companies.find(e => String(e.id) === empresaId);
    if (empresa) {
      setCurrentEmpresa(empresaId);
      setCurrentSede(''); // Limpiar sede cuando cambia empresa
      onEmpresaChange(empresaId, empresa.name);
      onSedeChange('', ''); // Notificar que sede se limpió
    }
  };

  // Manejar cambio de sede
  const handleSedeChange = (sedeId: string) => {
    const sede = sedesDisponibles.find(s => String(s.id) === sedeId);
    if (sede) {
      setCurrentSede(sedeId);
      onSedeChange(sedeId, sede.name);
    }
  };

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando empresas y sedes...
        </div>
      </div>
    );
  }

  // Mostrar error si hay problema con la API
  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded border">
          <strong>Error:</strong> No se pudieron cargar las empresas y sedes.
          <br />
          <span className="text-xs">Verifica que el servidor esté funcionando.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de Empresa */}
      <div className="space-y-2">
        {showLabels && (
          <Label htmlFor="empresa-selector" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select
          value={currentEmpresa}
          onValueChange={handleEmpresaChange}
          disabled={disabled}
          required={required}
        >
          <SelectTrigger id="empresa-selector">
            <SelectValue placeholder="Selecciona una empresa" />
          </SelectTrigger>
          <SelectContent>
            {companies.length === 0 ? (
              <SelectItem value="no-companies" disabled>
                No hay empresas disponibles
              </SelectItem>
            ) : (
              companies.map((empresa) => (
                <SelectItem key={empresa.id} value={String(empresa.id)}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {empresa.name}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Selector de Sede */}
      <div className="space-y-2">
        {showLabels && (
          <Label htmlFor="sede-selector" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Sede {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select
          value={currentSede}
          onValueChange={handleSedeChange}
          disabled={disabled || !currentEmpresa}
          required={required}
        >
          <SelectTrigger id="sede-selector">
            <SelectValue 
              placeholder={
                !currentEmpresa 
                  ? "Primero selecciona una empresa"
                  : "Selecciona una sede"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {!currentEmpresa ? (
              <SelectItem value="no-empresa" disabled>
                Selecciona una empresa primero
              </SelectItem>
            ) : sedesDisponibles.length === 0 ? (
              <SelectItem value="no-sedes" disabled>
                No hay sedes disponibles para esta empresa
              </SelectItem>
            ) : (
              sedesDisponibles.map((sede) => (
                <SelectItem key={sede.id} value={String(sede.id)}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {sede.name}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Información adicional */}
      {currentEmpresa && currentSede && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <strong>Empresa:</strong> {companies.find(c => String(c.id) === currentEmpresa)?.name}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            <strong>Sede:</strong> {sedesDisponibles.find(s => String(s.id) === currentSede)?.name}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyLocationSelector;