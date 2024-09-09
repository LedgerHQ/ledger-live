import BigNumber from "bignumber.js";
import { hexBuffer, padHexString } from "../../src/utils";
import {
  constructTypeDescByteString,
  destructTypeFromString,
  EIP712_TYPE_ENCODERS,
  getAppAndVersion,
  getCoinRefTokensMap,
  getFilterDisplayNameAndSigBuffers,
  getPayloadForFilterV2,
  makeTypeEntryStructBuffer,
} from "../../src/modules/EIP712/utils";

const convertTwosComplementToDecimalString = (hex: string, initialValue: string) => {
  if (!initialValue?.startsWith("-")) {
    return new BigNumber(padHexString(hex), 16).toFixed();
  }

  const hexAsBN = new BigNumber(padHexString(hex), 16);
  const maskAsBN = new BigNumber(Buffer.alloc(hex.length / 2, 0xff).toString("hex"), 16);

  return hexAsBN.minus(maskAsBN).minus(1).toFixed();
};

describe("EIP712", () => {
  describe("Utils", () => {
    describe("destructTypeFromString", () => {
      test("'string[]' should return [{name: 'string', size: undefined}, [null]]", () => {
        expect(destructTypeFromString("string[]")).toEqual([
          { name: "string", size: undefined },
          [null],
        ]);
      });

      test("'uint8[2][][4]' should return [{name: 'uint', size: 8}, [2, null, 4]]", () => {
        expect(destructTypeFromString("uint8[2][][4]")).toEqual([
          { name: "uint", size: 8 },
          [2, null, 4],
        ]);
      });

      test("'bytes64' should return [{ name: 'bytes', size: 64 }, []]", () => {
        expect(destructTypeFromString("bytes64")).toEqual([{ name: "bytes", size: 64 }, []]);
      });

      test("'bool' should return [{ name: 'bool', size: undefined }, []]", () => {
        expect(destructTypeFromString("bool")).toEqual([{ name: "bool", size: undefined }, []]);
      });

      test("'bool[any]' should not throw and return ['bool', []]", () => {
        expect(destructTypeFromString("bool[any]")).toEqual([
          { name: "bool", size: undefined },
          [],
        ]);
      });

      test("V2DutchOrder should not be splitted even though it contains a number not related to the size", () => {
        expect(destructTypeFromString("V2DutchOrder")).toEqual([
          { name: "V2DutchOrder", size: undefined },
          [],
        ]);
      });

      test("KvnV2 should not be splitted even though it contains a number at the end not related to the size", () => {
        expect(destructTypeFromString("KvnV2")).toEqual([{ name: "KvnV2", size: undefined }, []]);
      });

      test("should not throw with undefined", () => {
        expect(destructTypeFromString(undefined)).toEqual([null, []]);
      });
    });

    describe("constructTypeDescByteString", () => {
      const bitwiseImplem = (isArray: boolean, typeSize: number | null, typeValue) =>
        (Number(isArray) << 7) | (Number(typeSize !== null) << 6) | typeValue;

      test("should return 1 as hex int and 01 as hexa string", () => {
        expect(parseInt(constructTypeDescByteString(false, null, 1), 16)).toEqual(1);
        expect(constructTypeDescByteString(false, null, 1)).toEqual("01");
      });

      test("should return 129 as hex int and 81 as hexa string", () => {
        expect(parseInt(constructTypeDescByteString(true, null, 1), 16)).toEqual(129);
        expect(constructTypeDescByteString(true, null, 1)).toEqual("81");
      });

      test("should return 193 as hex int and c1 as hexa string", () => {
        expect(parseInt(constructTypeDescByteString(true, 64, 1), 16)).toEqual(193);
        expect(constructTypeDescByteString(true, 64, 1)).toEqual("c1");
      });

      test("should return 207 as hex int and cf as hexa string", () => {
        expect(parseInt(constructTypeDescByteString(true, 64, 15), 16)).toEqual(207);
        expect(constructTypeDescByteString(true, 64, 15)).toEqual("cf");
      });

      test("should return 143 as hex int and 8f as hexa string", () => {
        expect(parseInt(constructTypeDescByteString(true, null, 15), 16)).toEqual(143);
        expect(constructTypeDescByteString(true, null, 15)).toEqual("8f");
      });

      test("should return 15 as hex int and ", () => {
        expect(parseInt(constructTypeDescByteString(false, null, 15), 16)).toEqual(15);
        expect(constructTypeDescByteString(false, null, 15)).toEqual("0f");
      });

      test("should throw if typeValue >= 16", () => {
        expect(() => constructTypeDescByteString(false, null, 16)).toThrow();
      });

      test("should return the same as the bitewise implementation", () => {
        expect(parseInt(constructTypeDescByteString(false, null, 1), 16)).toEqual(
          bitwiseImplem(false, null, 1),
        );

        expect(parseInt(constructTypeDescByteString(true, null, 1), 16)).toEqual(
          bitwiseImplem(true, null, 1),
        );

        expect(parseInt(constructTypeDescByteString(true, 64, 1), 16)).toEqual(
          bitwiseImplem(true, 64, 1),
        );

        expect(parseInt(constructTypeDescByteString(true, 64, 15), 16)).toEqual(
          bitwiseImplem(true, 64, 15),
        );

        expect(parseInt(constructTypeDescByteString(true, null, 15), 16)).toEqual(
          bitwiseImplem(true, null, 15),
        );

        expect(parseInt(constructTypeDescByteString(false, null, 15), 16)).toEqual(
          bitwiseImplem(false, null, 15),
        );
      });
    });

    describe("makeTypeEntryStructBuffer", () => {
      test("should return the correct buffer for entry type `int`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForInt",
            type: "int",
          }).toString("hex"),
        ).toEqual("410a6e616d65466f72496e74");
      });

      test("should return the correct buffer for entry type `int8`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForInt",
            type: "int8",
          }).toString("hex"),
        ).toEqual("41010a6e616d65466f72496e74");
      });

      test("should return the correct buffer for entry type `uint`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForUint",
            type: "uint",
          }).toString("hex"),
        ).toEqual("420b6e616d65466f7255696e74");
      });

      test("should return the correct buffer for entry type `uint64`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForUint",
            type: "uint64",
          }).toString("hex"),
        ).toEqual("42080b6e616d65466f7255696e74");
      });

      test("should return the correct buffer for entry type `address`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForAddress",
            type: "address",
          }).toString("hex"),
        ).toEqual("030e6e616d65466f7241646472657373");
      });

      test("should return the correct buffer for entry type `bool`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBool",
            type: "bool",
          }).toString("hex"),
        ).toEqual("040b6e616d65466f72426f6f6c");
      });

      test("should return the correct buffer for entry type `string`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForString",
            type: "string",
          }).toString("hex"),
        ).toEqual("050d6e616d65466f72537472696e67");
      });

      test("should return the correct buffer for entry type `string[3][]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "document",
            type: "string[3][]",
          }).toString("hex"),
        ).toEqual("850201030008646f63756d656e74");
      });

      test("should return the correct buffer for entry type `bytes`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes",
          }).toString("hex"),
        ).toEqual("070c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `bytes32`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32",
          }).toString("hex"),
        ).toEqual("46200c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `bytes32[4]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32[4]",
          }).toString("hex"),
        ).toEqual("c6200101040c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `bytes32[4][]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32[4][]",
          }).toString("hex"),
        ).toEqual("c620020104000c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `bytes32[4][][256]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32[4][][256]",
          }).toString("hex"),
        ).toEqual("c6200301040001100c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `custom`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "somethingelseunknown",
          }).toString("hex"),
        ).toEqual("0014736f6d657468696e67656c7365756e6b6e6f776e0c6e616d65466f724279746573");
      });
    });

    describe("EIP712_TYPE_ENCODERS", () => {
      describe("INT", () => {
        const defaultSizes = [8, 16, 32, 64, 128, 256];
        const couples: [string, number[]][] = [
          ["115792089237316195423570985008687907853269984665640564039457584007913129639935", [256]],
          ["-57896044618658097711785492504343953926634992332820282019728792003956564819968", [256]],
          ["57896044618658097711785492504343953926634992332820282019728792003956564819967", [256]],
          ["-170141183460469231731687303715884105728", [128, 256]],
          ["170141183460469231731687303715884105727", [128, 256]],
          ["-9223372036854775808", [64, 128, 256]],
          ["9223372036854775807", [64, 128, 256]],
          ["-2147483648", [32, 64, 128, 256]],
          ["2147483647", [32, 64, 128, 256]],
          ["-32768", [16, 32, 64, 128, 256]],
          ["32767", [16, 32, 64, 128, 256]],
          ["-256", defaultSizes],
          ["256", defaultSizes],
          ["-128", defaultSizes],
          ["128", defaultSizes],
          ["-64", defaultSizes],
          ["64", defaultSizes],
          ["32", defaultSizes],
          ["-32", defaultSizes],
          ["-16", defaultSizes],
          ["16", defaultSizes],
          ["8", defaultSizes],
          ["-8", defaultSizes],
          ["0", defaultSizes],
        ];

        describe("from decimal string", () => {
          couples.forEach(([value, sizes]) => {
            sizes.forEach(size => {
              test(`should have the right return for value: ${value} and size: ${size}`, () => {
                const hexBuffer = EIP712_TYPE_ENCODERS.INT(value, size);

                expect(
                  convertTwosComplementToDecimalString(hexBuffer.toString("hex"), value),
                ).toEqual(value);
              });
            });
          });
        });

        describe("from hex string", () => {
          couples.forEach(([value, sizes]) => {
            sizes.forEach(size => {
              test(`should have the right return for value: ${value} and size: ${size}`, () => {
                const valueAsHex = EIP712_TYPE_ENCODERS.INT(value, size).toString("hex"); // Reusing valid values from a first run

                const hexBuffer = EIP712_TYPE_ENCODERS.INT("0x" + padHexString(valueAsHex), size);

                expect(
                  convertTwosComplementToDecimalString(hexBuffer.toString("hex"), value),
                ).toEqual(value);
              });
            });
          });
        });
      });

      describe("UINT", () => {
        it("should use the same logic as INT", () => {
          const value = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
          const spy = jest.spyOn(EIP712_TYPE_ENCODERS, "INT");
          EIP712_TYPE_ENCODERS.UINT(value);
          expect(spy).toHaveBeenCalledWith(value);
        });
      });

      describe("BOOL", () => {
        test("should not break from null", () => {
          expect(EIP712_TYPE_ENCODERS.BOOL(null).toString("hex")).toEqual("00");
        });

        describe("from string", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("0").toString("hex")).toEqual("00");
          });

          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("0x00").toString("hex")).toEqual("00");
          });

          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("1").toString("hex")).toEqual("01");
          });

          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("0x01").toString("hex")).toEqual("01");
          });
        });

        describe("from boolean", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL(false).toString("hex")).toEqual("00");
          });

          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL(true).toString("hex")).toEqual("01");
          });
        });

        describe("from number", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL(0).toString("hex")).toEqual("00");
          });

          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL(1).toString("hex")).toEqual("01");
          });
        });
      });

      describe("ADDRESS", () => {
        test("should not break from null", () => {
          expect(EIP712_TYPE_ENCODERS.ADDRESS(null).toString("hex")).toEqual("");
        });

        test("should return 183c938611642ae18790db0A1eFC21Dfe009aA1c", () => {
          expect(
            EIP712_TYPE_ENCODERS.ADDRESS("0x183c938611642ae18790db0A1eFC21Dfe009aA1c").toString(
              "hex",
            ),
          ).toEqual("183c938611642ae18790db0a1efc21dfe009aa1c");
        });

        test("should return 03d7be9a073d7ed9ac0ccb2558d7f7c6a43d3c0aa993e00f2c03424fff0a80f3", () => {
          expect(
            EIP712_TYPE_ENCODERS.ADDRESS(
              // Starknet address are longer, yet the address type is supposed to be 20 characters only
              "0x03d7be9a073d7ed9ac0ccb2558d7f7c6a43d3c0aa993e00f2c03424fff0a80f3",
            ).toString("hex"),
          ).toEqual("03d7be9a073d7ed9ac0ccb2558d7f7c6a43d3c0a");
        });
      });

      describe("STRING", () => {
        test("should not break from null", () => {
          expect(EIP712_TYPE_ENCODERS.STRING(null).toString("hex")).toEqual("");
        });

        test("should not break from empty string", () => {
          expect(EIP712_TYPE_ENCODERS.STRING("").toString("hex")).toEqual("");
        });

        test("should return 6b766e49734147656e697573", () => {
          expect(EIP712_TYPE_ENCODERS.STRING("kvnIsAGenius").toString("hex")).toEqual(
            "6b766e49734147656e697573",
          );
        });
      });

      describe("BYTES", () => {
        describe("from fixed size bytes", () => {
          test("should not break from null", () => {
            expect(EIP712_TYPE_ENCODERS.BYTES(null).toString("hex")).toEqual("");
          });

          test("should return 973bb640", () => {
            expect(EIP712_TYPE_ENCODERS.BYTES("0x973bb640", 4).toString("hex")).toEqual("973bb640");
          });
          test("should return 973bb640", () => {
            expect(
              EIP712_TYPE_ENCODERS.BYTES(
                "0x000000000000000000000000495f947276749ce646f68ac8c248420045cb7b5ebdf2657ffc1fadfd73cf0a8cde95d50b62d3df8c000000000000070000000032",
              ).toString("hex"),
            ).toEqual(
              "000000000000000000000000495f947276749ce646f68ac8c248420045cb7b5ebdf2657ffc1fadfd73cf0a8cde95d50b62d3df8c000000000000070000000032",
            );
          });
        });
      });
    });

    describe("hexBuffer", () => {
      const hexValues = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
      ];
      it.each(hexValues)(
        "should bufferize every possible byte string of: %s",
        (noPrefixShorthand: string) => {
          const prefixFull = `0x0${noPrefixShorthand}`;
          const prefixShorthand = `0x${noPrefixShorthand}`;
          expect(Buffer.compare(hexBuffer(prefixFull), hexBuffer(prefixShorthand))).toBe(0);
          expect(Buffer.compare(hexBuffer(prefixFull), hexBuffer(noPrefixShorthand))).toBe(0);
        },
      );
    });

    describe("getCoinRefTokensMap", () => {
      it("should create a map for 2 tokens in the message", () => {
        const filters = {
          fields: [
            {
              coin_ref: 0,
              format: "token",
              label: "Amount allowance",
              path: "details.token",
              signature:
                "304402203b28bb137a21a6f08903489c6b158fd54280367d6bb72f87bf3e2f287a92440f02207ecc609b12b363cd0e8cbef7079776dfb363cef2fc11da39750598ee4cda4877",
            },
            {
              coin_ref: 0,
              format: "amount",
              label: "Amount allowance",
              path: "details.amount",
              signature:
                "30440220574f7322c9cd212d295c15d92a48aeb6b490978cb87d61fe8afb71b97053ceb7022016489970af3ff80903a45a966ea07dd9ca1435f6b6da9124e03f3087485d1c5b",
            },
            {
              coin_ref: 1,
              format: "token",
              label: "Amount allowance",
              path: "details.token2",
              signature:
                "304402203b28bb137a21a6f08903489c6b158fd54280367d6bb72f87bf3e2f287a92440f02207ecc609b12b363cd0e8cbef7079776dfb363cef2fc11da39750598ee4cda4877",
            },
            {
              coin_ref: 1,
              format: "amount",
              label: "Amount allowance",
              path: "details.amount2",
              signature:
                "30440220574f7322c9cd212d295c15d92a48aeb6b490978cb87d61fe8afb71b97053ceb7022016489970af3ff80903a45a966ea07dd9ca1435f6b6da9124e03f3087485d1c5b",
            },
            {
              format: "raw",
              label: "Approve to spender",
              path: "spender",
              signature:
                "30450221008eecd0e1f432daf722fd00c54038a4cd4d96624cc117ddfb12c7ed10a59b260d02203d34c811a5918c2654e301a071b624088aa9a0813f19dbfa1c803f3dcec64557",
            },
          ],
        } as any;
        const message = {
          message: {
            details: { token: "0x01", amount: "0x02", token2: "0x03", amount2: "0x04" },
            spender: "0x05",
          },
        } as any;

        expect(getCoinRefTokensMap(filters, false, message)).toEqual({
          0: { token: "0x01" },
          1: { token: "0x03" },
        });
      });

      it("should create a map with a token in being the verifying contract", () => {
        const filters = {
          fields: [
            {
              coin_ref: 255,
              format: "amount",
              label: "Amount allowance",
              path: "details.amount",
              signature:
                "304402203b28bb137a21a6f08903489c6b158fd54280367d6bb72f87bf3e2f287a92440f02207ecc609b12b363cd0e8cbef7079776dfb363cef2fc11da39750598ee4cda4877",
            },
            {
              format: "raw",
              label: "Approve to spender",
              path: "spender",
              signature:
                "30450221008eecd0e1f432daf722fd00c54038a4cd4d96624cc117ddfb12c7ed10a59b260d02203d34c811a5918c2654e301a071b624088aa9a0813f19dbfa1c803f3dcec64557",
            },
          ],
        } as any;
        const message = {
          domain: {
            verifyingContract: "0x01",
          },
          message: {
            details: { token: "0x01", amount: "0x02", token2: "0x03", amount2: "0x04" },
            spender: "0x05",
          },
        } as any;

        expect(getCoinRefTokensMap(filters, false, message)).toEqual({
          255: { token: "0x01" },
        });
      });

      it("should create return an empty map for filters v1", () => {
        const filters = {
          fields: [
            {
              coin_ref: 0,
              format: "token",
              label: "Token allowance",
              path: "details.token.[]",
              signature:
                "304402203b28bb137a21a6f08903489c6b158fd54280367d6bb72f87bf3e2f287a92440f02207ecc609b12b363cd0e8cbef7079776dfb363cef2fc11da39750598ee4cda4877",
            },
            {
              format: "raw",
              label: "Approve to spender",
              path: "spender",
              signature:
                "30450221008eecd0e1f432daf722fd00c54038a4cd4d96624cc117ddfb12c7ed10a59b260d02203d34c811a5918c2654e301a071b624088aa9a0813f19dbfa1c803f3dcec64557",
            },
          ],
        } as any;
        const message = {
          message: {
            details: { token: ["0x01", "0x02"] },
            spender: "0x05",
          },
        } as any;

        expect(getCoinRefTokensMap(filters, true, message)).toEqual({});
      });

      it("should create return an empty map for filters v1", () => {
        const filters = {
          fields: [
            {
              coin_ref: 0,
              format: "token",
              label: "Token allowance",
              path: "details.token.[]",
              signature:
                "304402203b28bb137a21a6f08903489c6b158fd54280367d6bb72f87bf3e2f287a92440f02207ecc609b12b363cd0e8cbef7079776dfb363cef2fc11da39750598ee4cda4877",
            },
            {
              format: "raw",
              label: "Approve to spender",
              path: "spender",
              signature:
                "30450221008eecd0e1f432daf722fd00c54038a4cd4d96624cc117ddfb12c7ed10a59b260d02203d34c811a5918c2654e301a071b624088aa9a0813f19dbfa1c803f3dcec64557",
            },
          ],
        } as any;
        const message = {
          message: {
            details: { token: ["0x01", "0x02"] },
            spender: "0x05",
          },
        } as any;

        expect(() => getCoinRefTokensMap(filters, false, message)).toThrow(
          "Array of tokens is not supported with a single coin ref",
        );
      });

      it("should order correctly the map", () => {
        const filters = {
          fields: [
            {
              coin_ref: 1,
              format: "token",
              label: "Amount allowance",
              path: "details.token2",
              signature:
                "304402203b28bb137a21a6f08903489c6b158fd54280367d6bb72f87bf3e2f287a92440f02207ecc609b12b363cd0e8cbef7079776dfb363cef2fc11da39750598ee4cda4877",
            },
            {
              coin_ref: 1,
              format: "amount",
              label: "Amount allowance",
              path: "details.amount2",
              signature:
                "30440220574f7322c9cd212d295c15d92a48aeb6b490978cb87d61fe8afb71b97053ceb7022016489970af3ff80903a45a966ea07dd9ca1435f6b6da9124e03f3087485d1c5b",
            },
            {
              coin_ref: 0,
              format: "token",
              label: "Amount allowance",
              path: "details.token",
              signature:
                "304402203b28bb137a21a6f08903489c6b158fd54280367d6bb72f87bf3e2f287a92440f02207ecc609b12b363cd0e8cbef7079776dfb363cef2fc11da39750598ee4cda4877",
            },
            {
              coin_ref: 0,
              format: "amount",
              label: "Amount allowance",
              path: "details.amount",
              signature:
                "30440220574f7322c9cd212d295c15d92a48aeb6b490978cb87d61fe8afb71b97053ceb7022016489970af3ff80903a45a966ea07dd9ca1435f6b6da9124e03f3087485d1c5b",
            },
            {
              format: "raw",
              label: "Approve to spender",
              path: "spender",
              signature:
                "30450221008eecd0e1f432daf722fd00c54038a4cd4d96624cc117ddfb12c7ed10a59b260d02203d34c811a5918c2654e301a071b624088aa9a0813f19dbfa1c803f3dcec64557",
            },
          ],
        } as any;
        const message = {
          message: {
            details: { token: "0x01", amount: "0x02", token2: "0x03", amount2: "0x04" },
            spender: "0x05",
          },
        } as any;

        expect(getCoinRefTokensMap(filters, false, message)).toEqual({
          0: { token: "0x01" },
          1: { token: "0x03" },
        });
      });
    });

    describe("getAppAndVersion", () => {
      it("should return the app and version", async () => {
        const transport = {
          send: () =>
            Promise.resolve(Buffer.from("0108457468657265756d06312e31312e3101009000", "hex")),
        } as any;

        expect(await getAppAndVersion(transport)).toEqual({
          name: "Ethereum",
          version: "1.11.1",
        });
      });
    });

    describe("getFilterDisplayNameAndSigBuffers", () => {
      it("should return the display name and signature buffers", async () => {
        expect(
          getFilterDisplayNameAndSigBuffers("kvn", Buffer.from("dootdoot").toString("hex")),
        ).toEqual({
          displayNameBuffer: Buffer.from("036b766e", "hex"),
          sigBuffer: Buffer.from("08646f6f74646f6f74", "hex"),
        });
      });
    });

    describe("getPayloadForFilterV2", () => {
      const { displayNameBuffer, sigBuffer } = getFilterDisplayNameAndSigBuffers(
        "kvn",
        Buffer.from("dootdoot").toString("hex"),
      );

      it("should return a payload for a raw filter", () => {
        expect(
          getPayloadForFilterV2("raw", 0, { 0: { token: "0x01" } }, displayNameBuffer, sigBuffer),
        ).toEqual(Buffer.concat([displayNameBuffer, sigBuffer]));
      });

      it("should return a payload for a datetime filter", () => {
        expect(
          getPayloadForFilterV2(
            "datetime",
            0,
            { 0: { token: "0x01" } },
            displayNameBuffer,
            sigBuffer,
          ),
        ).toEqual(Buffer.concat([displayNameBuffer, sigBuffer]));
      });

      it("should return a payload for a token filter", () => {
        expect(
          getPayloadForFilterV2(
            "token",
            0,
            { 0: { token: "0x01", deviceTokenIndex: 123 } },
            displayNameBuffer,
            sigBuffer,
          ),
        ).toEqual(Buffer.concat([Buffer.from("7B", "hex"), sigBuffer]));
      });

      it("should return the coinRef if a token hasn't been registered by the device (token not in CAL for example)", () => {
        expect(
          getPayloadForFilterV2("token", 0, { 0: { token: "0x01" } }, displayNameBuffer, sigBuffer),
        ).toEqual(Buffer.concat([Buffer.from("00", "hex"), sigBuffer]));
      });

      it("should return a payload for an amount filter", () => {
        expect(
          getPayloadForFilterV2(
            "amount",
            0,
            { 0: { token: "0x01", deviceTokenIndex: 123 } },
            displayNameBuffer,
            sigBuffer,
          ),
        ).toEqual(Buffer.concat([displayNameBuffer, Buffer.from("7B", "hex"), sigBuffer]));
      });

      it("should return the coinRef if a token hasn't been registered by the device (token not in CAL for example)", () => {
        expect(
          getPayloadForFilterV2(
            "amount",
            0,
            { 0: { token: "0x01" } },
            displayNameBuffer,
            sigBuffer,
          ),
        ).toEqual(Buffer.concat([displayNameBuffer, Buffer.from("00", "hex"), sigBuffer]));
      });

      it("should should throw for an unknown filter format", () => {
        expect(() =>
          getPayloadForFilterV2(
            "anything" as any,
            0,
            { 0: { token: "0x01" } },
            displayNameBuffer,
            sigBuffer,
          ),
        ).toThrow("Invalid format");
      });
    });
  });
});
