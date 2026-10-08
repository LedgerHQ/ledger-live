import BigNumber from "bignumber.js";
import type { ConfidentialBalance } from "@ledgerhq/coin-evm/confidential";
import { setConfidentialSendRuntime } from "../../confidential/runtime";
import { evmBalanceTypeConfig } from "./balanceType";

const PAIR = { underlying: "0xusdc", wrapper: "0xcusdc", rate: 1n, wrapperDecimals: 6 };
const HANDLE = `0x${"ab".repeat(32)}` as const;
const tokenAccount = {
  type: "TokenAccount",
  id: "token-1",
  spendableBalance: new BigNumber(75_000_000),
} as any;

const OWNER = "0x0a101aA5347Bb16F43019BE42ce5830395739e33";

function withBalance(balance: ConfidentialBalance | undefined) {
  setConfidentialSendRuntime({
    getBalance: () => balance,
    getOwner: () => OWNER,
    prepareSend: jest.fn(),
    prepareShield: jest.fn(),
    prepareUnshield: jest.fn(),
    onUnshieldRequested: jest.fn(),
  });
}

const DECRYPTED: ConfidentialBalance = {
  state: "decrypted",
  pair: PAIR,
  handle: HANDLE,
  value: 2_500_000n,
  underlyingValue: 2_500_000n,
  updatedAt: 0,
};

afterEach(() => setConfidentialSendRuntime(undefined));

describe("evmBalanceTypeConfig", () => {
  it("offers no source without a host or for native accounts", () => {
    expect(evmBalanceTypeConfig.getOptions({ account: tokenAccount })).toEqual([]);
    withBalance({ state: "undisclosed", pair: PAIR, handle: HANDLE });
    expect(
      evmBalanceTypeConfig.getOptions({ account: { type: "Account", id: "eth" } as any }),
    ).toEqual([]);
  });

  it("offers only the public source before a reveal, so it can still be shielded", () => {
    withBalance({ state: "undisclosed", pair: PAIR, handle: HANDLE });
    expect(evmBalanceTypeConfig.getOptions({ account: tokenAccount }).map(o => o.id)).toEqual([
      "public",
    ]);
  });

  it("offers the public and the revealed private part", () => {
    withBalance({
      state: "decrypted",
      pair: PAIR,
      handle: HANDLE,
      value: 2_500_000n,
      underlyingValue: 2_500_000n,
      updatedAt: 0,
    });
    expect(evmBalanceTypeConfig.getOptions({ account: tokenAccount })).toEqual([
      {
        id: "public",
        translationKey: "balanceType.public",
        balance: new BigNumber(75_000_000),
        hasPendingBalance: false,
        icon: "check",
      },
      {
        id: "confidential",
        translationKey: "balanceType.confidential",
        balance: new BigNumber(2_500_000),
        hasPendingBalance: false,
        icon: "lock",
      },
    ]);
    expect(
      evmBalanceTypeConfig.getSelectableBalance({
        account: tokenAccount,
        optionId: "confidential",
      }),
    ).toEqual(new BigNumber(2_500_000));
    expect(
      evmBalanceTypeConfig.getSelectableBalance({ account: tokenAccount, optionId: "public" }),
    ).toEqual(new BigNumber(75_000_000));
  });

  it("flags a stale private part as possibly different", () => {
    withBalance({
      state: "stale",
      pair: PAIR,
      handle: HANDLE,
      decryptedHandle: HANDLE,
      value: 1n,
      underlyingValue: 1n,
      updatedAt: 0,
    });
    expect(evmBalanceTypeConfig.getOptions({ account: tokenAccount })[1]?.hasPendingBalance).toBe(
      true,
    );
  });

  it("records the source on the transaction", () => {
    const patch = evmBalanceTypeConfig.buildSelectionPatch("confidential");
    expect(patch).toEqual({ familySpecificData: { balanceType: "confidential" } });
    expect(evmBalanceTypeConfig.getSelectedOptionId(patch)).toBe("confidential");
    expect(evmBalanceTypeConfig.getSelectedOptionId({ family: "evm" })).toBeNull();
    expect(
      evmBalanceTypeConfig.getSelfTransferTarget({ account: tokenAccount, transaction: {} }),
    ).toBeNull();
  });
});

describe("evmBalanceTypeConfig self-transfer", () => {
  const fromPrivate = { familySpecificData: { balanceType: "confidential" } };
  const fromPublic = { familySpecificData: { balanceType: "public" } };

  it("offers the account's public part as an unshield target from the private part", () => {
    withBalance(DECRYPTED);
    expect(
      evmBalanceTypeConfig.getSelfTransferTarget({
        account: tokenAccount,
        transaction: fromPrivate,
      }),
    ).toEqual({
      address: OWNER,
      translationKey: "recipient.selfTransfer.toPublic",
      isDestinationPublic: true,
    });
  });

  it("offers the account's private part as a shield target from the public part", () => {
    withBalance({ state: "undisclosed", pair: PAIR, handle: HANDLE });
    expect(
      evmBalanceTypeConfig.getSelfTransferTarget({
        account: tokenAccount,
        transaction: fromPublic,
      }),
    ).toEqual({
      address: OWNER,
      translationKey: "recipient.selfTransfer.toPrivate",
      isDestinationPublic: false,
    });
  });

  it("offers no unshield target before a reveal, nor any target without a source", () => {
    withBalance({ state: "undisclosed", pair: PAIR, handle: HANDLE });
    expect(
      evmBalanceTypeConfig.getSelfTransferTarget({
        account: tokenAccount,
        transaction: fromPrivate,
      }),
    ).toBeNull();
    expect(
      evmBalanceTypeConfig.getSelfTransferTarget({ account: tokenAccount, transaction: {} }),
    ).toBeNull();
  });

  it("records the shortcut on the transaction", () => {
    expect(evmBalanceTypeConfig.buildSelfTransferPatch({ isSelfTransfer: true })).toEqual({
      selfTransfer: true,
    });
    expect(evmBalanceTypeConfig.buildSelfTransferPatch({ isSelfTransfer: false })).toEqual({
      selfTransfer: false,
    });
  });
});
