import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join('exports', `firestore-${stamp}`);
await mkdir(outDir, { recursive: true });

function normalize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof GeoPoint) return { lat: value.latitude, lng: value.longitude };
  if (value instanceof DocumentReference) return { _ref: value.path };
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalize(v);
    return out;
  }
  return value;
}

async function dumpDoc(docSnap) {
  const subColls = await docSnap.ref.listCollections();
  const subcollections = {};
  for (const sub of subColls) {
    subcollections[sub.id] = await dumpCollection(sub);
  }
  return {
    id: docSnap.id,
    data: normalize(docSnap.data()),
    ...(Object.keys(subcollections).length ? { subcollections } : {}),
  };
}

async function dumpCollection(collRef) {
  const snap = await collRef.get();
  const docs = [];
  for (const docSnap of snap.docs) {
    docs.push(await dumpDoc(docSnap));
  }
  return docs;
}

const rootCollections = await db.listCollections();
let total = 0;
for (const coll of rootCollections) {
  const docs = await dumpCollection(coll);
  await writeFile(join(outDir, `${coll.id}.json`), JSON.stringify(docs, null, 2), 'utf8');
  console.log(`  ${coll.id}: ${docs.length} docs`);
  total += docs.length;
}

console.log(`\nDone. ${total} root-level documents exported to ${outDir}/`);
