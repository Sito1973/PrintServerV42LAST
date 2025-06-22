import { Router } from 'express';
import { db } from '../db';
import { companies, locations, users, printers } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { CompanyWithLocations } from '@shared/schema';

const router = Router();

// GET /api/companies - Listar todas las empresas con sus sedes
router.get('/', async (req, res) => {
  try {
    // Obtener todas las empresas activas
    const companiesData = await db
      .select()
      .from(companies)
      .where(eq(companies.isActive, true))
      .orderBy(companies.name);

    // Obtener todas las sedes activas
    const locationsData = await db
      .select()
      .from(locations)
      .where(eq(locations.isActive, true))
      .orderBy(locations.name);

    // Combinar empresas con sus sedes
    const companiesWithLocations: CompanyWithLocations[] = companiesData.map(company => ({
      ...company,
      locations: locationsData.filter(location => location.companyId === company.id)
    }));

    res.json(companiesWithLocations);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      error: 'Error al obtener empresas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// GET /api/companies/:id - Obtener una empresa específica con sus sedes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'ID de empresa inválido' });
    }

    // Obtener empresa
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.isActive, true)));

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Obtener sedes de la empresa
    const companyLocations = await db
      .select()
      .from(locations)
      .where(and(eq(locations.companyId, companyId), eq(locations.isActive, true)))
      .orderBy(locations.name);

    const companyWithLocations: CompanyWithLocations = {
      ...company,
      locations: companyLocations
    };

    res.json(companyWithLocations);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ 
      error: 'Error al obtener empresa',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// POST /api/companies - Crear nueva empresa
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la empresa es requerido' });
    }

    const trimmedName = name.trim();

    // Verificar si ya existe una empresa con ese nombre
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.name, trimmedName))
      .limit(1);

    if (existingCompany.length > 0) {
      return res.status(409).json({ error: 'Ya existe una empresa con ese nombre' });
    }

    // Crear nueva empresa
    const [newCompany] = await db
      .insert(companies)
      .values({ 
        name: trimmedName,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Retornar empresa con array de sedes vacío
    const companyWithLocations: CompanyWithLocations = {
      ...newCompany,
      locations: []
    };

    res.status(201).json(companyWithLocations);
  } catch (error) {
    console.error('Error creating company:', error);
    if (error instanceof Error && error.message.includes('unique constraint')) {
      res.status(409).json({ error: 'Ya existe una empresa con ese nombre' });
    } else {
      res.status(500).json({ 
        error: 'Error al crear empresa',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
});

// PUT /api/companies/:id - Actualizar empresa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'ID de empresa inválido' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la empresa es requerido' });
    }

    const trimmedName = name.trim();

    // Verificar que la empresa existe
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.isActive, true)));

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Verificar si el nuevo nombre ya existe en otra empresa
    const duplicateCompany = await db
      .select()
      .from(companies)
      .where(and(
        eq(companies.name, trimmedName),
        eq(companies.isActive, true)
      ))
      .limit(1);

    if (duplicateCompany.length > 0 && duplicateCompany[0].id !== companyId) {
      return res.status(409).json({ error: 'Ya existe otra empresa con ese nombre' });
    }

    // Actualizar empresa
    const [updatedCompany] = await db
      .update(companies)
      .set({ 
        name: trimmedName, 
        updatedAt: new Date() 
      })
      .where(eq(companies.id, companyId))
      .returning();

    // Obtener sedes actualizadas
    const companyLocations = await db
      .select()
      .from(locations)
      .where(and(eq(locations.companyId, companyId), eq(locations.isActive, true)))
      .orderBy(locations.name);

    const companyWithLocations: CompanyWithLocations = {
      ...updatedCompany,
      locations: companyLocations
    };

    res.json(companyWithLocations);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ 
      error: 'Error al actualizar empresa',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// DELETE /api/companies/:id - Eliminar empresa (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'ID de empresa inválido' });
    }

    // Verificar que la empresa existe
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.isActive, true)));

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Verificar si hay usuarios o impresoras asignadas a esta empresa
    const [usersCount] = await db
      .select({ count: companies.id })
      .from(users)
      .where(eq(users.companyId, companyId))
      .limit(1);

    const [printersCount] = await db
      .select({ count: companies.id })
      .from(printers)
      .where(eq(printers.companyId, companyId))
      .limit(1);

    if (usersCount || printersCount) {
      return res.status(409).json({ 
        error: 'No se puede eliminar la empresa porque tiene usuarios o impresoras asignadas',
        details: 'Primero reasigne los usuarios e impresoras a otra empresa'
      });
    }

    // Realizar soft delete de la empresa y sus sedes
    await db.transaction(async (tx) => {
      // Desactivar todas las sedes de la empresa
      await tx
        .update(locations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(locations.companyId, companyId));

      // Desactivar la empresa
      await tx
        .update(companies)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(companies.id, companyId));
    });

    res.json({ 
      message: 'Empresa eliminada exitosamente',
      companyName: existingCompany.name
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ 
      error: 'Error al eliminar empresa',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// GET /api/companies/:id/stats - Obtener estadísticas de una empresa
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'ID de empresa inválido' });
    }

    // Verificar que la empresa existe
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.isActive, true)));

    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Obtener estadísticas
    const locationsCount = await db
      .select({ count: locations.id })
      .from(locations)
      .where(and(eq(locations.companyId, companyId), eq(locations.isActive, true)));

    const usersCount = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.companyId, companyId));

    const printersCount = await db
      .select({ count: printers.id })
      .from(printers)
      .where(and(eq(printers.companyId, companyId), eq(printers.isActive, true)));

    const stats = {
      company: company.name,
      totalLocations: locationsCount.length,
      totalUsers: usersCount.length,
      totalPrinters: printersCount.length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de empresa',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;