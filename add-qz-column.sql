
-- Agregar la columna qz_tray_data a la tabla print_jobs
ALTER TABLE print_jobs ADD COLUMN qz_tray_data TEXT;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'print_jobs' AND column_name = 'qz_tray_data';
