import BigNumber from "bignumber.js";
import * as rlp from "@ethersproject/rlp";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber as EthersBigNumber } from "@ethersproject/bignumber";
import { type Transaction, serialize as serializeTransaction } from "@ethersproject/transactions";
import {
  getChainIdAsUint32,
  getParity,
  getV,
  hexBuffer,
  intAsHexBytes,
  maybeHexBuffer,
  mergeResolutions,
  padHexString,
  safeChunkTransaction,
  splitPath,
} from "../src/utils";

const chainIdsToTest = [
  "1", // Always test Ethereum mainnet
  "56", // Binance Smart Chain
  "134", // Polygon
  "109", // just under the limit for the EIP-155 operation to potentially be more than 1 byte
  "110", // floor limit for the EIP-155 operation to be more than 1 byte if v is 1
  "111", // floor limit for the EIP-155 operation to be more than 1 byte even if v is 0
  "10000", // Random high value
  "2716446429837000", // highest chainId known
];

describe("Eth app biding", () => {
  describe("Utils", () => {
    describe("padHexString", () => {
      it("should prevent hex string from being odd length", () => {
        expect(padHexString("123")).toEqual("0123");
      });
    });

    describe("splitPath", () => {
      it("should split derivation path correctly and respect hardened paths", () => {
        expect(splitPath("44'/60'/123/456/789")).toEqual([
          44 + 0x80000000,
          60 + 0x80000000,
          123,
          456,
          789,
        ]);
      });
    });

    describe("hexBuffer", () => {
      it("should convert hex string to buffer", () => {
        const buff = Buffer.from("0123", "hex");
        expect(hexBuffer("0x123")).toEqual(buff);
        expect(hexBuffer("123")).toEqual(buff);
        expect(hexBuffer("0123")).toEqual(buff);
      });
    });

    describe("maybeHexBuffer", () => {
      it("should bufferize hex string and return null for empty input", () => {
        expect(maybeHexBuffer("0x123")).toEqual(Buffer.from("0123", "hex"));
        expect(maybeHexBuffer("")).toEqual(null);
      });
    });

    describe("intAsHexBytes", () => {
      it("should convert integer to hex string with correct number of bytes", () => {
        expect(intAsHexBytes(123, 1)).toEqual("7b");
        expect(intAsHexBytes(123, 2)).toEqual("007b");
        expect(intAsHexBytes(123, 4)).toEqual("0000007b");
      });
    });

    describe("mergeResolutions", () => {
      it("should merge resolutions", () => {
        const resolutions1 = {
          nfts: ["nft1", "nft2"],
          erc20Tokens: ["erc20Token1", "erc20Token2"],
          externalPlugin: [{ payload: "payload1", signature: "signature1" }],
          plugin: ["plugin1", "plugin2"],
          domains: [
            {
              registry: "ens" as const,
              domain: "dev.0xkvn.eth",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              type: "forward" as const,
            },
          ],
        };
        const resolutions2 = {
          nfts: ["nft3", "nft4"],
          erc20Tokens: ["erc20Token3", "erc20Token4"],
          externalPlugin: [{ payload: "payload2", signature: "signature2" }],
          plugin: ["plugin3", "plugin4"],
          domains: [
            {
              registry: "ens" as const,
              domain: "0xkvn.eth",
              address: "0xB0xB0b5B0106D69fE64545A60A68C014f7570D3F861",
              type: "reverse" as const,
            },
          ],
        };
        expect(mergeResolutions([resolutions1, resolutions2])).toEqual({
          nfts: ["nft1", "nft2", "nft3", "nft4"],
          erc20Tokens: ["erc20Token1", "erc20Token2", "erc20Token3", "erc20Token4"],
          externalPlugin: [
            { payload: "payload1", signature: "signature1" },
            { payload: "payload2", signature: "signature2" },
          ],
          plugin: ["plugin1", "plugin2", "plugin3", "plugin4"],
          domains: [
            {
              registry: "ens",
              domain: "dev.0xkvn.eth",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              type: "forward",
            },
            {
              registry: "ens",
              domain: "0xkvn.eth",
              address: "0xB0xB0b5B0106D69fE64545A60A68C014f7570D3F861",
              type: "reverse",
            },
          ],
        });
      });
    });

    describe("getParity", () => {
      it("should return the v from the device for typed transactions (EIP-2718)", () => {
        expect(getParity(0, new BigNumber(1), 1)).toEqual(0);
        expect(getParity(1, new BigNumber(1), 1)).toEqual(1);
        expect(getParity(0, new BigNumber(1), 2)).toEqual(0);
        expect(getParity(1, new BigNumber(1), 2)).toEqual(1);
      });

      it.each(chainIdsToTest)(
        "should return the v from the device for legacy transactions (EIP-155) with chainId: %s",
        (chainId: string) => {
          const chainIdBN = new BigNumber(chainId);
          const chainIdUint4 = parseInt(
            Buffer.from(padHexString(chainIdBN.toString(16)), "hex")
              .subarray(0, 4)
              .toString("hex"),
            16,
          );
          const chainIdWithEIP155 = chainIdUint4 * 2 + 35;

          expect([
            getParity(chainIdWithEIP155 % 256, chainIdBN, null),
            getParity((chainIdWithEIP155 + 1) % 256, chainIdBN, null),
          ]).toEqual([0, 1]);
        },
      );
    });

    describe("getChainIdAsUint32", () => {
      it("should return the chainId as a 4 bytes integer", () => {
        expect(getChainIdAsUint32(1)).toEqual(1);
        expect(getChainIdAsUint32(134)).toEqual(134);
        expect(getChainIdAsUint32(new BigNumber(134))).toEqual(134);
        expect(getChainIdAsUint32(new BigNumber(10_000_000_000))).toEqual(39062500);
        expect(getChainIdAsUint32(10_000_000_000)).toEqual(39062500);
      });
    });

    describe("getV", () => {
      it("should return the v value from the device for legacy transactions non providing a chainId", () => {
        expect(getV(27, new BigNumber(0), null)).toEqual((27).toString(16));
        expect(getV(28, new BigNumber(0), null)).toEqual((28).toString(16));
      });

      it.each(chainIdsToTest)(
        "should return the v with EIP-155 applied for legacy transactions providing chainId: %s",
        (chainId: string) => {
          const chainIdBN = new BigNumber(chainId);
          const chainIdUint4 = parseInt(
            Buffer.from(padHexString(chainIdBN.toString(16)), "hex")
              .subarray(0, 4)
              .toString("hex"),
            16,
          );
          const chainIdWithEIP155 = chainIdUint4 * 2 + 35;
          const vEven = chainIdWithEIP155 % 256;
          const vOdd = (chainIdWithEIP155 + 1) % 256;

          expect(getV(vEven, chainIdBN, null)).toEqual(
            padHexString(chainIdBN.multipliedBy(2).plus(35).toString(16)),
          );
          expect(getV(vOdd, chainIdBN, null)).toEqual(
            padHexString(chainIdBN.multipliedBy(2).plus(35).plus(1).toString(16)),
          );
        },
      );

      it.each(chainIdsToTest)(
        "should return the parity for transactions using EIP-2718 and no matter the chainId: %s",
        (chainId: string) => {
          const chainIdBN = new BigNumber(chainId);
          expect(getV(0, chainIdBN, 1)).toEqual("00");
          expect(getV(1, chainIdBN, 1)).toEqual("01");
          expect(getV(0, chainIdBN, 2)).toEqual("00");
          expect(getV(1, chainIdBN, 2)).toEqual("01");
        },
      );

      it("should throw an error if the v value is invalid", () => {
        expect(() => getV(26, new BigNumber(10_000), null)).toThrow("Invalid v value");
      });
    });

    describe("safeChunkTransaction", () => {
      // Derivation of 44'/60'/0'/0'/0
      // 21B
      const derivationPathBuff = Buffer.from("058000002c8000003c800000008000000000000000", "hex");

      it("should return a single chunk if the transaction is small enough", () => {
        const rawTx: Transaction = {
          to: AddressZero,
          nonce: 0,
          value: EthersBigNumber.from(0),
          gasPrice: EthersBigNumber.from(1),
          gasLimit: EthersBigNumber.from(2),
          data: "0x",
          chainId: 1,
        };
        const serialized = serializeTransaction(rawTx);
        const rlpBuff = Buffer.from(serialized.slice(2), "hex");

        if (rlpBuff.length + derivationPathBuff.length > 255)
          throw new Error("Transaction too big");

        const payload = Buffer.concat([derivationPathBuff, rlpBuff]);
        expect(safeChunkTransaction(rlpBuff, derivationPathBuff, rawTx.type)).toEqual([payload]);
      });

      it("should return multiple 255B chunks for typed transactions (EIP-2718)", () => {
        const rawTx: Transaction = {
          to: AddressZero,
          nonce: 0,
          value: EthersBigNumber.from(0),
          gasPrice: EthersBigNumber.from(1),
          gasLimit: EthersBigNumber.from(2),
          data: "0x" + new Array(256).fill("00").join(""),
          chainId: 1,
          type: 1,
        };
        const serialized = serializeTransaction(rawTx);
        const rlpBuff = Buffer.from(serialized.slice(2), "hex");

        if (rlpBuff.length + derivationPathBuff.length < 255)
          throw new Error("Transaction too small");

        // Chunk size should be 255B
        const payload = Buffer.concat([derivationPathBuff, rlpBuff]);
        const chunks = safeChunkTransaction(rlpBuff, derivationPathBuff, rawTx.type);
        expect(chunks.length).toEqual(2);
        expect(chunks).toEqual([payload.subarray(0, 255), payload.subarray(255)]);
      });

      it("should return multiple variable chunks for legacy transactions to prevent chunking just before the [r,s,v] for a 1 byte chainId", () => {
        const rawTx: Transaction = {
          to: AddressZero,
          nonce: 0,
          value: EthersBigNumber.from(0),
          gasPrice: EthersBigNumber.from(1),
          gasLimit: EthersBigNumber.from(2),
          data: "0x" + new Array(458).fill("00").join(""),
          chainId: 127, // RLP of VRS should be only 3B as this value is <= 0x7f
          type: 0,
        };
        const serialized = serializeTransaction(rawTx);
        const rlpBuff = Buffer.from(serialized.slice(2), "hex");

        if (rlpBuff.length + derivationPathBuff.length !== 513)
          throw new Error("Transaction not chunking before the [r,s,v]");

        // Chunk size should be 254B to avoid chunking just before the [r,s,v]
        const payload = Buffer.concat([derivationPathBuff, rlpBuff]);
        const chunks = safeChunkTransaction(rlpBuff, derivationPathBuff, rawTx.type);
        expect(chunks.length).toEqual(3);
        expect(chunks).toEqual([
          payload.subarray(0, 254),
          payload.subarray(254, 508),
          payload.subarray(508),
        ]);
      });

      // Above 6 bytes values, ethers will simply fail parsing/serializing the transaction
      it.each([1, 2, 3, 4, 5, 6])(
        "should return multiple variable chunks for legacy transactions to prevent chunking just before the [r,s,v] for a %s byte(s) chainId",
        (chainIdSizeInBytes: number) => {
          const chainId = new BigNumber("0x" + new Array(chainIdSizeInBytes).fill("81").join(""));
          const encodedVrs = hexBuffer(
            rlp.encode(["0x" + chainId.toString(16), "0x", "0x"]),
          ).subarray(1);

          for (let i = 1; i <= encodedVrs.length; i++) {
            const rawTx: Transaction = {
              to: AddressZero,
              nonce: 0,
              value: EthersBigNumber.from(0),
              gasPrice: EthersBigNumber.from(1),
              gasLimit: EthersBigNumber.from(2),
              data: "0x" + new Array(458 - chainIdSizeInBytes).fill("00").join(""), // This should make a 492B long rlp
              chainId: chainId.toNumber(),
              type: 0,
            };
            const serialized = serializeTransaction(rawTx);
            const rlpBuff = Buffer.from(serialized.slice(2), "hex");

            if (rlpBuff.length + derivationPathBuff.length !== 513)
              throw new Error("Transaction not chunking before the [r,s,v]");

            // Just made from observation, don't treat this as a general rule
            const chunkSize =
              chainIdSizeInBytes < 3
                ? 255 - chainIdSizeInBytes
                : chainIdSizeInBytes < 5
                  ? 256 - chainIdSizeInBytes
                  : 257 - chainIdSizeInBytes;
            const chunks = safeChunkTransaction(rlpBuff, derivationPathBuff, rawTx.type);
            expect(chunks.length).toEqual(3);
            expect(
              [`0000` + encodedVrs.toString("hex"), `00` + encodedVrs.toString("hex")].includes(
                chunks[2].toString("hex"),
              ),
            ).toBe(true);
            const payload = Buffer.concat([derivationPathBuff, rlpBuff]);
            expect(safeChunkTransaction(rlpBuff, derivationPathBuff, rawTx.type)).toEqual([
              payload.subarray(0, chunkSize),
              payload.subarray(chunkSize, chunkSize * 2),
              payload.subarray(chunkSize * 2),
            ]);
          }
        },
      );
    });
  });
});
