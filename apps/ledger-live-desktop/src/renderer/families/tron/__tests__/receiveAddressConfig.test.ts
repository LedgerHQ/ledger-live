import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { receiveAddressConfig } from "../receiveAddressConfig";

const tronInput = (operationsCount: number, assetId = "tron") =>
  mockReceiveFamilyConfigInput<TronAccount>({
    descriptor: mockAddressAccountDescriptor({ network: "tron", path: "m/44h/195h/0h/0/0" }),
    asset: { id: assetId, type: assetId === "tron" ? "CryptoCurrency" : "TokenCurrency" },
    legacyAccount: { operationsCount } as TronAccount,
  });

describe("tron receiveAddressConfig", () => {
  it("should show the inactive account notice when the account has no operation", () => {
    expect(receiveAddressConfig(tronInput(0))).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("should show the inactive account notice when receiving a token on an account with no operation", () => {
    expect(
      receiveAddressConfig(tronInput(0, "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t")),
    ).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("should not show a notice when the account has operations", () => {
    expect(receiveAddressConfig(tronInput(3))).toEqual({});
  });
});
