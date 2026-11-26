import { fromTrongridTxInfoToOperation } from "@ledgerhq/coin-tron/network/trongrid/trongrid-adapters";
import type { TrongridTxInfo } from "@ledgerhq/coin-tron/types/index";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";
import { getOperationAmountNumber } from "@ledgerhq/ledger-wallet-framework/operation";
import type { SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { buildSubAccounts } from "../../bridge/generic-coin-framework/buildSubAccounts";
import type { OperationCommon } from "../../bridge/generic-coin-framework/types";
import { adaptCoreOperationToLiveOperation } from "../../bridge/generic-coin-framework/utils";

const sender = "TKVxBz28UQJeS5hZvHufxvCiMzvQ4bUYpa";
const recipient = "TBiNkpovzraTunRNcuqJXsocVXVg548XfZ";
const usdtContract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const accountId = `js:2:tron:${sender}:`;
const feeInSun = 345_000;

const usdt: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t"),
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
  contractAddress: usdtContract,
  parentCurrencyId: CryptoCurrencyIdSchema.parse("tron"),
  tokenType: "trc20",
};
const syncConfig: SyncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

const failedUsdtTransfer: TrongridTxInfo = {
  txID: "ad6f1b78e499f56036f5c041d70a51b82a5fba938b2ca2c38a8b1097b2626cbe",
  date: new Date(1795510131000),
  type: "TriggerSmartContract",
  tokenType: "trc20",
  tokenId: usdtContract,
  tokenAddress: usdtContract,
  from: sender,
  to: recipient,
  value: new BigNumber(2_448_000_000),
  fee: new BigNumber(feeInSun),
  blockHeight: 1,
  hasFailed: true,
  feesPayer: sender,
};

async function syncFailedTransfer() {
  const block = { height: 1, hash: "blockHash", time: failedUsdtTransfer.date };
  const coreOperation = fromTrongridTxInfoToOperation(failedUsdtTransfer, block, sender);
  const nativeOperation = adaptCoreOperationToLiveOperation(
    accountId,
    coreOperation,
  ) as OperationCommon;
  const [tokenAccount] = await buildSubAccounts({
    accountId,
    allTokenAssetsBalances: [
      { value: 0n, asset: { type: "trc20", assetReference: usdtContract, assetOwner: sender } },
    ],
    syncConfig,
    operations: [nativeOperation],
    getTokenFromAsset: async () => usdt,
  });
  return { nativeOperation, tokenOperation: tokenAccount.operations[0] };
}

describe("a failed TRC20 transfer synced through the generic coin framework", () => {
  it("shows as a failed send to its recipient on the token account", async () => {
    const { tokenOperation } = await syncFailedTransfer();

    expect(tokenOperation).toMatchObject({
      type: "OUT",
      hasFailed: true,
      recipients: [recipient],
      value: new BigNumber(0),
    });
  });

  it("leaves the token balance history unchanged", async () => {
    const { tokenOperation } = await syncFailedTransfer();

    expect(getOperationAmountNumber(tokenOperation).isZero()).toBe(true);
  });

  it("still debits the fee from the TRX account", async () => {
    const { nativeOperation } = await syncFailedTransfer();

    expect(getOperationAmountNumber(nativeOperation)).toEqual(new BigNumber(-feeInSun));
  });
});
