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
export const DIALOG_IDS = ["RELEASE_NOTES"] as const;
export type DialogId = (typeof DIALOG_IDS)[number];

export type DialogsState = Partial<Record<DialogId, boolean>>;

const initialState: DialogsState = {};

const dialogsSlice = createSlice({
  name: "dialogs",
  initialState,
  reducers: {
    /** Open a dialog by its registered ID. */
    openDialog: (state, action: PayloadAction<DialogId>) => {
      state[action.payload] = true;
    },
    /** Close a dialog by its registered ID. */
    closeDialog: (state, action: PayloadAction<DialogId>) => {
      state[action.payload] = false;
    },
  },
});

export const { openDialog, closeDialog } = dialogsSlice.actions;

/** Select whether a specific dialog is currently open. */
export const selectIsDialogOpen = (state: Pick<State, "dialogs">, id: DialogId) =>
  !!state.dialogs[id];
export default dialogsSlice.reducer;
