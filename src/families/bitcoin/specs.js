// @flow
import expect from "expect";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import bchaddrjs from "bchaddrjs";
import sample from "lodash/sample";
import { log } from "@ledgerhq/logs";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import { bitcoinPickingStrategy } from "./types";
import type { MutationSpec, AppSpec } from "../../bot/types";
import { LowerThanMinimumRelayFee } from "../../errors";
import { getMinRelayFee } from "./fees";
import { isChangeOutput, getUTXOStatus } from "./transaction";

type Arg = $Shape<{
  minimalAmount: BigNumber,
  targetAccountSize: number,
  recipientVariation: (string) => string,
}>;

const recoverBadTransactionStatus = ({
  bridge,
  account,
  transaction,
  status,
}) => {
  const hasErrors = Object.keys(status.errors).length > 0;

  if (
    !hasErrors &&
    status.warnings.feePerByte instanceof LowerThanMinimumRelayFee &&
    status.estimatedFees.gt(0)
  ) {
    const feePerByte = BigNumber(getMinRelayFee(account.currency))
      .times(transaction.feePerByte || 0)
      .div(status.estimatedFees)
      .integerValue(BigNumber.ROUND_CEIL);
    log("specs/bitcoin", "recovering with feePerByte=" + feePerByte.toString());
    if (feePerByte.lt(1) || feePerByte.eq(transaction.feePerByte || 0)) return;
    return bridge.updateTransaction(transaction, { feePerByte });
  }
};

const genericTest = ({
  operation,
  account,
  transaction,
  status,
  accountBeforeTransaction,
}) => {
  // workaround for buggy explorer behavior (nodes desync)
  invariant(
    Date.now() - operation.date > 20000,
    "operation time to be older than 20s"
  );
  // balance move
  expect(account.balance.toString()).toBe(
    accountBeforeTransaction.balance.minus(operation.value).toString()
  );
  // inputs outputs
  const { txInputs, txOutputs } = status;
  invariant(txInputs, "tx inputs defined");
  invariant(txOutputs, "tx outputs defined");

  const { bitcoinResources } = accountBeforeTransaction;
  invariant(bitcoinResources, "bitcoin resources");

  const nonDeterministicPicking =
    transaction.utxoStrategy.strategy === bitcoinPickingStrategy.OPTIMIZE_SIZE;

  // FIXME: we do this in unsorted way. there are changes of outputs ordering...
  const asSorted = (opShape: { senders: string[], recipients: string[] }) => ({
    senders: opShape.senders.slice(0).sort(),
    recipients: opShape.recipients.slice(0).sort(),
  });

  expect(asSorted(operation)).toMatchObject(
    asSorted({
      senders: nonDeterministicPicking
        ? operation.senders
        : txInputs.map((t) => t.address).filter(Boolean),
      recipients: txOutputs
        .filter((o) => !isChangeOutput(o))
        .map((t) => t.address)
        .filter(Boolean),
    })
  );

  const utxosPicked = (status.txInputs || [])
    .map(({ previousTxHash, previousOutputIndex }) =>
      bitcoinResources.utxos.find(
        (u) =>
          u.hash === previousTxHash && u.outputIndex === previousOutputIndex
      )
    )
    .filter(Boolean);
  // verify that no utxo that was supposed to be exploded were used
  expect(
    utxosPicked.filter(
      (u) => getUTXOStatus(u, transaction.utxoStrategy).excluded
    )
  ).toEqual([]);
};

