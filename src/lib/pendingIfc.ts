const DB_NAME = "ifc2go-handoff";
const STORE = "files";
const KEY = "pending";
const MAX_AGE_MS = 2 * 60 * 1000;

type PendingRecord = {
  name: string;
  buffer: ArrayBuffer;
  savedAt: number;
};

let memory: { file: File; savedAt: number } | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Keep a dropped IFC in memory and IndexedDB so the next tool page can open it. */
export async function stashPendingIfc(file: File): Promise<void> {
  const savedAt = Date.now();
  memory = { file, savedAt };

  try {
    const buffer = await file.arrayBuffer();
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ name: file.name, buffer, savedAt } satisfies PendingRecord, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // In-memory handoff still works for client-side navigations.
  }
}

/** Read and clear a recent handoff. Returns null when nothing is waiting. */
export async function takePendingIfc(): Promise<File | null> {
  const now = Date.now();

  if (memory && now - memory.savedAt < MAX_AGE_MS) {
    const file = memory.file;
    memory = null;
    void clearStored();
    return file;
  }

  memory = null;

  try {
    const db = await openDb();
    const record = await new Promise<PendingRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const request = store.get(KEY);
      request.onsuccess = () => {
        store.delete(KEY);
        resolve(request.result as PendingRecord | undefined);
      };
      request.onerror = () => reject(request.error);
    });
    db.close();

    if (!record || now - record.savedAt > MAX_AGE_MS) return null;
    return new File([record.buffer], record.name, { type: "application/octet-stream" });
  } catch {
    return null;
  }
}

async function clearStored(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}
