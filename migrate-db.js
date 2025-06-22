
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

async function addQzTrayDataColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a la base de datos');

    // Verificar si la columna ya existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'print_jobs' AND column_name = 'qz_tray_data'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ La columna qz_tray_data ya existe');
      return;
    }

    // Agregar la columna
    console.log('➕ Agregando columna qz_tray_data...');
    await client.query('ALTER TABLE print_jobs ADD COLUMN qz_tray_data TEXT');
    
    console.log('✅ Columna qz_tray_data agregada exitosamente');

    // Verificar que se agregó correctamente
    const verify = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'print_jobs' AND column_name = 'qz_tray_data'
    `);

    if (verify.rows.length > 0) {
      console.log('🎉 Migración completada exitosamente');
      console.log('Detalles de la columna:', verify.rows[0]);
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

addQzTrayDataColumn();
