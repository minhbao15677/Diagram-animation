import { create } from 'zustand';

export type WorkspaceFile = {
  name: string;
  handle: FileSystemFileHandle;
};

type WorkspaceState = {
  directoryHandle: FileSystemDirectoryHandle | null;
  files: WorkspaceFile[];
  currentFileName: string | null;

  openWorkspace: () => Promise<void>;
  closeWorkspace: () => void;
  refreshFiles: () => Promise<void>;
  openFile: (file: WorkspaceFile) => Promise<{ nodes: unknown[]; edges: unknown[] } | null>;
  saveFile: (name: string, nodes: unknown[], edges: unknown[]) => Promise<void>;
  createFile: (name: string) => Promise<WorkspaceFile | null>;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  directoryHandle: null,
  files: [],
  currentFileName: null,

  openWorkspace: async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      set({ directoryHandle: handle, files: [], currentFileName: null });
      await get().refreshFiles();
    } catch {
      // user cancelled
    }
  },

  closeWorkspace: () => {
    set({ directoryHandle: null, files: [], currentFileName: null });
  },

  refreshFiles: async () => {
    const { directoryHandle } = get();
    if (!directoryHandle) return;
    const files: WorkspaceFile[] = [];
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        files.push({ name, handle: handle as FileSystemFileHandle });
      }
    }
    files.sort((a, b) => a.name.localeCompare(b.name));
    set({ files });
  },

  openFile: async (file) => {
    try {
      const f = await file.handle.getFile();
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (parsed.nodes && parsed.edges) {
        set({ currentFileName: file.name });
        return { nodes: parsed.nodes, edges: parsed.edges };
      }
      return null;
    } catch {
      return null;
    }
  },

  saveFile: async (name, nodes, edges) => {
    const { directoryHandle } = get();
    if (!directoryHandle) return;
    try {
      const fileHandle = await directoryHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify({ version: 1, nodes, edges }, null, 2));
      await writable.close();
      await get().refreshFiles();
    } catch (e) {
      console.error('Save failed', e);
    }
  },

  createFile: async (name) => {
    const { directoryHandle } = get();
    if (!directoryHandle) return null;
    const fileName = name.endsWith('.json') ? name : `${name}.json`;
    try {
      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify({ version: 1, nodes: [], edges: [] }, null, 2));
      await writable.close();
      await get().refreshFiles();
      const newFile: WorkspaceFile = { name: fileName, handle: fileHandle };
      set({ currentFileName: fileName });
      return newFile;
    } catch (e) {
      console.error('Create failed', e);
      return null;
    }
  },
}));
