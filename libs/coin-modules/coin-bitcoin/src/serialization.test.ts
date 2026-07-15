import BigNumber from "bignumber.js";
import "./chain-adapters/zcash"; // register zcash adapter for serialization tests
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import {
  BitcoinAccount,
  BitcoinAccountRaw,
  BitcoinOutput,
  BitcoinOutputRaw,
  ZcashAccount,
  ZcashAccountRaw,
} from "./types";
import {
  DecryptedOutput,
  DecryptedOutputRaw,
  ShieldedTransaction,
  ShieldedTransactionRaw,
  ZcashPrivateInfo,
  ZcashPrivateInfoRaw,
} from "./chain-adapters/zcash/types";

const privateInfoMock: ZcashPrivateInfo = {
  saplingBalance: new BigNumber("2"),
  orchardBalance: new BigNumber("4"),
  ufvk: "uview123...",
  syncState: "running",
  birthday: "",
  lastProcessedBlock: 1,
  lastSyncTimestamp: 123,
  transactions: [],
  progress: 0,
  estimatedTimeRemaining: { hours: 0, minutes: 0 },
};

const privateInfoRawMock: ZcashPrivateInfoRaw = {
  saplingBalance: "2",
  orchardBalance: "4",
  ufvk: "uview123...",
  syncState: "running",
  birthday: "",
  lastProcessedBlock: 1,
  lastSyncTimestamp: 123,
  transactions: [],
  progress: 0,
  estimatedTimeRemaining: { hours: 0, minutes: 0 },
};

const shieldedTransactionMock: ShieldedTransaction = {
  id: "",
  hex: "",
  blockHeight: 1,
  blockHash: "",
  timestamp: 1,
  fee: new BigNumber("2"),
  decryptedData: {
    orchard_outputs: [],
    sapling_outputs: [],
  },
};

const shieldedTransactionRawMock: ShieldedTransactionRaw = {
  id: "",
  hex: "",
  blockHeight: 1,
  blockHash: "",
  timestamp: 1,
  fee: "2",
  decryptedData: {
    orchard_outputs: [],
    sapling_outputs: [],
  },
};

const decryptedOutputMock: DecryptedOutput[] = [
  {
    memo: "",
    transfer_type: "incoming",
    amount: new BigNumber("7"),
  },
];

const decryptedOutputRawMock: DecryptedOutputRaw[] = [
  {
    memo: "",
    transfer_type: "incoming",
    amount: "7",
  },
];

