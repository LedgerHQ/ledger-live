import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  closeReceiveAddressDialog,
  openReceiveAddressDialog,
  receiveAddressDialogInitialState,
  receiveAddressDialogSlice,
  selectReceiveAddressDialogTarget,
} from "../receiveAddressDialogSlice";

const reducer = receiveAddressDialogSlice.reducer;
const target = {
  accountUUID: computeAccountUUID(mockAddressAccountDescriptor()),
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  source: "Account Page",
};

describe("receiveAddressDialog slice", () => {
  it("starts closed", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual(receiveAddressDialogInitialState);
  });

  it("opens on a target and closes", () => {
    const opened = reducer(undefined, openReceiveAddressDialog(target));
    expect(selectReceiveAddressDialogTarget({ receiveAddressDialog: opened })).toEqual(target);

    const closed = reducer(opened, closeReceiveAddressDialog());
    expect(selectReceiveAddressDialogTarget({ receiveAddressDialog: closed })).toBeNull();
  });
});
