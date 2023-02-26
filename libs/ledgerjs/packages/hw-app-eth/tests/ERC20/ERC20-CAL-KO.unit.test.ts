import axios from "axios";
import fs from "fs/promises";
import path from "path";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import evms from "@ledgerhq/cryptoassets/data/evm/index";
import { EthAppPleaseEnableContractData } from "../../src/errors";
import SignatureCALEth from "../fixtures/SignatureCALEth";
import ledgerService from "../../src/services/ledger";
import Eth from "../../src/Eth";

const txHex =
  "f86a0e8506a2bb7d008301512c94005d1123878fc55fbd56b54c73963b234a64af3c80b844a9059cbb00000000000000000000000082ec3523f8a722694ca217ebfd95efbcadad77ee000000000000000000000000000000000000000000000002b5e3af16b1880000018080";
jest.mock("@ledgerhq/cryptoassets/data/evm/index", () => ({
  get signatures() {
    return {
      1: SignatureCALEth,
    };
  },
}));

describe("ERC20 dynamic cal", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("ERC20 is not in local CAL", () => {
    it("shouldn't break if the dynamic CAL is malformed", async () => {
      jest.spyOn(evms, "signatures", "get").mockReturnValueOnce({
        1: "",
      } as any);
      jest
        .spyOn(axios, "get")
        .mockImplementationOnce(async () => ({ data: { 123: "ok" } })); // malformed response. Should be a string but here returning an object imcompatible w/ buffer.from
      const apdusBuffer = await fs.readFile(
        path.resolve("./tests/fixtures/apdus/ERC20-KO.apdus"),
        "utf-8"
      );
      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );
      const resolutionConfig = { erc20: true };
      const resolution = await ledgerService.resolveTransaction(
        txHex,
        { cryptoassetsBaseURL: "working" },
        resolutionConfig
      );

      const eth = new Eth(transport);

      try {
        await eth.signTransaction("44'/60'/0'/0/0", txHex, resolution);
        fail();
      } catch (e) {
        expect(e).toStrictEqual(
          new EthAppPleaseEnableContractData(
            "Please enable Blind signing or Contract data in the Ethereum app Settings"
          )
        );
      }
    });

    it("should ask for blind sign if not in dynamic & local CAL", async () => {
      jest.spyOn(evms, "signatures", "get").mockReturnValueOnce({
        1: "",
      } as any);

      const apdusBuffer = await fs.readFile(
        path.resolve("./tests/fixtures/apdus/ERC20-KO.apdus"),
        "utf-8"
      );
      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );
      const resolutionConfig = { erc20: true };
      const resolution = await ledgerService.resolveTransaction(
        txHex,
        { cryptoassetsBaseURL: "notworking" },
        resolutionConfig
      );

      const eth = new Eth(transport);

      try {
        await eth.signTransaction("44'/60'/0'/0/0", txHex, resolution);
        fail();
      } catch (e) {
        expect(e).toStrictEqual(
          new EthAppPleaseEnableContractData(
            "Please enable Blind signing or Contract data in the Ethereum app Settings"
          )
        );
      }
    });

    it("should be successfully signin transaction from dynamic CAL", async () => {
      const apdusBuffer = await fs.readFile(
        path.resolve("./tests/fixtures/apdus/ERC20-OK.apdus"),
        "utf-8"
      );
      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );
      const resolutionConfig = { erc20: true };
      const resolution = await ledgerService.resolveTransaction(
        txHex,
        {},
        resolutionConfig
      );
      const eth = new Eth(transport);
      const result = await eth.signTransaction(
        "44'/60'/0'/0/0",
        txHex,
        resolution
      );

      expect(result).toMatchObject({
        v: "26",
        r: "006c000371dc04c5752287a9901b1fac4b069eb1410173db39c407ae725e4a6e",
        s: "4f445c94cc869f01e194478a3b876052716ae7676247664acec371b6e6ad16e4",
      });
    });
  });
});
