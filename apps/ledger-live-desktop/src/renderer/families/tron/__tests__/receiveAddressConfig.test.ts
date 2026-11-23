import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { receiveAddressConfig } from "../receiveAddressConfig";

const tronInput = (used: boolean | undefined, assetId = "tron") =>
  mockReceiveFamilyConfigInput({
    account: { network: "tron", path: "m/44h/195h/0h/0/0" },
    asset: { id: assetId, type: assetId === "tron" ? "CryptoCurrency" : "TokenCurrency" },
    accountStatus: used === undefined ? undefined : mockAccountStatus({ used }),
  });

describe("tron receiveAddressConfig", () => {
  it("should show the inactive account notice when the account was never used", () => {
    expect(receiveAddressConfig(tronInput(false))).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("should show the inactive account notice when receiving a token on an account never used", () => {
    expect(
      receiveAddressConfig(tronInput(false, "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t")),
    ).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("should not show a notice when the account was used", () => {
    expect(receiveAddressConfig(tronInput(true))).toEqual({});
  });

  it("should not show a notice before the account status is read", () => {
    expect(receiveAddressConfig(tronInput(undefined))).toEqual({});
  });
});
