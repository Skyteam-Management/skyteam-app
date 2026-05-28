import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const exportsDir = 'exports';
const folders = (await readdir(exportsDir))
  .filter(f => f.startsWith('firestore-'))
  .sort()
  .reverse();
if (!folders.length) {
  console.error(`No firestore-* export found inside ${exportsDir}/. Run npm run export first.`);
  process.exit(1);
}
const sourceDir = process.argv[2] ?? join(exportsDir, folders[0]);
console.log(`Importing from: ${sourceDir}\n`);

async function loadJson(name) {
  try {
    return JSON.parse(await readFile(join(sourceDir, `${name}.json`), 'utf8'));
  } catch {
    return [];
  }
}

const lideresRaw  = await loadJson('lideres');
const clientesRaw = await loadJson('clientes');

const lideres = lideresRaw.map(({ id, data }) => ({
  id,
  nombre:   data.nombre   ?? '',
  apellido: data.apellido ?? '',
}));

const liderIds = new Set(lideres.map(l => l.id));

const clientes = clientesRaw.map(({ id, data }) => {
  const lider = data.lider && liderIds.has(data.lider) ? data.lider : null;
  if (data.lider && !lider) {
    console.warn(`  orphan: cliente ${id} references missing lider ${data.lider} → set to NULL`);
  }
  return {
    id,
    nombre:       data.nombre   ?? '',
    telefono:     data.telefono ?? null,
    lider,
    paquete:      data.paquete  ?? null,
    fecha_inicio: data.fechaInicio ?? null,
  };
});

if (lideres.length) {
  const { error } = await supabase.from('lideres').upsert(lideres);
  if (error) { console.error('lideres upsert failed:', error); process.exit(1); }
  console.log(`  lideres:  ${lideres.length} upserted`);
}

if (clientes.length) {
  const { error } = await supabase.from('clientes').upsert(clientes);
  if (error) { console.error('clientes upsert failed:', error); process.exit(1); }
  console.log(`  clientes: ${clientes.length} upserted`);
}

console.log('\nDone.');
