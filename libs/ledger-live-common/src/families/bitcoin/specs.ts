import expect from "expect";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import bchaddrjs from "bchaddrjs";
import sample from "lodash/sample";
import { log } from "@ledgerhq/logs";
import type {
  BitcoinAccount,
  BitcoinOutput,
  BitcoinResources,
  Transaction,
} from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, pickSiblings } from "../../bot/specs";
import { bitcoinPickingStrategy } from "./types";
import type { MutationSpec, AppSpec } from "../../bot/types";
import { LowerThanMinimumRelayFee } from "../../errors";
import { getMinRelayFee, getUTXOStatus } from "./logic";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";

type Arg = Partial<{
  minimalAmount: BigNumber;
  targetAccountSize: number;
  recipientVariation: (arg0: string) => string;
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
    const feePerByte = new BigNumber(getMinRelayFee(account.currency))
      .times(transaction.feePerByte || 0)
      .div(status.estimatedFees)
      .integerValue(BigNumber.ROUND_CEIL);
    log("specs/bitcoin", "recovering with feePerByte=" + feePerByte.toString());
    if (feePerByte.lt(1) || feePerByte.eq(transaction.feePerByte || 0)) return;
    return bridge.updateTransaction(transaction, {
      feePerByte,
    });
  }
};

const genericTest = ({
  operation,
  account,
  transaction,
  status,
  accountBeforeTransaction,
}) => {
  invariant(
    Date.now() - operation.date < 1000000,
    "operation time to be recent"
  );

  // balance move
  botTest("account balance decreased with operation value", () =>
    expect(account.balance.toString()).toBe(
      accountBeforeTransaction.balance.minus(operation.value).toString()
    )
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
  const asSorted = (opShape: { senders: string[]; recipients: string[] }) => ({
    senders: opShape.senders.slice(0).sort(),
    recipients: opShape.recipients.slice(0).sort(),
  });

  botTest("operation matches tx senders and recipients", () => {
    let expectedSenders = nonDeterministicPicking
      ? operation.senders
      : txInputs.map((t) => t.address).filter(Boolean);
    let expectedRecipients = txOutputs
      .filter((o) => o.address && !o.isChange)
      .map((o) => o.address)
      .filter(Boolean);
    if (account.currency.id === "bitcoin_cash") {
      expectedSenders = expectedSenders.map(bchToCashaddrAddressWithoutPrefix);
      expectedRecipients = expectedRecipients.map(
        bchToCashaddrAddressWithoutPrefix
      );
    }
    expect(asSorted(operation)).toMatchObject(
      asSorted({
        senders: expectedSenders,
        recipients: expectedRecipients,
      })
    );
  });
  const utxosPicked = (status.txInputs || [])
    .map(({ previousTxHash, previousOutputIndex }) =>
      bitcoinResources.utxos.find(
        (u) =>
          u.hash === previousTxHash && u.outputIndex === previousOutputIndex
      )
    )
    .filter(Boolean);
  // verify that no utxo that was supposed to be exploded were used
  botTest("picked utxo has been consumed", () =>
    expect(
      utxosPicked.filter(
        (u: BitcoinOutput) =>
          u.blockHeight && getUTXOStatus(u, transaction.utxoStrategy).excluded
      )
    ).toEqual([])
  );
};

const bitcoinLikeMutations = ({
  minimalAmount = new BigNumber("10000"),
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
      const updates: Array<Partial<Transaction>> = [
        {
          recipient,
        },
        {
          amount,
        },
      ];

      if (Math.random() < 0.5) {
        updates.push({
          rbf: true,
        });
      }

      return {
        transaction,
        updates,
      };
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
        {
          recipient: recipientVariation(sibling.freshAddress),
        },
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
      return {
        transaction,
        updates,
      };
    },
    recoverBadTransactionStatus,
  },
  {
    name: "send 1 utxo",
    maxRun: 1,
    transaction: ({ account, bridge, siblings, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const { bitcoinResources } = account as BitcoinAccount;
      invariant(bitcoinResources, "bitcoin resources");
      const transaction = bridge.createTransaction(account);
      const utxo = sample(
        (bitcoinResources as BitcoinResources).utxos.filter(
          (u) => u.blockHeight
        )
      );
      invariant(utxo, "no confirmed utxo");
      return {
        transaction,
        updates: [
          {
            recipient: recipientVariation(sibling.freshAddress),
          },
          {
            utxoStrategy: {
              ...transaction.utxoStrategy,
              excludeUTXOs: (bitcoinResources as BitcoinResources).utxos
                .filter((u) => u !== utxo)
                .map(({ outputIndex, hash }) => ({
                  outputIndex,
                  hash,
                })),
            },
          },
          {
            useAllAmount: true,
          },
        ],
      };
    },
    recoverBadTransactionStatus,
    test: ({ accountBeforeTransaction, account, operation, transaction }) => {
      const utxo = (
        (accountBeforeTransaction as BitcoinAccount).bitcoinResources?.utxos ||
        []
      ).find(
        (utxo) =>
          !transaction.utxoStrategy.excludeUTXOs.some(
            (u) => u.hash === utxo.hash && u.outputIndex === utxo.outputIndex
          )
      );
      invariant(utxo, "utxo available");
      botTest("sender is only the utxo address", () => {
        let expectedSender = (utxo as BitcoinOutput).address;
        if (account.currency.id === "bitcoin_cash") {
          expectedSender = bchToCashaddrAddressWithoutPrefix(expectedSender);
        }
        expect(operation).toMatchObject({
          senders: [expectedSender],
        });
      });
      botTest("utxo has been consumed", () =>
        expect(
          (account as BitcoinAccount).bitcoinResources?.utxos.find(
            (u) =>
              u.hash === (utxo as BitcoinOutput).hash &&
              u.outputIndex === (utxo as BitcoinOutput).outputIndex
          )
        ).toBe(undefined)
      );
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
          {
            recipient,
          },
          {
            utxoStrategy: {
              ...transaction.utxoStrategy,
            },
          },
          {
            useAllAmount: true,
          },
        ],
      };
    },
    recoverBadTransactionStatus,
    test: ({ account }) => {
      botTest("total of utxos is zero", () =>
        expect(
          (account as BitcoinAccount).bitcoinResources?.utxos
            .filter(
              (u) => u.blockHeight && u.blockHeight < account.blockHeight - 10
            ) // Exclude pending UTXOs and the Utxos just written into new block (10 blocks time)
            .reduce((p, c) => p.plus(c.value), new BigNumber(0))
            .toString()
        ).toBe("0")
      );
    },
  },
];

