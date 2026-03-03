import reducer, {
  DIALOG_IDS,
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogsState,
} from "./dialogs";

describe("dialogs reducer", () => {
  const initialState: DialogsState = {};

  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual({});
  });

  it.each(DIALOG_IDS)("should open %s", id => {
    const state = reducer(initialState, openDialog(id));

    expect(state[id]).toBe(true);
  });

  it.each(DIALOG_IDS)("should close %s", id => {
    const state = reducer({ [id]: true }, closeDialog(id));

    expect(state[id]).toBe(false);
  });

  it.each(DIALOG_IDS)("should handle closing %s when already closed", id => {
    const state = reducer(initialState, closeDialog(id));

    expect(state[id]).toBe(false);
  });

  it.each(DIALOG_IDS)("should handle opening %s when already open", id => {
    const state = reducer({ [id]: true }, openDialog(id));

    expect(state[id]).toBe(true);
  });
});

describe("selectIsDialogOpen", () => {
  const buildState = (dialogs: DialogsState) => ({ dialogs });

  it.each(DIALOG_IDS)("should return false when %s is not in state", id => {
    expect(selectIsDialogOpen(buildState({}), id)).toBe(false);
  });

  it.each(DIALOG_IDS)("should return true when %s is open", id => {
    expect(selectIsDialogOpen(buildState({ [id]: true }), id)).toBe(true);
  });

  it.each(DIALOG_IDS)("should return false when %s is closed", id => {
    expect(selectIsDialogOpen(buildState({ [id]: false }), id)).toBe(false);
  });
});
