import { Workflow, Note } from '../types';

const DB_NAME = 'AIWorkflowVisualizerDB';
const DB_VERSION = 1;
const WORKFLOW_STORE_NAME = 'workflow';
const NOTES_STORE_NAME = 'notes';
const WORKFLOW_KEY = 'currentWorkflow';

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(WORKFLOW_STORE_NAME)) {
        dbInstance.createObjectStore(WORKFLOW_STORE_NAME);
      }
       if (!dbInstance.objectStoreNames.contains(NOTES_STORE_NAME)) {
        dbInstance.createObjectStore(NOTES_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// --- Workflow Functions ---

export async function saveWorkflow(workflow: Workflow): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(WORKFLOW_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(WORKFLOW_STORE_NAME);
    const request = store.put(workflow, WORKFLOW_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadWorkflow(): Promise<Workflow | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(WORKFLOW_STORE_NAME, 'readonly');
    const store = transaction.objectStore(WORKFLOW_STORE_NAME);
    const request = store.get(WORKFLOW_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// --- Notes Functions ---

export async function saveNote(note: Note): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(NOTES_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(NOTES_STORE_NAME);
      const request = store.put(note);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
}

export async function loadNotes(): Promise<Note[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(NOTES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by creation date, newest first
            const sortedNotes = request.result.sort((a, b) => b.createdAt - a.createdAt);
            resolve(sortedNotes);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function deleteNote(noteId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(NOTES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const request = store.delete(noteId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