const bitcoin: AppSpec<Transaction> = {
  name: "Bitcoin",
  currency: getCryptoCurrencyById("bitcoin"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Bitcoin",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};
const bitcoinTestnet: AppSpec<Transaction> = {
  multipleRuns: 2,
  name: "Bitcoin Testnet",
  currency: getCryptoCurrencyById("bitcoin_testnet"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Bitcoin Test",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 8,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("bitcoin_testnet").units[0],
      "0.0001"
    ),
  }),
};
const bitcoinGold: AppSpec<Transaction> = {
  name: "Bitcoin Gold",
  currency: getCryptoCurrencyById("bitcoin_gold"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "BitcoinGold",
  },
  genericDeviceAction: acceptTransaction,
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
    model: DeviceModelId.nanoS,
    appName: "BitcoinCash",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    recipientVariation: (recipient) => {
      const [mode, fn] = sample([
        ["legacy address", bchaddrjs.toLegacyAddress],
        ["cash address", bchaddrjs.toCashAddress],
        ["cash address without prefix", bchToCashaddrAddressWithoutPrefix],
      ]) as [string, (arg: string) => string];
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
    model: DeviceModelId.nanoS,
    appName: "Peercoin",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};
const pivx: AppSpec<Transaction> = {
  name: "PivX",
  currency: getCryptoCurrencyById("pivx"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "PivX",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};
const qtum: AppSpec<Transaction> = {
  name: "Qtum",
  currency: getCryptoCurrencyById("qtum"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Qtum",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};
const stakenet: AppSpec<Transaction> = {
  name: "Stakenet",
  currency: getCryptoCurrencyById("stakenet"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "XSN",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};
const vertcoin: AppSpec<Transaction> = {
  name: "Vertcoin",
  currency: getCryptoCurrencyById("vertcoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Vertcoin",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};
const viacoin: AppSpec<Transaction> = {
  name: "Viacoin",
  currency: getCryptoCurrencyById("viacoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Viacoin",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
};
const dash: AppSpec<Transaction> = {
  name: "Dash",
  currency: getCryptoCurrencyById("dash"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Dash",
  },
  genericDeviceAction: acceptTransaction,
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
    model: DeviceModelId.nanoS,
    appName: "Dogecoin",
  },
  genericDeviceAction: acceptTransaction,
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
    model: DeviceModelId.nanoS,
    appName: "Zcash",
  },
  genericDeviceAction: acceptTransaction,
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
    model: DeviceModelId.nanoS,
    appName: "Horizen",
  },
  genericDeviceAction: acceptTransaction,
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
    model: DeviceModelId.nanoS,
    appName: "Digibyte",
  },
  genericDeviceAction: acceptTransaction,
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
    model: DeviceModelId.nanoS,
    appName: "Komodo",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("komodo").units[0],
      "0.1"
    ),
  }),
};
const decred: AppSpec<Transaction> = {
  name: "Decred",
  currency: getCryptoCurrencyById("decred"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Decred",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("decred").units[0],
      "0.0001"
    ),
  }),
};
const litecoin: AppSpec<Transaction> = {
  name: "Litecoin",
  currency: getCryptoCurrencyById("litecoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Litecoin",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: parseCurrencyUnit(
      getCryptoCurrencyById("litecoin").units[0],
      "0.001"
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
  vertcoin,
  viacoin,
  zcash,
  zencash,
  decred,
};
