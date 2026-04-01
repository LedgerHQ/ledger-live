import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/renderer/reducers";

/**
 * Registry of all **global** dialog IDs managed by this slice.
 *
 * Use this for dialogs that are mounted at the app root (e.g. `Default.tsx`) and need to be
 * triggered from distant parts of the component tree. For dialogs scoped to a single
 * component or screen, prefer a local `useState` instead.
 *
 * Add new entries here when creating a new global dialog.
 * Each dialog should have a corresponding `*Dialog.ts` file in its feature folder
 * that re-exports typed helpers (open, close, selector) bound to its ID.
 *
 * @example
 * // 1. Add the ID here
 * export const DIALOG_IDS = ["RELEASE_NOTES", "MY_NEW_DIALOG"] as const;
 *
 * // 2. Create `myFeature/myNewDialog.ts`
 * const DIALOG_ID: DialogId = "MY_NEW_DIALOG";
 * export const openMyNewDialog = () => openDialog(DIALOG_ID);
 * export const closeMyNewDialog = () => closeDialog(DIALOG_ID);
 * export const selectIsMyNewDialogOpen = (state: State) => selectIsDialogOpen(state, DIALOG_ID);
 */
export const DIALOG_IDS = ["RELEASE_NOTES", "BUY_DEVICE", "PERPS_SIGNING"] as const;
export type DialogId = (typeof DIALOG_IDS)[number];

/**
 * Each entry is either:
 * - `undefined` / `false` → dialog closed
 * - `true` → dialog open (no data)
 * - a truthy object → dialog open with associated data
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type DialogsState = Partial<Record<DialogId, boolean | unknown>>;

const initialState: DialogsState = {};

const dialogsSlice = createSlice({
  name: "dialogs",
  initialState,
  reducers: {
    /** Open a dialog by its registered ID, optionally attaching data. */
    openDialog: {
      reducer(state, action: PayloadAction<{ id: DialogId; data?: unknown }>) {
        state[action.payload.id] = action.payload.data ?? true;
      },
      prepare(id: DialogId, data?: unknown) {
        return { payload: { id, data } };
      },
    },
    /** Close a dialog by its registered ID (clears any associated data). */
    closeDialog: (state, action: PayloadAction<DialogId>) => {
      state[action.payload] = false;
    },
  },
});

export const { openDialog, closeDialog } = dialogsSlice.actions;

/** Select whether a specific dialog is currently open. */
export const selectIsDialogOpen = (state: Pick<State, "dialogs">, id: DialogId) =>
  !!state.dialogs[id];

/** Select the data payload attached when the dialog was opened, if any. */
export const selectDialogData = <T>(state: Pick<State, "dialogs">, id: DialogId): T | undefined => {
  const entry = state.dialogs[id];
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
  return entry != null && typeof entry === "object" ? (entry as T) : undefined;
};

export default dialogsSlice.reducer;
