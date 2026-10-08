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

function withBalance(balance: ConfidentialBalance | undefined) {
  setConfidentialSendRuntime({ getBalance: () => balance, prepareSend: jest.fn() });
}

afterEach(() => setConfidentialSendRuntime(undefined));

describe("evmBalanceTypeConfig", () => {
  it("offers no source without a host, for native accounts, and before a reveal", () => {
    expect(evmBalanceTypeConfig.getOptions({ account: tokenAccount })).toEqual([]);
    withBalance({ state: "undisclosed", pair: PAIR, handle: HANDLE });
    expect(evmBalanceTypeConfig.getOptions({ account: tokenAccount })).toEqual([]);
    expect(
      evmBalanceTypeConfig.getOptions({ account: { type: "Account", id: "eth" } as any }),
    ).toEqual([]);
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
