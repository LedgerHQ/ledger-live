import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Account } from "@ledgerhq/types-live";
import { getAccountSelfTransferTarget } from "../selfTransferTarget";

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { getBalanceTypeConfig: jest.fn() },
}));

const mockedGetBalanceTypeConfig = jest.mocked(sendFeatures.getBalanceTypeConfig);

const account = { type: "Account", currency: { id: "zcash" } } as unknown as Account;

beforeEach(() => jest.clearAllMocks());

describe("getAccountSelfTransferTarget", () => {
  it("returns the target from the currency's balanceType config", () => {
    const target = {
      address: "u1exportedshieldedaddress",
      translationKey: "recipient.selfTransfer.toPrivate",
      isDestinationPublic: false,
    };
    const getSelfTransferTarget = jest.fn(() => target);
    mockedGetBalanceTypeConfig.mockReturnValue({ getSelfTransferTarget } as never);

    const transaction = { sender: "public" };
    expect(getAccountSelfTransferTarget(account, transaction)).toBe(target);
    expect(getSelfTransferTarget).toHaveBeenCalledWith({ account, transaction });
  });

  it("returns null when the currency declares no balanceType config", () => {
    mockedGetBalanceTypeConfig.mockReturnValue(null);

    expect(getAccountSelfTransferTarget(account, {})).toBeNull();
  });

  it("returns null when the config has no self-transfer target for this account", () => {
    mockedGetBalanceTypeConfig.mockReturnValue({
      getSelfTransferTarget: () => null,
    } as never);

    expect(getAccountSelfTransferTarget(account, {})).toBeNull();
  });
});