describe("assignToAccountRaw", () => {
  let accountMock: BitcoinAccount = {} as BitcoinAccount;
  let accountRawMock: BitcoinAccountRaw = {} as BitcoinAccountRaw;
  let accountZcashMock: ZcashAccount = {} as ZcashAccount;
  let accountZcashRawMock: ZcashAccountRaw = {} as ZcashAccountRaw;

  beforeEach(() => {
    accountMock = {} as BitcoinAccount;
    accountRawMock = {} as BitcoinAccountRaw;
  });

  beforeEach(() => {
    accountZcashMock = { currency: { id: "zcash" } } as unknown as ZcashAccount;
    accountZcashRawMock = { currency: { id: "zcash" } } as unknown as ZcashAccountRaw;
  });

  describe("when bitcoinResources is defined", () => {
    it("should transfer utxos to accountRaw", () => {
      accountMock.bitcoinResources = {
        utxos: [],
      };
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.bitcoinResources).not.toEqual(undefined);
    });

    it("should convert utxos to accountRaw in the right order", () => {
      const firstUtxoHash = "firstUtxo";
      const secondUtxoHash = "secondUtxo";
      accountMock.bitcoinResources = {
        utxos: [
          { hash: firstUtxoHash, value: new BigNumber(1) },
          { hash: secondUtxoHash, value: new BigNumber(2) },
        ] as BitcoinOutput[],
      };
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.bitcoinResources.utxos[0][0]).toEqual(
        accountMock.bitcoinResources.utxos[0].hash,
      );
      expect(accountRawMock.bitcoinResources.utxos[1][0]).toEqual(
        accountMock.bitcoinResources.utxos[1].hash,
      );
    });

    it("should transfer account raw values correctly", () => {
      accountMock.bitcoinResources = {
        utxos: [
          {
            hash: "firstUtxo",
            value: new BigNumber(17),
            outputIndex: 42,
            blockHeight: 10,
            address: "address",
          },
        ] as BitcoinOutput[],
      };
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.bitcoinResources.utxos[0][0]).toEqual(
        accountMock.bitcoinResources.utxos[0].hash,
      );
      expect(accountRawMock.bitcoinResources.utxos[0][1]).toEqual(
        accountMock.bitcoinResources.utxos[0].outputIndex,
      );
      expect(accountRawMock.bitcoinResources.utxos[0][2]).toEqual(
        accountMock.bitcoinResources.utxos[0].blockHeight,
      );
      expect(accountRawMock.bitcoinResources.utxos[0][3]).toEqual(
        accountMock.bitcoinResources.utxos[0].address,
      );
      expect(accountRawMock.bitcoinResources.utxos[0][4]).toEqual(
        accountMock.bitcoinResources.utxos[0].value.toString(),
      );
    });
  });

  describe("when bitcoinResources isn't defined", () => {
    it("shouldn't edit raw account", () => {
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.bitcoinResources).toEqual(undefined);
    });
  });

  describe("when privateInfo is defined", () => {
    it("should include privateInfo", () => {
      accountZcashMock.privateInfo = privateInfoMock;
      assignToAccountRaw(accountZcashMock, accountZcashRawMock);
      expect(accountZcashRawMock.privateInfo).toEqual(privateInfoRawMock);
    });

    it("should include privateInfo, and convert shielded balances", () => {
      accountZcashMock.privateInfo = privateInfoMock;
      assignToAccountRaw(accountZcashMock, accountZcashRawMock);
      expect(accountZcashRawMock.privateInfo).toEqual(privateInfoRawMock);
    });

    it("should shielded transactions, when present", () => {
      accountZcashMock.privateInfo = {
        ...privateInfoMock,
        transactions: [shieldedTransactionMock],
      };
      assignToAccountRaw(accountZcashMock, accountZcashRawMock);
      expect(accountZcashRawMock.privateInfo).toEqual({
        ...privateInfoRawMock,
        transactions: [shieldedTransactionRawMock],
      });
    });

    it("should include decrypted actions, when present", () => {
      accountZcashMock.privateInfo = {
        ...privateInfoMock,
        transactions: [
          {
            ...shieldedTransactionMock,
            decryptedData: {
              orchard_outputs: decryptedOutputMock,
              sapling_outputs: decryptedOutputMock,
            },
          },
        ],
      };
      assignToAccountRaw(accountZcashMock, accountZcashRawMock);
      expect(accountZcashRawMock.privateInfo).toEqual({
        ...privateInfoRawMock,
        transactions: [
          {
            ...shieldedTransactionRawMock,
            decryptedData: {
              orchard_outputs: decryptedOutputRawMock,
              sapling_outputs: decryptedOutputRawMock,
            },
          },
        ],
      });
    });
  });

  describe("when privateInfo isn't defined", () => {
    it("should not include privateInfo", () => {
      delete accountZcashMock.privateInfo;
      assignToAccountRaw(accountZcashMock, accountZcashRawMock);
      expect(accountZcashRawMock.privateInfo).toBeUndefined();
    });
  });
});

