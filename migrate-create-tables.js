import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function createCompaniesAndLocations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos');

    // 1. Crear tabla companies
    console.log('📋 Creando tabla companies...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla companies creada');

    // 2. Crear tabla locations
    console.log('📋 Creando tabla locations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(name, company_id)
      )
    `);
    console.log('✅ Tabla locations creada');

    // 3. Crear índices para optimizar rendimiento
    console.log('📋 Creando índices...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
      CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
      CREATE INDEX IF NOT EXISTS idx_locations_company_id ON locations(company_id);
      CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);
    `);
    console.log('✅ Índices creados');

    // 4. Agregar nuevas columnas a users (si no existen)
    console.log('📋 Agregando columnas company_id y location_id a users...');
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id),
        ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id)
      `);
      console.log('✅ Columnas agregadas a users');
    } catch (error) {
      console.log('❌ Error agregando columnas a users:', error.message);
    }

    // 5. Agregar nuevas columnas a printers (si no existen)
    console.log('📋 Agregando columnas company_id y location_id a printers...');
    try {
      await client.query(`
        ALTER TABLE printers 
        ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id),
        ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id)
      `);
      console.log('✅ Columnas agregadas a printers');
    } catch (error) {
      console.log('❌ Error agregando columnas a printers:', error.message);
    }

    // 6. Insertar empresas por defecto (las mismas que estaban en localStorage)
    console.log('📋 Insertando empresas por defecto...');

    // Empresa 1: Sede Principal
    const empresa1Result = await client.query(`
      INSERT INTO companies (name) 
      VALUES ('Sede Principal') 
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const empresa1Id = empresa1Result.rows[0].id;
    console.log(`✅ Empresa "Sede Principal" creada/actualizada con ID: ${empresa1Id}`);

    // Empresa 2: Sucursal Norte
    const empresa2Result = await client.query(`
      INSERT INTO companies (name) 
      VALUES ('Sucursal Norte') 
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const empresa2Id = empresa2Result.rows[0].id;
    console.log(`✅ Empresa "Sucursal Norte" creada/actualizada con ID: ${empresa2Id}`);

    // 7. Insertar sedes por defecto para Sede Principal
    console.log('📍 Insertando sedes para "Sede Principal"...');
    await client.query(`
      INSERT INTO locations (name, company_id) 
      VALUES 
        ('Piso 1 - Administración', $1),
        ('Piso 2 - Contabilidad', $1),
        ('Piso 3 - Gerencia', $1)
      ON CONFLICT (name, company_id) DO NOTHING
    `, [empresa1Id]);
    console.log('✅ Sedes de "Sede Principal" creadas');

    // 8. Insertar sedes por defecto para Sucursal Norte
    console.log('📍 Insertando sedes para "Sucursal Norte"...');
    await client.query(`
      INSERT INTO locations (name, company_id) 
      VALUES 
        ('Área Comercial', $1),
        ('Área Técnica', $1)
      ON CONFLICT (name, company_id) DO NOTHING
    `, [empresa2Id]);
    console.log('✅ Sedes de "Sucursal Norte" creadas');

    // 9. Mostrar estadísticas finales
    console.log('\n📊 === ESTADÍSTICAS FINALES ===');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM companies WHERE is_active = true) as total_companies,
        (SELECT COUNT(*) FROM locations WHERE is_active = true) as total_locations
    `);

    const result = stats.rows[0];
    console.log(`Total empresas activas: ${result.total_companies}`);
    console.log(`Total sedes activas: ${result.total_locations}`);

    // 10. Mostrar estructura creada
    console.log('\n🏢 === EMPRESAS Y SEDES CREADAS ===');
    const companiesWithLocations = await client.query(`
      SELECT 
        c.id as company_id,
        c.name as company_name,
        l.id as location_id,
        l.name as location_name
      FROM companies c
      LEFT JOIN locations l ON l.company_id = c.id
      WHERE c.is_active = true
      ORDER BY c.name, l.name
    `);

    let currentCompany = null;
    for (const row of companiesWithLocations.rows) {
      if (currentCompany !== row.company_name) {
        console.log(`\n🏢 ${row.company_name} (ID: ${row.company_id})`);
        currentCompany = row.company_name;
      }
      if (row.location_name) {
        console.log(`   📍 ${row.location_name} (ID: ${row.location_id})`);
      }
    }

    console.log('\n✅ ¡Migración completada exitosamente!');

    console.log('\n📝 === PRÓXIMOS PASOS ===');
    console.log('1. Ejecutar: npm run db:generate (para actualizar el esquema Drizzle)');
    console.log('2. Ejecutar: npm run db:push (para aplicar el esquema)');
    console.log('3. Probar endpoints: curl http://localhost:5000/api/companies');
    console.log('4. Actualizar el frontend para usar la nueva API');
    console.log('5. Verificar funcionamiento completo en la aplicación web');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);

    if (error.message.includes('already exists')) {
      console.log('💡 Las tablas ya existen, eso es normal');
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('💡 Parece que faltan las tablas base. Ejecuta primero: npm run db:push');
    } else {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Función para eliminar todo (rollback completo)
async function dropEverything() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔌 Conectado para rollback...');

    console.log('⚠️  ¿Estás seguro? Esta operación eliminará TODAS las tablas companies/locations');
    console.log('⚠️  Ejecuta: node migrate-create-tables.js drop-confirm para confirmar');

    if (process.argv[2] === 'drop-confirm') {
      console.log('🗑️  Eliminando columnas de referencia...');
      await client.query('ALTER TABLE users DROP COLUMN IF EXISTS company_id');
      await client.query('ALTER TABLE users DROP COLUMN IF EXISTS location_id');
      await client.query('ALTER TABLE printers DROP COLUMN IF EXISTS company_id');
      await client.query('ALTER TABLE printers DROP COLUMN IF EXISTS location_id');

      console.log('🗑️  Eliminando tablas...');
      await client.query('DROP TABLE IF EXISTS locations');
      await client.query('DROP TABLE IF EXISTS companies');

      console.log('✅ Rollback completado - tablas y columnas eliminadas');
    }

  } catch (error) {
    console.error('❌ Error durante el rollback:', error);
  } finally {
    await client.end();
  }
}

