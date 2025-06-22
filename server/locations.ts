import { Router } from 'express';
import { db } from '../db';
import { companies, locations, users, printers } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// GET /api/locations - Listar todas las sedes (opcionalmente filtradas por empresa)
router.get('/', async (req, res) => {
  try {
    const { companyId } = req.query;

    let query = db
      .select({
        id: locations.id,
        name: locations.name,
        companyId: locations.companyId,
        isActive: locations.isActive,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
        companyName: companies.name
      })
      .from(locations)
      .leftJoin(companies, eq(locations.companyId, companies.id))
      .where(eq(locations.isActive, true));

    // Filtrar por empresa si se proporciona
    if (companyId) {
      const companyIdNum = parseInt(companyId as string);
      if (!isNaN(companyIdNum)) {
        query = query.where(and(
          eq(locations.isActive, true),
          eq(locations.companyId, companyIdNum)
        ));
      }
    }

    const locationsData = await query.orderBy(companies.name, locations.name);

    res.json(locationsData);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      error: 'Error al obtener sedes',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// GET /api/locations/:id - Obtener una sede específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const locationId = parseInt(id);

    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'ID de sede inválido' });
    }

    const [location] = await db
      .select({
        id: locations.id,
        name: locations.name,
        companyId: locations.companyId,
        isActive: locations.isActive,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
        companyName: companies.name
      })
      .from(locations)
      .leftJoin(companies, eq(locations.companyId, companies.id))
      .where(and(eq(locations.id, locationId), eq(locations.isActive, true)));

    if (!location) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      error: 'Error al obtener sede',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// POST /api/locations - Crear nueva sede
router.post('/', async (req, res) => {
  try {
    const { name, companyId } = req.body;

    // Validaciones
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la sede es requerido' });
    }

    if (!companyId || isNaN(parseInt(companyId))) {
      return res.status(400).json({ error: 'ID de empresa válido es requerido' });
    }

    const trimmedName = name.trim();
    const companyIdNum = parseInt(companyId);

    // Verificar que la empresa existe y está activa
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyIdNum), eq(companies.isActive, true)));

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada o inactiva' });
    }

    // Verificar que no existe una sede con el mismo nombre en esa empresa
    const existingLocation = await db
      .select()
      .from(locations)
      .where(and(
        eq(locations.name, trimmedName),
        eq(locations.companyId, companyIdNum),
        eq(locations.isActive, true)
      ))
      .limit(1);

    if (existingLocation.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe una sede con ese nombre en esta empresa' 
      });
    }

    // Crear nueva sede
    const [newLocation] = await db
      .insert(locations)
      .values({ 
        name: trimmedName,
        companyId: companyIdNum,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Retornar sede con información de la empresa
    const locationWithCompany = {
      ...newLocation,
      companyName: company.name
    };

    res.status(201).json(locationWithCompany);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ 
      error: 'Error al crear sede',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// PUT /api/locations/:id - Actualizar sede
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, companyId } = req.body;
    const locationId = parseInt(id);

    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'ID de sede inválido' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la sede es requerido' });
    }

    const trimmedName = name.trim();

    // Verificar que la sede existe
    const [existingLocation] = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, locationId), eq(locations.isActive, true)));

    if (!existingLocation) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    // Si se proporciona un nuevo companyId, validarlo
    let newCompanyId = existingLocation.companyId;
    if (companyId !== undefined) {
      if (isNaN(parseInt(companyId))) {
        return res.status(400).json({ error: 'ID de empresa inválido' });
      }

      newCompanyId = parseInt(companyId);

      // Verificar que la nueva empresa existe y está activa
      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, newCompanyId), eq(companies.isActive, true)));

      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada o inactiva' });
      }
    }

    // Verificar que no existe otra sede con el mismo nombre en la empresa
    const duplicateLocation = await db
      .select()
      .from(locations)
      .where(and(
        eq(locations.name, trimmedName),
        eq(locations.companyId, newCompanyId),
        eq(locations.isActive, true)
      ))
      .limit(1);

    if (duplicateLocation.length > 0 && duplicateLocation[0].id !== locationId) {
      return res.status(409).json({ 
        error: 'Ya existe otra sede con ese nombre en esta empresa' 
      });
    }

    // Actualizar sede
    const [updatedLocation] = await db
      .update(locations)
      .set({ 
        name: trimmedName,
        companyId: newCompanyId,
        updatedAt: new Date() 
      })
      .where(eq(locations.id, locationId))
      .returning();

    // Obtener información de la empresa
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, newCompanyId));

    const locationWithCompany = {
      ...updatedLocation,
      companyName: company?.name || ''
    };

    res.json(locationWithCompany);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      error: 'Error al actualizar sede',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// DELETE /api/locations/:id - Eliminar sede (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const locationId = parseInt(id);

    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'ID de sede inválido' });
    }

    // Verificar que la sede existe
    const [existingLocation] = await db
      .select({
        id: locations.id,
        name: locations.name,
        companyName: companies.name
      })
      .from(locations)
      .leftJoin(companies, eq(locations.companyId, companies.id))
      .where(and(eq(locations.id, locationId), eq(locations.isActive, true)));

    if (!existingLocation) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    // Verificar si hay usuarios o impresoras asignadas a esta sede
    const usersWithLocation = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.locationId, locationId))
      .limit(1);

    const printersWithLocation = await db
      .select({ count: printers.id })
      .from(printers)
      .where(and(eq(printers.locationId, locationId), eq(printers.isActive, true)))
      .limit(1);

    if (usersWithLocation.length > 0 || printersWithLocation.length > 0) {
      return res.status(409).json({ 
        error: 'No se puede eliminar la sede porque tiene usuarios o impresoras asignadas',
        details: 'Primero reasigne los usuarios e impresoras a otra sede'
      });
    }

    // Realizar soft delete
    await db
      .update(locations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(locations.id, locationId));

    res.json({ 
      message: 'Sede eliminada exitosamente',
      locationName: existingLocation.name,
      companyName: existingLocation.companyName
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ 
      error: 'Error al eliminar sede',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// GET /api/locations/:id/stats - Obtener estadísticas de una sede
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const locationId = parseInt(id);

    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'ID de sede inválido' });
    }

    // Verificar que la sede existe
    const [location] = await db
      .select({
        id: locations.id,
        name: locations.name,
        companyName: companies.name
      })
      .from(locations)
      .leftJoin(companies, eq(locations.companyId, companies.id))
      .where(and(eq(locations.id, locationId), eq(locations.isActive, true)));

    if (!location) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }

    // Obtener estadísticas
    const usersCount = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.locationId, locationId));

    const printersCount = await db
      .select({ count: printers.id })
      .from(printers)
      .where(and(eq(printers.locationId, locationId), eq(printers.isActive, true)));

    const stats = {
      location: location.name,
      company: location.companyName,
      totalUsers: usersCount.length,
      totalPrinters: printersCount.length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de sede',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// GET /api/locations/company/:companyId - Obtener todas las sedes de una empresa específica
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const companyIdNum = parseInt(companyId);

    if (isNaN(companyIdNum)) {
      return res.status(400).json({ error: 'ID de empresa inválido' });
    }

    // Verificar que la empresa existe
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyIdNum), eq(companies.isActive, true)));

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Obtener sedes de la empresa
    const companyLocations = await db
      .select()
      .from(locations)
      .where(and(eq(locations.companyId, companyIdNum), eq(locations.isActive, true)))
      .orderBy(locations.name);

    res.json(companyLocations);
  } catch (error) {
    console.error('Error fetching company locations:', error);
    res.status(500).json({ 
      error: 'Error al obtener sedes de la empresa',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;