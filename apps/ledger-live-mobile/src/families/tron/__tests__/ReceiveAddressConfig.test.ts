import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import type { Account } from "@ledgerhq/types-live";
import receiveAddressConfig from "../ReceiveAddressConfig";

const USDT_TRC20 = "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t";

const tronInput = (operationsCount: number, asset = { id: "tron" }) =>
  mockReceiveFamilyConfigInput<Account>({
    descriptor: mockAddressAccountDescriptor({ network: "tron", path: "m/44h/195h/0h/0/0" }),
    asset,
    legacyAccount: { operationsCount } as Account,
  });

describe("tron ReceiveAddressConfig", () => {
  it("should show the inactive account notice when the account has no operation", () => {
    expect(receiveAddressConfig(tronInput(0))).toEqual({ notices: ["tronInactiveAccount"] });
  });

  it("should not show a notice when the account has operations", () => {
    expect(receiveAddressConfig(tronInput(3))).toEqual({});
  });

  it("should not show a notice when receiving a token", () => {
    const token = { id: USDT_TRC20, type: "TokenCurrency" } as const;

    expect(receiveAddressConfig(tronInput(0, token))).toEqual({});
  });
});