const bitcoinLikeMutations = ({
  minimalAmount = BigNumber("10000"),
  targetAccountSize = 3,
  recipientVariation = (recipient) => recipient,
}: Arg = {}): MutationSpec<Transaction>[] => [
  {
    name: "move ~50%",
    maxRun: 1,
    transaction: ({ account, siblings, bridge, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const recipient = recipientVariation(sibling.freshAddress);
      const amount = maxSpendable.div(1.9 + 0.2 * Math.random()).integerValue();
      const transaction = bridge.createTransaction(account);
      const updates = [{ recipient }, { amount }];
      if (Math.random() < 0.5) {
        updates.push({ rbf: true });
      }
      return { transaction, updates };
    },
    recoverBadTransactionStatus,
  },
  {
    name: "optimize-size",
    maxRun: 1,
    transaction: ({ account, siblings, bridge, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const transaction = bridge.createTransaction(account);
      const updates = [
        { recipient: recipientVariation(sibling.freshAddress) },
        {
          amount: maxSpendable.times(0.1 + 0.9 * Math.random()).integerValue(),
        },
        {
          utxoStrategy: {
            ...transaction.utxoStrategy,
            strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
          },
        },
      ];
      return { transaction, updates };
    },
    recoverBadTransactionStatus,
  },
  {
    name: "send 1 utxo",
    maxRun: 1,
    transaction: ({ account, bridge, siblings, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const { bitcoinResources } = account;
      invariant(bitcoinResources, "bitcoin resources");
      const transaction = bridge.createTransaction(account);
      const utxo = sample(bitcoinResources.utxos.filter((u) => u.blockHeight));
      invariant(utxo, "no confirmed utxo");
      return {
        transaction,
        updates: [
          { recipient: recipientVariation(sibling.freshAddress) },
          {
            utxoStrategy: {
              ...transaction.utxoStrategy,
              excludeUTXOs: bitcoinResources.utxos
                .filter((u) => u !== utxo)
                .map(({ outputIndex, hash }) => ({ outputIndex, hash })),
            },
          },
          { useAllAmount: true },
        ],
      };
    },
    recoverBadTransactionStatus,
    test: ({ accountBeforeTransaction, account, operation, transaction }) => {
      const utxo = (
        accountBeforeTransaction.bitcoinResources?.utxos || []
      ).find(
        (utxo) =>
          !transaction.utxoStrategy.excludeUTXOs.some(
            (u) => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex
          )
      );
      invariant(utxo, "utxo available");
      expect(operation).toMatchObject({ senders: [utxo.address] });
      expect(
        account.bitcoinResources?.utxos.find(
          (u) => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex
        )
      ).toBe(undefined);
    },
  },
  {
    name: "send max",
    maxRun: 1,
    transaction: ({ account, siblings, bridge, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const recipient = recipientVariation(sibling.freshAddress);
      const transaction = bridge.createTransaction(account);
      return {
        transaction,
        updates: [
          { recipient },
          {
            utxoStrategy: {
              ...transaction.utxoStrategy,
              pickUnconfirmedRBF: true,
            },
          },
          { useAllAmount: true },
        ],
      };
    },
    recoverBadTransactionStatus,
    test: ({ account }) => {
      expect(account.balance.toString()).toBe("0");
    },
  },
];

const bitcoin: AppSpec<Transaction> = {
  name: "Bitcoin",
  currency: getCryptoCurrencyById("bitcoin"),
  appQuery: {
    model: "nanoS",
    appName: "Bitcoin",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const bitcoinTestnet: AppSpec<Transaction> = {
  name: "Bitcoin Testnet",
  currency: getCryptoCurrencyById("bitcoin_testnet"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Bitcoin Test",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 8,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("bitcoin_testnet").units[0],
      "0.001"
    ),
  }),
};

const bitcoinGold: AppSpec<Transaction> = {
  name: "Bitcoin Gold",
  currency: getCryptoCurrencyById("bitcoin_gold"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "BitcoinGold",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const bchToCashaddrAddressWithoutPrefix = (recipient) =>
  bchaddrjs.toCashAddress(recipient).split(":")[1];

const bitcoinCash: AppSpec<Transaction> = {
  name: "Bitcoin Cash",
  currency: getCryptoCurrencyById("bitcoin_cash"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "BitcoinCash",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    recipientVariation: (recipient) => {
      const [mode, fn] = sample([
        ["legacy address", bchaddrjs.toLegacyAddress],
        ["cash address", bchaddrjs.toCashAddress],
        ["cash address without prefix", bchToCashaddrAddressWithoutPrefix],
      ]);
      const addr = fn(recipient);
      log("bch", `using ${mode}: ${recipient} => ${addr}`);
      return addr;
    },
  }),
};

const peercoin: AppSpec<Transaction> = {
  name: "Peercoin",
  currency: getCryptoCurrencyById("peercoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Peercoin",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const pivx: AppSpec<Transaction> = {
  name: "PivX",
  currency: getCryptoCurrencyById("pivx"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "PivX",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const qtum: AppSpec<Transaction> = {
  name: "Qtum",
  currency: getCryptoCurrencyById("qtum"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Qtum",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const stakenet: AppSpec<Transaction> = {
  name: "Stakenet",
  currency: getCryptoCurrencyById("stakenet"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "XSN",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const stratis: AppSpec<Transaction> = {
  name: "Stratis",
  currency: getCryptoCurrencyById("stratis"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Stratis",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const vertcoin: AppSpec<Transaction> = {
  name: "Vertcoin",
  currency: getCryptoCurrencyById("vertcoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Vertcoin",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const viacoin: AppSpec<Transaction> = {
  name: "Viacoin",
  currency: getCryptoCurrencyById("viacoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Viacoin",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};

const dash: AppSpec<Transaction> = {
  name: "Dash",
  currency: getCryptoCurrencyById("dash"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Dash",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("dash").units[0],
      "0.001"
    ),
  }),
};

const dogecoin: AppSpec<Transaction> = {
  name: "DogeCoin",
  currency: getCryptoCurrencyById("dogecoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Dogecoin",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("dogecoin").units[0],
      "1"
    ),
  }),
};

const zcash: AppSpec<Transaction> = {
  name: "ZCash",
  currency: getCryptoCurrencyById("zcash"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Zcash",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("zcash").units[0],
      "0.0002"
    ),
  }),
};

const zencash: AppSpec<Transaction> = {
  name: "Horizen",
  currency: getCryptoCurrencyById("zencash"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Horizen",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("zencash").units[0],
      "0.01"
    ),
  }),
};

const digibyte: AppSpec<Transaction> = {
  name: "Digibyte",
  currency: getCryptoCurrencyById("digibyte"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Digibyte",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("digibyte").units[0],
      "0.1"
    ),
  }),
};

const komodo: AppSpec<Transaction> = {
  name: "Komodo",
  currency: getCryptoCurrencyById("komodo"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Komodo",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("komodo").units[0],
      "0.1"
    ),
  }),
};

const litecoin: AppSpec<Transaction> = {
  name: "Litecoin",
  currency: getCryptoCurrencyById("litecoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Litecoin",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("litecoin").units[0],
      "0.001"
    ),
  }),
};

const stealthcoin: AppSpec<Transaction> = {
  name: "Stealth",
  currency: getCryptoCurrencyById("stealthcoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Stealth",
  },
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("stealthcoin").units[0],
      "0.1"
    ),
  }),
};

export default {
  bitcoin,
  bitcoinTestnet,
  bitcoinCash,
  bitcoinGold,
  dash,
  digibyte,
  dogecoin,
  komodo,
  litecoin,
  peercoin,
  pivx,
  qtum,
  stakenet,
  stealthcoin,
  stratis,
  vertcoin,
  viacoin,
  zcash,
  zencash,
};
