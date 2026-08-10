import BigNumber from "bignumber.js";
import invariant from "invariant";
import hederaCoinConfig from "../config";
import { rpcClient } from "../network/rpc";
import {
  getMockedAccount,
  getMockedTokenAccount,
  MAINNET_TEST_ACCOUNTS,
} from "../test/fixtures/account.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import { prepareTransaction } from "./prepareTransaction";

describe("prepareTransaction", () => {
  beforeAll(() => {
    hederaCoinConfig.setCoinConfig(() => getMockedConfig());
  });

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  it("subtracts the live network fee from the balance when useAllAmount is true", async () => {
    const balance = new BigNumber(100_000_000);
    const account = getMockedAccount({ balance, spendableBalance: balance });
    const transaction = getMockedTransaction({
      recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
      useAllAmount: true,
    });

    const { amount, maxFee } = await prepareTransaction(account, transaction);
    invariant(maxFee, "prepareTransaction should set maxFee");

    expect(maxFee.isGreaterThan(0)).toBe(true);
    expect(amount.isGreaterThan(0)).toBe(true);
    expect(amount.isEqualTo(balance.minus(maxFee))).toBe(true);
  });

  it("sets a gasLimit from live contract-call gas estimation for an ERC20 transfer", async () => {
    const erc20Token = getMockedERC20TokenCurrency({
      contractAddress: MAINNET_TEST_ACCOUNTS.withTokens.erc20Token,
    });
    const tokenAccount = getMockedTokenAccount(erc20Token, { balance: new BigNumber(1_000) });
    const account = getMockedAccount({
      freshAddress: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
      subAccounts: [tokenAccount],
    });
    const transaction = getMockedTransaction({
      subAccountId: tokenAccount.id,
      recipient: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
      amount: new BigNumber(100),
    });

    const result = await prepareTransaction(account, transaction);
    // gasLimit only exists on the Send-mode branch of the Transaction union
    const { maxFee, gasLimit } = result as { maxFee?: BigNumber; gasLimit?: BigNumber };
    invariant(maxFee, "prepareTransaction should set maxFee");
    invariant(gasLimit, "an ERC20 send should set gasLimit");

    expect(maxFee.isGreaterThan(0)).toBe(true);
    expect(gasLimit.isGreaterThan(0)).toBe(true);
  });
});
