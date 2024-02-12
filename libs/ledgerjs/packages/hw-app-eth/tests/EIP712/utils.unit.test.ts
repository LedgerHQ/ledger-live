import BigNumber from "bignumber.js";
import { hexBuffer, padHexString } from "../../src/utils";
import {
  constructTypeDescByteString,
  destructTypeFromString,
  EIP712_TYPE_ENCODERS,
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
      test("'string[]' should return [{name: 'string', bits: undefined}, [null]]", () => {
        expect(destructTypeFromString("string[]")).toEqual([
          { name: "string", bits: undefined },
          [null],
        ]);
      });

      test("'uint8[2][][4]' should return [{name: 'uint', bits: 8}, [2, null, 4]]", () => {
        expect(destructTypeFromString("uint8[2][][4]")).toEqual([
          { name: "uint", bits: 8 },
          [2, null, 4],
        ]);
      });

      test("'bytes64' should return [{ name: 'bytes', bits: 64 }, []]", () => {
        expect(destructTypeFromString("bytes64")).toEqual([{ name: "bytes", bits: 64 }, []]);
      });

      test("'bool' should return [{ name: 'bool', bits: undefined }, []]", () => {
        expect(destructTypeFromString("bool")).toEqual([{ name: "bool", bits: undefined }, []]);
      });

      test("'bool[any]' should not throw and return ['bool', []]", () => {
        expect(destructTypeFromString("bool[any]")).toEqual([
          { name: "bool", bits: undefined },
          [],
        ]);
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

      describe.skip("UINT", () => {
        // Testing is covered by INT
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
  });
});