// Función para verificar estado actual
async function checkStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔌 Conectado para verificación...');

    // Verificar si las tablas existen
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('companies', 'locations', 'users', 'printers')
      ORDER BY table_name
    `);

    console.log('\n📋 === ESTADO DE TABLAS ===');
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    console.log('Tablas existentes:', existingTables);

    if (existingTables.includes('companies')) {
      const companiesCount = await client.query('SELECT COUNT(*) FROM companies');
      console.log(`Empresas en BD: ${companiesCount.rows[0].count}`);
    }

    if (existingTables.includes('locations')) {
      const locationsCount = await client.query('SELECT COUNT(*) FROM locations');
      console.log(`Sedes en BD: ${locationsCount.rows[0].count}`);
    }

    // Verificar columnas agregadas
    if (existingTables.includes('users')) {
      const userColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('company_id', 'location_id')
      `);
      console.log('Columnas nuevas en users:', userColumns.rows.map(r => r.column_name));
    }

    if (existingTables.includes('printers')) {
      const printerColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'printers' 
        AND column_name IN ('company_id', 'location_id')
      `);
      console.log('Columnas nuevas en printers:', printerColumns.rows.map(r => r.column_name));
    }

  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  } finally {
    await client.end();
  }
}

// Ejecutar según argumento
const command = process.argv[2];

if (command === 'drop' || command === 'drop-confirm') {
  console.log('🗑️  Ejecutando rollback...');
  dropEverything();
} else if (command === 'status') {
  console.log('🔍 Verificando estado...');
  checkStatus();
} else {
  console.log('🚀 Creando tablas de empresas y sedes...');
  createCompaniesAndLocations();
}