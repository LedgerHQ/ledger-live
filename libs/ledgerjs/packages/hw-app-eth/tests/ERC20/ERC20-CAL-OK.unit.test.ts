import axios from "axios";
import path from "path";
import fs from "fs/promises";
import { BigNumber } from "@ethersproject/bignumber";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { serialize as serializeTransaction, type Transaction } from "@ethersproject/transactions";
import SignatureCALEth from "../fixtures/SignatureCALEth";
import ledgerService from "../../src/services/ledger";
import Eth from "../../src/Eth";

const transaction: Transaction = {
  to: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  nonce: 14,
  gasPrice: BigNumber.from("0x06a2bb7d00"),
  gasLimit: BigNumber.from("0x01512c"),
  value: BigNumber.from("0x00"),
  data: "0xa9059cbb00000000000000000000000082ec3523f8a722694ca217ebfd95efbcadad77ee000000000000000000000000000000000000000000000002b5e3af16b1880000",
  chainId: 1,
};
const txHex = serializeTransaction(transaction).slice(2);

describe("ERC20 dynamic cal", () => {
  describe("ERC20 is in local CAL", () => {
    it("should be successfully signin transaction from dynamic CAL", async () => {
      jest.spyOn(axios, "get").mockImplementation(async () => ({ data: SignatureCALEth }));
      const apdusBuffer = await fs.readFile(
        path.resolve("./tests/fixtures/apdus/ERC20-OK.apdus"),
        "utf-8",
      );
      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));
      const resolutionConfig = { erc20: true };
      const resolution = await ledgerService.resolveTransaction(txHex, {}, resolutionConfig);
      const eth = new Eth(transport);
      const result = await eth.signTransaction("44'/60'/0'/0/0", txHex, resolution);

      expect(result).toMatchObject({
        v: "26",
        r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
        s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
      });
    });

    it("should be successfully signin transaction from local CAL", async () => {
      const apdusBuffer = await fs.readFile(
        path.resolve("./tests/fixtures/apdus/ERC20-OK.apdus"),
        "utf-8",
      );
      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));
      const resolutionConfig = { erc20: true };
      const resolution = await ledgerService.resolveTransaction(
        txHex,
        { cryptoassetsBaseURL: "notworking" },
        resolutionConfig,
      );

      const eth = new Eth(transport);
      const result = await eth.signTransaction("44'/60'/0'/0/0", txHex, resolution);

      expect(result).toMatchObject({
        v: "26",
        r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
        s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
      });
    });

    it("shouldn't break if the dynamic CAL is malformed", async () => {
      jest.spyOn(axios, "get").mockImplementationOnce(async () => ({ data: { 123: "ok" } })); // malformed response. Should be a string but here returning an object imcompatible w/ buffer.from
      const apdusBuffer = await fs.readFile(
        path.resolve("./tests/fixtures/apdus/ERC20-OK.apdus"),
        "utf-8",
      );
      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));
      const resolutionConfig = { erc20: true };
      const resolution = await ledgerService.resolveTransaction(
        txHex,
        { cryptoassetsBaseURL: "working" },
        resolutionConfig,
      );

      const eth = new Eth(transport);

      const result = await eth.signTransaction("44'/60'/0'/0/0", txHex, resolution);

      expect(result).toMatchObject({
        v: "26",
        r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
        s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
      });
    });
  });
});
