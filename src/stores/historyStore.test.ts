/**
 * Tests for the History (undo/redo) Zustand store.
 *
 * The history store implements the Command Pattern — every state change is
 * recorded so the user can undo/redo edits. This is critical for a PDF editor
 * because users make many sequential edits and need to go back.
 *
 * Architecture:
 * - `past[]` — stack of previous states
 * - `present` — the current state
 * - `future[]` — stack of undone states (for redo)
 *
 * When the user makes a new edit: current `present` moves to `past`, new state
 * becomes `present`, and `future` is cleared (you can't redo after a new action).
 *
 * Why test a store directly?
 * Stores contain pure business logic with no UI. Testing them directly is fast,
 * deterministic, and gives you confidence the undo/redo logic is correct.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore, type EditorState } from "@/stores/historyStore";

/** Helper to create a unique editor state for testing. */
function createState(overrides: Partial<EditorState> = {}): EditorState {
  return {
    textAnnotations: [],
    imageAnnotations: [],
    fieldValues: {},
    ...overrides,
  };
}

describe("historyStore", () => {
  beforeEach(() => {
    // Reset the store to initial state before each test.
    // Zustand stores are singletons, so we need to clean up between tests.
    useHistoryStore.getState().reset();
  });

  describe("initial state", () => {
    it("should start with empty history stacks", () => {
      const state = useHistoryStore.getState();

      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.present).toEqual({
        textAnnotations: [],
        imageAnnotations: [],
        fieldValues: {},
      });
    });

    it("should report canUndo and canRedo as false", () => {
      const { canUndo, canRedo } = useHistoryStore.getState();

      expect(canUndo()).toBe(false);
      expect(canRedo()).toBe(false);
    });
  });

  describe("pushState", () => {
    it("should add the current state to past and set new present", () => {
      const newState = createState({
        textAnnotations: [
          { id: "1", text: "Hello", x: 10, y: 20, pageNumber: 1, fontSize: 12, color: "#000" },
        ],
      });

      useHistoryStore.getState().pushState(newState, "add text");

      const store = useHistoryStore.getState();
      expect(store.past).toHaveLength(1);
      expect(store.present).toEqual(newState);
      expect(store.canUndo()).toBe(true);
    });

    it("should clear the future stack (no redo after new action)", () => {
      const state1 = createState({ fieldValues: { name: "A" } });
      const state2 = createState({ fieldValues: { name: "B" } });

      // Push two states then undo, creating a "future"
      useHistoryStore.getState().pushState(state1, "action1");
      useHistoryStore.getState().pushState(state2, "action2");
      useHistoryStore.getState().undo();

      expect(useHistoryStore.getState().canRedo()).toBe(true);

      // Now push a new state — future should be cleared
      const state3 = createState({ fieldValues: { name: "C" } });
      useHistoryStore.getState().pushState(state3, "action3");

      expect(useHistoryStore.getState().canRedo()).toBe(false);
      expect(useHistoryStore.getState().future).toEqual([]);
    });

    it("should limit history to MAX_HISTORY (50) entries", () => {
      // Push 55 states — only the last 50 should survive in `past`
      for (let i = 0; i < 55; i++) {
        useHistoryStore
          .getState()
          .pushState(createState({ fieldValues: { count: String(i) } }), `action-${i}`);
      }

      expect(useHistoryStore.getState().past.length).toBeLessThanOrEqual(50);
    });
  });

  describe("undo", () => {
    it("should return null when there is nothing to undo", () => {
      const result = useHistoryStore.getState().undo();

      expect(result).toBeNull();
    });

    it("should restore the previous state and move current to future", () => {
      const initialPresent = useHistoryStore.getState().present;
      const state1 = createState({ fieldValues: { name: "Alice" } });

      useHistoryStore.getState().pushState(state1, "add name");

      const undoneState = useHistoryStore.getState().undo();

      expect(undoneState).toEqual(initialPresent);
      expect(useHistoryStore.getState().present).toEqual(initialPresent);
      expect(useHistoryStore.getState().future).toHaveLength(1);
    });

    it("should support multiple undos", () => {
      const state1 = createState({ fieldValues: { step: "1" } });
      const state2 = createState({ fieldValues: { step: "2" } });
      const state3 = createState({ fieldValues: { step: "3" } });

      useHistoryStore.getState().pushState(state1, "step1");
      useHistoryStore.getState().pushState(state2, "step2");
      useHistoryStore.getState().pushState(state3, "step3");

      useHistoryStore.getState().undo(); // back to state2
      useHistoryStore.getState().undo(); // back to state1
      useHistoryStore.getState().undo(); // back to initial

      expect(useHistoryStore.getState().present).toEqual(createState());
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().future).toHaveLength(3);
    });
  });

  describe("redo", () => {
    it("should return null when there is nothing to redo", () => {
      const result = useHistoryStore.getState().redo();

      expect(result).toBeNull();
    });

    it("should restore a previously undone state", () => {
      const state1 = createState({ fieldValues: { name: "Bob" } });

      useHistoryStore.getState().pushState(state1, "add name");
      useHistoryStore.getState().undo();

      expect(useHistoryStore.getState().present).toEqual(createState());

      const redoneState = useHistoryStore.getState().redo();

      expect(redoneState).toEqual(state1);
      expect(useHistoryStore.getState().present).toEqual(state1);
    });

    it("should support undo then redo multiple times", () => {
      const state1 = createState({ fieldValues: { step: "1" } });
      const state2 = createState({ fieldValues: { step: "2" } });

      useHistoryStore.getState().pushState(state1, "step1");
      useHistoryStore.getState().pushState(state2, "step2");

      // Undo twice
      useHistoryStore.getState().undo();
      useHistoryStore.getState().undo();

      // Redo twice
      useHistoryStore.getState().redo();
      useHistoryStore.getState().redo();

      expect(useHistoryStore.getState().present).toEqual(state2);
    });
  });

  describe("getUndoAction / getRedoAction", () => {
    it("should return null when history is empty", () => {
      expect(useHistoryStore.getState().getUndoAction()).toBeNull();
      expect(useHistoryStore.getState().getRedoAction()).toBeNull();
    });

    it("should return the action label of the last entry", () => {
      useHistoryStore
        .getState()
        .pushState(createState({ fieldValues: { a: "1" } }), "added field A");

      expect(useHistoryStore.getState().getUndoAction()).toBe("added field A");
    });

    it("should return the redo action after an undo", () => {
      useHistoryStore
        .getState()
        .pushState(createState({ fieldValues: { a: "1" } }), "added field A");

      useHistoryStore.getState().undo();

      expect(useHistoryStore.getState().getRedoAction()).toBe("undo");
    });
  });

  describe("reset", () => {
    it("should clear all history and restore initial state", () => {
      useHistoryStore
        .getState()
        .pushState(createState({ fieldValues: { x: "1" } }), "action");
      useHistoryStore
        .getState()
        .pushState(createState({ fieldValues: { x: "2" } }), "action2");

      useHistoryStore.getState().reset();

      const store = useHistoryStore.getState();
      expect(store.past).toEqual([]);
      expect(store.future).toEqual([]);
      expect(store.present).toEqual(createState());
    });
  });
});
