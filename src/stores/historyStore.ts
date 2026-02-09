import { create } from "zustand";

// Types for annotations
export interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  pageNumber: number;
  fontSize: number;
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface ImageAnnotation {
  id: string;
  imageData: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface EditorState {
  textAnnotations: TextAnnotation[];
  imageAnnotations: ImageAnnotation[];
  fieldValues: Record<string, string>;
}

interface HistoryEntry {
  state: EditorState;
  timestamp: number;
  action: string;
}

interface HistoryStore {
  // State
  past: HistoryEntry[];
  present: EditorState;
  future: HistoryEntry[];
  
  // Actions
  pushState: (state: EditorState, action: string) => void;
  undo: () => EditorState | null;
  redo: () => EditorState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
  getUndoAction: () => string | null;
  getRedoAction: () => string | null;
}

const MAX_HISTORY = 50;

const initialState: EditorState = {
  textAnnotations: [],
  imageAnnotations: [],
  fieldValues: {},
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  present: initialState,
  future: [],

  pushState: (state: EditorState, action: string) => {
    set((store) => {
      const newPast = [
        ...store.past,
        { state: store.present, timestamp: Date.now(), action },
      ];
      
      // Limit history size
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      
      return {
        past: newPast,
        present: state,
        future: [], // Clear future on new action
      };
    });
  },

  undo: () => {
    const { past, present, future } = get();
    
    if (past.length === 0) return null;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    
    set({
      past: newPast,
      present: previous.state,
      future: [{ state: present, timestamp: Date.now(), action: "undo" }, ...future],
    });
    
    return previous.state;
  },

  redo: () => {
    const { past, present, future } = get();
    
    if (future.length === 0) return null;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    set({
      past: [...past, { state: present, timestamp: Date.now(), action: "redo" }],
      present: next.state,
      future: newFuture,
    });
    
    return next.state;
  },

  canUndo: () => get().past.length > 0,
  
  canRedo: () => get().future.length > 0,

  getUndoAction: () => {
    const { past } = get();
    if (past.length === 0) return null;
    return past[past.length - 1].action;
  },

  getRedoAction: () => {
    const { future } = get();
    if (future.length === 0) return null;
    return future[0].action;
  },

  reset: () => {
    set({
      past: [],
      present: initialState,
      future: [],
    });
  },
}));
