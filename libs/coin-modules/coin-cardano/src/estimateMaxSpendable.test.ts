import type { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import coinConfig from "./config";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { cardanoCoinConfig, cardanoTestnetCoinConfig } from "./fixtures/config";
import { getProtocolParamsFixture } from "./fixtures/protocolParams";
import type { CardanoAccount, Transaction } from "./types";

const buildAccount = (): CardanoAccount => {
  const account = getCardanoAccountFixture({});
  account.balance = new BigNumber(100e6);
  account.spendableBalance = new BigNumber(100e6);
  account.cardanoResources.protocolParams = getProtocolParamsFixture();
  account.currency = { ...account.currency, id: "cardano" };
  return account;
};

const withProtocolParams = { protocolParams: getProtocolParamsFixture() } as Partial<Transaction>;

describe("estimateMaxSpendable", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(currencyId =>
      currencyId === "cardano_testnet" ? cardanoTestnetCoinConfig : cardanoCoinConfig,
    );
  });

  it("returns zero when the account has no utxo", async () => {
    const account = buildAccount();
    account.cardanoResources.utxos = [];

    const max = await estimateMaxSpendable({ account });

    expect(max.toString()).toBe("0");
  });

  it("returns the balance minus a single network fee for an account holding only ada", async () => {
    const max = await estimateMaxSpendable({
      account: buildAccount(),
      transaction: withProtocolParams as Transaction,
    });

    expect(max.toString()).toBe("99834631");
  });

  it("returns zero when the transaction cannot be built from the available utxos", async () => {
    const account = buildAccount();
    account.cardanoResources.utxos = [
      { ...account.cardanoResources.utxos[0], amount: new BigNumber(1000) },
    ];

    const max = await estimateMaxSpendable({
      account,
      transaction: withProtocolParams as Transaction,
    });

    expect(max.toString()).toBe("0");
  });

  it("returns the token balance for a token sub account", async () => {
    const parentAccount = buildAccount();
    const tokenAccount = {
      type: "TokenAccount",
      id: `${parentAccount.id}+token`,
      parentId: parentAccount.id,
      balance: new BigNumber(777),
    } as unknown as TokenAccount;

    const max = await estimateMaxSpendable({ account: tokenAccount, parentAccount });

    expect(max.toString()).toBe("777");
  });
});
