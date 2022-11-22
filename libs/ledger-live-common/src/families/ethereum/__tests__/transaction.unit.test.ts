import createTransaction from "../createTransaction";
import { fromAccountRaw } from "../../../account";
import { ethereum1 } from "../datasets/ethereum1";
import { Transaction } from "../types";
import { modes } from "../modules";
import { fail } from "assert";

const account = fromAccountRaw(ethereum1);

describe("Ethereum transaction tests", () => {
  describe("modules", () => {
    describe("fillTransactionData", () => {
      describe("ERC1155", () => {
        const mode = modes["erc1155.transfer"];
        it("should not break on transaction quantities filled with null values", () => {
          const transaction: Transaction = {
            ...createTransaction(),
            recipient: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE",
            collection: "0x348fc118bcc65a92dc033a951af153d14d945312",
            tokenIds: ["0", "1"],
            quantities: [null],
          };
          const txData = {};

          try {
            mode.fillTransactionData(account, transaction, txData);
            expect(txData).toEqual({
              data: "0x2eb2c2d60000000000000000000000000e3f0bb9516f01f2c34c25e0957518b8ac9414c5000000000000000000000000c3f95102d5c8f2c83e49ce3acfb905edfb7f37de00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000043078303000000000000000000000000000000000000000000000000000000000",
              to: transaction.collection,
              value: "0x00",
            });
          } catch (e) {
            fail(e as Error);
          }
        });
      });
      describe("ERC721", () => {
        const mode = modes["erc721.transfer"];
        it("should not break on transaction quantities filled with null values", () => {
          const transaction: Transaction = {
            ...createTransaction(),
            recipient: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE",
            collection: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
            tokenIds: ["1"],
            quantities: [null],
          };
          const txData = {};

          try {
            mode.fillTransactionData(account, transaction, txData);
            expect(txData).toEqual({
              data: "0xb88d4fde0000000000000000000000000e3f0bb9516f01f2c34c25e0957518b8ac9414c5000000000000000000000000c3f95102d5c8f2c83e49ce3acfb905edfb7f37de0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000043078303000000000000000000000000000000000000000000000000000000000",
              to: transaction.collection,
              value: "0x00",
            });
          } catch (e) {
            fail(e as Error);
          }
        });
      });
    });
  });
});
