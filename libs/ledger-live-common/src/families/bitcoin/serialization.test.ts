import BigNumber from "bignumber.js";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import {
  BitcoinAccount,
  BitcoinAccountRaw,
  BitcoinOutput,
  BitcoinOutputRaw,
} from "./types";

describe("assignToAccountRaw", () => {
  let accountMock: BitcoinAccount = {} as BitcoinAccount;
  let accountRawMock: BitcoinAccountRaw = {} as BitcoinAccountRaw;

  beforeEach(() => {
    accountMock = {} as BitcoinAccount;
    accountRawMock = {} as BitcoinAccountRaw;
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
        accountMock.bitcoinResources.utxos[0].hash
      );
      expect(accountRawMock.bitcoinResources.utxos[1][0]).toEqual(
        accountMock.bitcoinResources.utxos[1].hash
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
        accountMock.bitcoinResources.utxos[0].hash
      );
      expect(accountRawMock.bitcoinResources.utxos[0][1]).toEqual(
        accountMock.bitcoinResources.utxos[0].outputIndex
      );
      expect(accountRawMock.bitcoinResources.utxos[0][2]).toEqual(
        accountMock.bitcoinResources.utxos[0].blockHeight
      );
      expect(accountRawMock.bitcoinResources.utxos[0][3]).toEqual(
        accountMock.bitcoinResources.utxos[0].address
      );
      expect(accountRawMock.bitcoinResources.utxos[0][4]).toEqual(
        accountMock.bitcoinResources.utxos[0].value.toString()
      );
    });
  });

  describe("when bitcoinResources isn't defined", () => {
    it("shouldn't edit raw account", () => {
      assignToAccountRaw(accountMock, accountRawMock);
      expect(accountRawMock.bitcoinResources).toEqual(undefined);
    });
  });
});

describe("assignFromAccountRaw", () => {
  let accountMock: BitcoinAccount = {} as BitcoinAccount;
  let accountRawMock: BitcoinAccountRaw = {} as BitcoinAccountRaw;

  beforeEach(() => {
    accountMock = {} as BitcoinAccount;
    accountRawMock = {} as BitcoinAccountRaw;
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
        accountRawMock.bitcoinResources.utxos[0][0]
      );
      expect(accountMock.bitcoinResources.utxos[1].hash).toEqual(
        accountRawMock.bitcoinResources.utxos[1][0]
      );
    });

    it("should convert utxos to account", () => {
      accountRawMock.bitcoinResources = {
        utxos: [
          ["firstUtxo", 42, 10, "address", "17", 0, 0],
        ] as BitcoinOutputRaw[],
      };
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.bitcoinResources.utxos[0].hash).toEqual(
        accountRawMock.bitcoinResources.utxos[0][0]
      );
      expect(accountMock.bitcoinResources.utxos[0].outputIndex).toEqual(
        accountRawMock.bitcoinResources.utxos[0][1]
      );
      expect(accountMock.bitcoinResources.utxos[0].blockHeight).toEqual(
        accountRawMock.bitcoinResources.utxos[0][2]
      );
      expect(accountMock.bitcoinResources.utxos[0].address).toEqual(
        accountRawMock.bitcoinResources.utxos[0][3]
      );
      expect(accountMock.bitcoinResources.utxos[0].value).toEqual(
        new BigNumber(accountRawMock.bitcoinResources.utxos[0][4])
      );
    });
  });

  describe("when bitcoinResources isn't defined", () => {
    it("shouldn't edit raw account", () => {
      assignFromAccountRaw(accountRawMock, accountMock);
      expect(accountMock.bitcoinResources).toEqual(undefined);
    });
  });
});
