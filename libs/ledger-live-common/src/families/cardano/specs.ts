import expect from "expect";
import type { AppSpec } from "../../bot/types";
import type { CardanoResources, Transaction } from "./types";
import { pickSiblings } from "../../bot/specs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { mergeTokens } from "./logic";

const cardano: AppSpec<Transaction> = {
  name: "cardano",
  currency: getCryptoCurrencyById("cardano"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "CardanoADA",
  },
  mutations: [
    {
      name: "move ~50%",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is too low");
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const updates = [
          { recipient },
          { amount: new BigNumber(account.balance.dividedBy(2)).dp(0, 1) },
          { memo: "LedgerLiveBot" },
        ];

        return {
          transaction,
          updates,
        };
      },
      test: ({ operation, transaction }): void => {
        expect(operation.extra).toEqual({
          memo: transaction.memo,
        });
        expect(operation.value).toEqual(transaction.amount);
      },
    },
    {
      name: "send max",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const updates = [{ recipient }, { useAllAmount: true }];

        return {
          transaction,
          updates,
        };
      },
      test: ({ accountBeforeTransaction, operation }): void => {
        const cardanoResources =
          accountBeforeTransaction.cardanoResources as CardanoResources;
        const utxoTokens = cardanoResources.utxos.map((u) => u.tokens).flat();
        const tokenBalance = mergeTokens(utxoTokens);
        const requiredAdaForTokens = TyphonUtils.calculateMinUtxoAmount(
          tokenBalance,
          new BigNumber(cardanoResources.protocolParams.lovelacePerUtxoWord),
          false
        );
        expect(operation.value).toEqual(
          accountBeforeTransaction.balance
            .minus(operation.fee)
            .minus(requiredAdaForTokens)
        );
      },
    },
  ],
};

export default { cardano };
