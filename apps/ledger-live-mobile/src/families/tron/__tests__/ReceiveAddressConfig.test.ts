import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import receiveAddressConfig from "../ReceiveAddressConfig";

const USDT_TRC20 = "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t";

const tronInput = (used: boolean | undefined, asset = { id: "tron" }) =>
  mockReceiveFamilyConfigInput({
    asset,
    accountStatus: used === undefined ? undefined : mockAccountStatus({ used }),
  });

describe("tron ReceiveAddressConfig", () => {
  it("should show the inactive account notice when the account was never used", () => {
    expect(receiveAddressConfig(tronInput(false))).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("should not show a notice when the account was used", () => {
    expect(receiveAddressConfig(tronInput(true))).toEqual({});
  });

  it("should not show a notice before the account status is read", () => {
    expect(receiveAddressConfig(tronInput(undefined))).toEqual({});
  });

  it("should not show a notice when receiving a token", () => {
    const token = { id: USDT_TRC20, type: "TokenCurrency" } as const;

    expect(receiveAddressConfig(tronInput(false, token))).toEqual({});
  });
});
