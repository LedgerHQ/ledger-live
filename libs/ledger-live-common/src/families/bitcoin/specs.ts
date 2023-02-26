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
  TransactionStatus,
} from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { botTest, genericTestDestination, pickSiblings } from "../../bot/specs";
import { bitcoinPickingStrategy } from "./types";
import type {
  MutationSpec,
  AppSpec,
  TransactionTestInput,
} from "../../bot/types";
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
}: TransactionTestInput<Transaction>): void => {
  invariant(
    Date.now() - operation.date.getTime() < 1000000,
    "operation time to be recent"
  );

  // balance move
  botTest("account balance decreased with operation value", () =>
    expect(account.balance.toString()).toBe(
      accountBeforeTransaction.balance.minus(operation.value).toString()
    )
  );
  // inputs outputs
  const { txInputs, txOutputs } = status as TransactionStatus;
  invariant(txInputs, "tx inputs defined");
  invariant(txOutputs, "tx outputs defined");
  const { bitcoinResources } = accountBeforeTransaction as BitcoinAccount;
  invariant(bitcoinResources, "bitcoin resources");
  const nonDeterministicPicking =
    transaction.utxoStrategy.strategy === bitcoinPickingStrategy.OPTIMIZE_SIZE;

  // FIXME: we do this in unsorted way. there are changes of outputs ordering...
  const asSorted = (opShape: { senders: string[]; recipients: string[] }) => ({
    senders: opShape.senders.slice(0).sort(),
    recipients: opShape.recipients.slice(0).sort(),
  });

  botTest("operation matches tx senders and recipients", () => {
    if (transaction.opReturnData) {
      // transaction.recipient has format <coinId>:<address>
      const [, recipientAddress] = transaction.recipient.split(":");
      expect(operation.recipients).toContain(recipientAddress);
      expect(operation.recipients.length).toBe(2);
    } else {
      let expectedSenders = nonDeterministicPicking
        ? operation.senders
        : (txInputs!.map((t) => t.address).filter(Boolean) as string[]);

      let expectedRecipients = txOutputs!
        .filter((o) => o.address && !o.isChange)
        .map((o) => o.address) as string[];

      if (account.currency.id === "bitcoin_cash") {
        expectedSenders = expectedSenders.map(
          bchToCashaddrAddressWithoutPrefix
        );
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
    }
  });

  const utxosPicked = ((status as TransactionStatus).txInputs || [])
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
        (utxo) =>
          utxo &&
          utxo.blockHeight &&
          getUTXOStatus(utxo, transaction.utxoStrategy).excluded
      )
    ).toEqual([])
  );
};

const testDestination = genericTestDestination;

const genericMinimalAmount = new BigNumber(10000);

