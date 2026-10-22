import { setActionMenuDialog } from "~/renderer/reducers/actionMenuDialog";
import {
  createOpenActionMenuDialogHandler,
  resolveActionMenuDialog,
} from "../actionMenuDialogStore";

const PARAMS = {
  options: [{ id: "withdraw_all", label: "Withdraw all", icon: "withdraw" as const }],
};

describe("actionMenuDialogStore", () => {
  it("opens the dialog and resolves with the selected option", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionMenuDialogHandler(dispatch);

    const pending = handler({ params: PARAMS });
    expect(dispatch).toHaveBeenCalledWith(setActionMenuDialog(PARAMS));

    resolveActionMenuDialog("withdraw_all");

    await expect(pending).resolves.toEqual({ selectedOptionId: "withdraw_all" });
    expect(dispatch).toHaveBeenLastCalledWith(setActionMenuDialog(null));
  });

  it("resolves a still-pending menu as dismissed when a new one opens", async () => {
    const handler = createOpenActionMenuDialogHandler(jest.fn());

    const first = handler({ params: PARAMS });
    const second = handler({ params: PARAMS });

    await expect(first).resolves.toEqual({ selectedOptionId: null });

    resolveActionMenuDialog(null);
    await expect(second).resolves.toEqual({ selectedOptionId: null });
  });

  it("rejects invalid params", async () => {
    const handler = createOpenActionMenuDialogHandler(jest.fn());

    await expect(handler({ params: undefined })).rejects.toThrow(
      "Invalid params for custom.dialog.menu",
    );
  });
});