describe("assignFromAccountRaw", () => {
  let accountMock: BitcoinAccount = {} as BitcoinAccount;
  let accountRawMock: BitcoinAccountRaw = {} as BitcoinAccountRaw;
  let accountZcashMock: ZcashAccount = {} as ZcashAccount;
  let accountZcashRawMock: ZcashAccountRaw = {} as ZcashAccountRaw;

  beforeEach(() => {
    accountMock = {} as BitcoinAccount;
    accountRawMock = {} as BitcoinAccountRaw;
  });

  beforeEach(() => {
    accountZcashMock = { currency: { id: "zcash" } } as unknown as ZcashAccount;
    accountZcashRawMock = { currency: { id: "zcash" } } as unknown as ZcashAccountRaw;
  });

  describe("when bitcoinResources is defined", () => {
    it("should transfer utxos to account", () => {
      accountRawMock.bitcoinResources = {
        utxos: [],
      };
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.bitcoinResources).not.toEqual(undefined);
    });

    it("should convert utxos to accountRaw in the right order", () => {
      accountRawMock.bitcoinResources = {
        utxos: [
          ["firstUtxo", 42, 10, "address", "17", 0, 0],
          ["secondUtxo", 42, 10, "address", "17", 0, 0],
        ] as BitcoinOutputRaw[],
      };
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.bitcoinResources.utxos[0].hash).toEqual(
        accountRawMock.bitcoinResources.utxos[0][0],
      );
      expect(accountMock.bitcoinResources.utxos[1].hash).toEqual(
        accountRawMock.bitcoinResources.utxos[1][0],
      );
    });

    it("should convert utxos to account", () => {
      accountRawMock.bitcoinResources = {
        utxos: [["firstUtxo", 42, 10, "address", "17", 0, 0]] as BitcoinOutputRaw[],
      };
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.bitcoinResources.utxos[0].hash).toEqual(
        accountRawMock.bitcoinResources.utxos[0][0],
      );
      expect(accountMock.bitcoinResources.utxos[0].outputIndex).toEqual(
        accountRawMock.bitcoinResources.utxos[0][1],
      );
      expect(accountMock.bitcoinResources.utxos[0].blockHeight).toEqual(
        accountRawMock.bitcoinResources.utxos[0][2],
      );
      expect(accountMock.bitcoinResources.utxos[0].address).toEqual(
        accountRawMock.bitcoinResources.utxos[0][3],
      );
      expect(accountMock.bitcoinResources.utxos[0].value).toEqual(
        new BigNumber(accountRawMock.bitcoinResources.utxos[0][4]),
      );
    });
  });

  describe("when bitcoinResources isn't defined", () => {
    it("shouldn't edit raw account", () => {
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.bitcoinResources).toEqual(undefined);
    });
  });

  describe("when privateInfo is defined", () => {
    it("should include privateInfo", () => {
      accountZcashRawMock.privateInfo = privateInfoRawMock;
      assignFromAccountRaw(accountZcashRawMock, accountZcashMock);
      expect(accountZcashMock.privateInfo).toEqual(privateInfoMock);
    });

    it("should include privateInfo, and convert shielded balances", () => {
      accountZcashRawMock.privateInfo = privateInfoRawMock;
      assignFromAccountRaw(accountZcashRawMock, accountZcashMock);
      expect(accountZcashMock.privateInfo).toEqual(privateInfoMock);
    });

    it("should include shielded transactions, when present", () => {
      accountZcashRawMock.privateInfo = {
        ...privateInfoRawMock,
        transactions: [shieldedTransactionRawMock],
      };
      assignFromAccountRaw(accountZcashRawMock, accountZcashMock);
      expect(accountZcashMock.privateInfo).toEqual({
        ...privateInfoMock,
        transactions: [shieldedTransactionMock],
      });
    });

    it("should include decrypted actions, when present", () => {
      accountZcashRawMock.privateInfo = {
        ...privateInfoRawMock,
        transactions: [
          {
            ...shieldedTransactionRawMock,
            decryptedData: {
              orchard_outputs: decryptedOutputRawMock,
              sapling_outputs: decryptedOutputRawMock,
            },
          },
        ],
      };
      assignFromAccountRaw(accountZcashRawMock, accountZcashMock);
      expect(accountZcashMock.privateInfo).toEqual({
        ...privateInfoMock,
        transactions: [
          {
            ...shieldedTransactionMock,
            decryptedData: {
              orchard_outputs: decryptedOutputMock,
              sapling_outputs: decryptedOutputMock,
            },
          },
        ],
      });
    });
  });

  describe("when privateInfo isn't defined", () => {
    it("should not include privateInfo", () => {
      delete accountZcashMock.privateInfo;
      assignFromAccountRaw(accountZcashRawMock, accountZcashMock);
      expect(accountZcashMock.privateInfo).toBeUndefined();
    });
  });
});