const bitcoinLikeMutations = ({
  minimalAmount = genericMinimalAmount,
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
      const transaction: Transaction = {
        ...bridge.createTransaction(account),
        feePerByte: new BigNumber(0.0001),
      };
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
        destination: sibling,
      };
    },
    testDestination,
    recoverBadTransactionStatus,
  },
  {
    name: "optimize-size",
    maxRun: 1,
    transaction: ({ account, siblings, bridge, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const transaction: Transaction = {
        ...bridge.createTransaction(account),
        feePerByte: new BigNumber(0.0001),
      };
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
        destination: sibling,
      };
    },
    testDestination,
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
      const transaction: Transaction = {
        ...bridge.createTransaction(account),
        feePerByte: new BigNumber(0.0001),
      };
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
        destination: sibling,
      };
    },
    recoverBadTransactionStatus,
    testDestination,
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
    name: "send OP_RETURN transaction",
    maxRun: 1,
    transaction: ({ account, bridge, siblings, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const { bitcoinResources } = account as BitcoinAccount;
      invariant(bitcoinResources, "bitcoin resources");

      const transaction: Transaction = {
        ...bridge.createTransaction(account),
        feePerByte: new BigNumber(0.0001),
        opReturnData: Buffer.from("charley loves heidi", "utf-8"),
      };

      return {
        transaction,
        updates: [
          {
            recipient: recipientVariation(sibling.freshAddress),
            amount: minimalAmount,
          },
          {
            utxoStrategy: {
              ...transaction.utxoStrategy,
            },
          },
        ],
        destination: sibling,
      };
    },
    recoverBadTransactionStatus,
    testDestination,
  },
  {
    name: "send max",
    maxRun: 1,
    transaction: ({ account, siblings, bridge, maxSpendable }) => {
      invariant(maxSpendable.gt(minimalAmount), "balance is too low");
      const sibling = pickSiblings(siblings, targetAccountSize);
      const recipient = recipientVariation(sibling.freshAddress);
      const transaction: Transaction = {
        ...bridge.createTransaction(account),
        feePerByte: new BigNumber(0),
      };
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
        destination: sibling,
      };
    },
    recoverBadTransactionStatus,
    testDestination,
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
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
  minViableAmount: genericMinimalAmount,
};
const bitcoinTestnet: AppSpec<Transaction> = {
  name: "Bitcoin Testnet",
  currency: getCryptoCurrencyById("bitcoin_testnet"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Bitcoin Test",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({ targetAccountSize: 8 }),
  minViableAmount: genericMinimalAmount,
};
const bitcoinGold: AppSpec<Transaction> = {
  name: "Bitcoin Gold",
  currency: getCryptoCurrencyById("bitcoin_gold"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "BitcoinGold",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
  minViableAmount: genericMinimalAmount,
};

const bchToCashaddrAddressWithoutPrefix = (recipient) =>
  bchaddrjs.toCashAddress(recipient).split(":")[1];

const bitcoinCash: AppSpec<Transaction> = {
  name: "Bitcoin Cash",
  currency: getCryptoCurrencyById("bitcoin_cash"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "BitcoinCash",
    appVersion: "2.1.0-rc",
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
  minViableAmount: genericMinimalAmount,
};
const peercoin: AppSpec<Transaction> = {
  name: "Peercoin",
  currency: getCryptoCurrencyById("peercoin"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Peercoin",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
  minViableAmount: genericMinimalAmount,
};
const pivx: AppSpec<Transaction> = {
  name: "PivX",
  currency: getCryptoCurrencyById("pivx"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "PivX",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
  minViableAmount: genericMinimalAmount,
};
const qtum: AppSpec<Transaction> = {
  name: "Qtum",
  currency: getCryptoCurrencyById("qtum"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Qtum",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
  minViableAmount: genericMinimalAmount,
};
const vertcoin: AppSpec<Transaction> = {
  name: "Vertcoin",
  currency: getCryptoCurrencyById("vertcoin"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Vertcoin",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
  minViableAmount: genericMinimalAmount,
};
const viacoin: AppSpec<Transaction> = {
  name: "Viacoin",
  currency: getCryptoCurrencyById("viacoin"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Viacoin",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations(),
  minViableAmount: genericMinimalAmount,
};
const minDash = parseCurrencyUnit(
  getCryptoCurrencyById("dash").units[0],
  "0.001"
);
const dash: AppSpec<Transaction> = {
  name: "Dash",
  currency: getCryptoCurrencyById("dash"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Dash",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: minDash,
  }),
  minViableAmount: minDash,
};
const minDoge = parseCurrencyUnit(
  getCryptoCurrencyById("dogecoin").units[0],
  "1"
);
const dogecoin: AppSpec<Transaction> = {
  name: "DogeCoin",
  currency: getCryptoCurrencyById("dogecoin"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Dogecoin",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: minDoge,
  }),
  minViableAmount: minDoge,
};
const minZcash = parseCurrencyUnit(
  getCryptoCurrencyById("zcash").units[0],
  "0.0002"
);
const zcash: AppSpec<Transaction> = {
  name: "ZCash",
  currency: getCryptoCurrencyById("zcash"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Zcash",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: minZcash,
  }),
  minViableAmount: minZcash,
};
const minHorizen = parseCurrencyUnit(
  getCryptoCurrencyById("zencash").units[0],
  "0.01"
);
const zencash: AppSpec<Transaction> = {
  name: "Horizen",
  currency: getCryptoCurrencyById("zencash"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Horizen",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: minHorizen,
  }),
  minViableAmount: minHorizen,
};
const minDigibyte = parseCurrencyUnit(
  getCryptoCurrencyById("digibyte").units[0],
  "0.1"
);
const digibyte: AppSpec<Transaction> = {
  name: "Digibyte",
  currency: getCryptoCurrencyById("digibyte"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Digibyte",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: minDigibyte,
  }),
  minViableAmount: minDigibyte,
};
const minKomodo = parseCurrencyUnit(
  getCryptoCurrencyById("komodo").units[0],
  "0.1"
);
const komodo: AppSpec<Transaction> = {
  name: "Komodo",
  currency: getCryptoCurrencyById("komodo"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Komodo",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    minimalAmount: minKomodo,
  }),
  minViableAmount: minKomodo,
};
const minDecred = parseCurrencyUnit(
  getCryptoCurrencyById("decred").units[0],
  "0.0001"
);
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
    minimalAmount: minDecred,
  }),
  minViableAmount: minDecred,
};
const minLitecoin = parseCurrencyUnit(
  getCryptoCurrencyById("litecoin").units[0],
  "0.001"
);
const litecoin: AppSpec<Transaction> = {
  name: "Litecoin",
  currency: getCryptoCurrencyById("litecoin"),
  dependency: "Bitcoin Legacy",
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Litecoin",
    appVersion: "2.1.0-rc",
  },
  genericDeviceAction: acceptTransaction,
  test: genericTest,
  mutations: bitcoinLikeMutations({
    targetAccountSize: 5,
    minimalAmount: minLitecoin,
  }),
  minViableAmount: minLitecoin,
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
  vertcoin,
  viacoin,
  zcash,
  zencash,
  decred,
};
