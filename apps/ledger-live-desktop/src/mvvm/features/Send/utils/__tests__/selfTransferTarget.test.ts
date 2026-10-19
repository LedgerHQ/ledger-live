import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Account } from "@ledgerhq/types-live";
import {
  applyRecipientSelfTransferState,
  getAccountSelfTransferTarget,
} from "../selfTransferTarget";

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

  it("hands the parent account to the config, for a token account sharing its address", () => {
    const getSelfTransferTarget = jest.fn(() => null);
    mockedGetBalanceTypeConfig.mockReturnValue({ getSelfTransferTarget } as never);
    const tokenAccount = { type: "TokenAccount", token: { id: "aleo/token" } } as never;
    const transaction = { mode: "transfer_token_public" };

    getAccountSelfTransferTarget(tokenAccount, transaction, account);

    expect(getSelfTransferTarget).toHaveBeenCalledTimes(1);
    expect(getSelfTransferTarget).toHaveBeenCalledWith({
      account: tokenAccount,
      parentAccount: account,
      transaction,
    });
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

describe("applyRecipientSelfTransferState", () => {
  const target = {
    address: "aleo1self",
    translationKey: "recipient.selfTransfer.toPrivate",
    isDestinationPublic: false,
  };

  function stubConfig() {
    const buildSelfTransferPatch = jest.fn(({ isSelfTransfer }: { isSelfTransfer: boolean }) => ({
      selfTransfer: isSelfTransfer,
    }));
    mockedGetBalanceTypeConfig.mockReturnValue({
      getSelfTransferTarget: () => target,
      buildSelfTransferPatch,
    } as never);
    return buildSelfTransferPatch;
  }

  it("puts the transaction in self-transfer state for the account's own target address", () => {
    const buildSelfTransferPatch = stubConfig();
    const transaction = { mode: "transfer_public" };

    expect(applyRecipientSelfTransferState(account, transaction, "ALEO1SELF")).toEqual({
      mode: "transfer_public",
      selfTransfer: true,
    });
    expect(buildSelfTransferPatch).toHaveBeenCalledWith({ isSelfTransfer: true, transaction });
  });

  it("matches the token account's target through its parent account", () => {
    const getSelfTransferTarget = jest.fn(() => target);
    mockedGetBalanceTypeConfig.mockReturnValue({
      getSelfTransferTarget,
      buildSelfTransferPatch: () => ({ selfTransfer: true }),
    } as never);
    const tokenAccount = { type: "TokenAccount", token: { id: "aleo/token" } } as never;
    const transaction = { mode: "transfer_token_public" };

    expect(
      applyRecipientSelfTransferState(tokenAccount, transaction, "aleo1self", account),
    ).toEqual({ mode: "transfer_token_public", selfTransfer: true });
    expect(getSelfTransferTarget).toHaveBeenCalledTimes(1);
    expect(getSelfTransferTarget).toHaveBeenCalledWith({
      account: tokenAccount,
      parentAccount: account,
      transaction,
    });
  });

  it("takes the transaction out of self-transfer state for any other address", () => {
    stubConfig();

    expect(
      applyRecipientSelfTransferState(account, { selfTransfer: true }, "aleo1someoneelse"),
    ).toEqual({ selfTransfer: false });
  });

  it("returns the transaction untouched when the currency declares no balanceType config", () => {
    mockedGetBalanceTypeConfig.mockReturnValue(null);
    const transaction = { mode: "transfer_public" };

    expect(applyRecipientSelfTransferState(account, transaction, "aleo1self")).toBe(transaction);
  });
});
