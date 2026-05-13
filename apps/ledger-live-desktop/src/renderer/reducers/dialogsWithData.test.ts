import reducer, {
  closeDialogWithData,
  openDialogWithData,
  selectDialogWithDataParams,
  selectIsDialogWithDataOpen,
  type DialogsWithDataState,
} from "./dialogsWithData";

const initialState: DialogsWithDataState = {
  SWAP_TRANSACTION_STATUS: {
    isOpen: false,
    data: null,
  },
};

describe("dialogsWithData reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should open a dialog with typed data", () => {
    const data = { swapId: "swap-1", provider: "lifi" };

    const state = reducer(
      initialState,
      openDialogWithData({ id: "SWAP_TRANSACTION_STATUS", data }),
    );

    expect(state.SWAP_TRANSACTION_STATUS).toEqual({
      isOpen: true,
      data,
    });
  });

  it("should close a dialog and clear its data", () => {
    const state = reducer(
      {
        SWAP_TRANSACTION_STATUS: {
          isOpen: true,
          data: { swapId: "swap-1", provider: "lifi" },
        },
      },
      closeDialogWithData("SWAP_TRANSACTION_STATUS"),
    );

    expect(state.SWAP_TRANSACTION_STATUS).toEqual({
      isOpen: false,
      data: null,
    });
  });
});

describe("dialogsWithData selectors", () => {
  it("should select whether a data dialog is open", () => {
    expect(
      selectIsDialogWithDataOpen({ dialogsWithData: initialState }, "SWAP_TRANSACTION_STATUS"),
    ).toBe(false);
  });

  it("should select data dialog params", () => {
    const data = { swapId: "swap-1", provider: "lifi" };

    expect(
      selectDialogWithDataParams(
        {
          dialogsWithData: {
            SWAP_TRANSACTION_STATUS: {
              isOpen: true,
              data,
            },
          },
        },
        "SWAP_TRANSACTION_STATUS",
      ),
    ).toEqual(data);
  });
});
