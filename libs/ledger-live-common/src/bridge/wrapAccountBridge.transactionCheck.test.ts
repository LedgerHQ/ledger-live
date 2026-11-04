import type {
  Account,
  AccountBridge,
  TransactionCheckPayload,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";

jest.mock("../coin-modules/registry", () => ({
  loadBridgeExtensionsForFamily: jest.fn().mockResolvedValue({}),
  loadSetupForFamily: jest.fn(),
  loadMockBridgeForFamily: jest.fn(),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn().mockResolvedValue(false),
  isCheckSanctionedAddressEnabled: jest.fn().mockReturnValue(false),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/transactionCheck/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/transactionCheck/index"),
  checkTransaction: jest.fn(),
  getTransactionCheckConfig: jest.fn(),
}));

import {
  checkTransaction,
  getTransactionCheckConfig,
  TransactionCheckRisk,
} from "@ledgerhq/ledger-wallet-framework/transactionCheck/index";
import {
  isAddressSanctioned,
  isCheckSanctionedAddressEnabled,
} from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { loadBridgeExtensionsForFamily } from "../coin-modules/registry";
import { wrapAccountBridge } from "./impl";

const mockedCheckTransaction = jest.mocked(checkTransaction);
const mockedGetTransactionCheckConfig = jest.mocked(getTransactionCheckConfig);
const mockedLoadBridgeExtensions = jest.mocked(loadBridgeExtensionsForFamily);

const CONFIG = { url: "https://transaction-checks.test.invalid/v3", chainId: 1000 };
const account = { id: "acc", currency: { id: "bitcoin" } } as unknown as Account;
const transaction = { family: "bitcoin", recipient: "bc1q", amount: 0 } as never;
const payload: TransactionCheckPayload = {
  chain: "bitcoin",
  from: "bc1qfrom",
  raw: "cHNidP8B",
  txHash: "00",
};

const makeStatus = (status: Partial<TransactionStatusCommon> = {}): TransactionStatusCommon =>
  ({ errors: {}, warnings: {}, ...status }) as TransactionStatusCommon;

const checkResult = (risk: number) => ({
  risk,
  category: 0x02,
  providerMessage: undefined,
  reportUrl: "https://bl.kd/abc",
});

async function getStatus(
  status: TransactionStatusCommon,
  getTransactionCheckPayload = jest.fn().mockResolvedValue(payload),
) {
  mockedLoadBridgeExtensions.mockResolvedValue({ getTransactionCheckPayload });
  const bridge = {
    getTransactionStatus: jest.fn().mockResolvedValue(status),
  } as unknown as AccountBridge<never>;
  const wrapped = await wrapAccountBridge(bridge, "bitcoin");
  return wrapped.getTransactionStatus(account, transaction);
}

describe("wrapAccountBridge — transaction check", () => {
  beforeEach(() => {
    mockedCheckTransaction.mockReset();
    mockedGetTransactionCheckConfig.mockReturnValue(CONFIG);
  });

  it("warns on the recipient on a critical threat, without blocking", async () => {
    mockedCheckTransaction.mockResolvedValue(checkResult(TransactionCheckRisk.Threat));

    const status = await getStatus(makeStatus());

    expect(mockedCheckTransaction).toHaveBeenCalledWith(CONFIG, payload);
    expect(status.errors.recipient).toBeUndefined();
    expect(status.warnings.recipient?.name).toBe("TransactionCheckCriticalThreat");
    expect(status.warnings.recipient).toMatchObject({
      category: 0x02,
      reportUrl: "https://bl.kd/abc",
    });
  });

  it("replaces a recipient warning of the coin on a critical threat", async () => {
    mockedCheckTransaction.mockResolvedValue(checkResult(TransactionCheckRisk.Threat));

    const status = await getStatus(
      makeStatus({ warnings: { recipient: new Error("CoinWarning") } }),
    );

    expect(status.warnings.recipient?.name).toBe("TransactionCheckCriticalThreat");
  });

  it("warns on the recipient on a potential risk", async () => {
    mockedCheckTransaction.mockResolvedValue(checkResult(TransactionCheckRisk.Risk));

    const status = await getStatus(makeStatus());

    expect(status.errors.recipient).toBeUndefined();
    expect(status.warnings.recipient?.name).toBe("TransactionCheckPotentialRisk");
  });

  it("keeps a recipient warning the coin already reported", async () => {
    mockedCheckTransaction.mockResolvedValue(checkResult(TransactionCheckRisk.Risk));
    const coinWarning = new Error("CoinWarning");

    const status = await getStatus(makeStatus({ warnings: { recipient: coinWarning } }));

    expect(status.warnings.recipient).toBe(coinWarning);
  });

  it.each([
    ["benign", checkResult(TransactionCheckRisk.Benign)],
    ["unavailable", null],
  ])("adds nothing for a %s check", async (_, result) => {
    mockedCheckTransaction.mockResolvedValue(result);

    const status = await getStatus(makeStatus());

    expect(status.errors.recipient).toBeUndefined();
    expect(status.warnings.recipient).toBeUndefined();
  });

  it("skips the check when it is not configured", async () => {
    mockedGetTransactionCheckConfig.mockReturnValue(undefined);
    const getPayload = jest.fn();

    await getStatus(makeStatus(), getPayload);

    expect(getPayload).not.toHaveBeenCalled();
    expect(mockedCheckTransaction).not.toHaveBeenCalled();
  });

  it("skips the check when the recipient is already in error", async () => {
    const getPayload = jest.fn();

    const status = await getStatus(
      makeStatus({ errors: { recipient: new Error("InvalidAddress") } }),
      getPayload,
    );

    expect(getPayload).not.toHaveBeenCalled();
    expect(status.errors.recipient?.message).toBe("InvalidAddress");
  });

  it("skips the check when the recipient is sanctioned", async () => {
    jest.mocked(isCheckSanctionedAddressEnabled).mockReturnValueOnce(true);
    jest.mocked(isAddressSanctioned).mockResolvedValueOnce(true);
    const getPayload = jest.fn();

    const status = await getStatus(makeStatus(), getPayload);

    expect(getPayload).not.toHaveBeenCalled();
    expect(status.errors.recipient?.name).toBe("AddressesSanctionedError");
  });

  it("skips the check when the family builds no payload", async () => {
    await getStatus(makeStatus(), jest.fn().mockResolvedValue(null));

    expect(mockedCheckTransaction).not.toHaveBeenCalled();
  });
});
