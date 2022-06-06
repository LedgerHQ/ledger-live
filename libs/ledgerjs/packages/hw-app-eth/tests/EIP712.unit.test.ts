import path from "path";
import fs from "fs/promises";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Eth from "../src/Eth";
import {
  constructTypeDescByteString,
  destructTypeFromString,
  EIP712_TYPE_ENCODERS,
  makeTypeEntryStructBuffer,
} from "../src/modules/EIP712/EIP712.utils";

const getFilePath = (filename: string): string =>
  path.resolve(`./tests/sample-messages/${filename}`);

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
        expect(destructTypeFromString("bytes64")).toEqual([
          { name: "bytes", bits: 64 },
          [],
        ]);
      });

      test("'bool' should return [{ name: 'bool', bits: undefined }, []]", () => {
        expect(destructTypeFromString("bool")).toEqual([
          { name: "bool", bits: undefined },
          [],
        ]);
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
      const bitwiseImplem = (
        isArray: boolean,
        typeSize: number | null,
        typeValue
      ) =>
        (Number(isArray) << 7) | (Number(typeSize !== null) << 6) | typeValue;

      test("should return 1 as hex int and 01 as hexa string", () => {
        expect(
          parseInt(constructTypeDescByteString(false, null, 1), 16)
        ).toEqual(1);
        expect(constructTypeDescByteString(false, null, 1)).toEqual("01");
      });

      test("should return 129 as hex int and 81 as hexa string", () => {
        expect(
          parseInt(constructTypeDescByteString(true, null, 1), 16)
        ).toEqual(129);
        expect(constructTypeDescByteString(true, null, 1)).toEqual("81");
      });

      test("should return 193 as hex int and c1 as hexa string", () => {
        expect(parseInt(constructTypeDescByteString(true, 64, 1), 16)).toEqual(
          193
        );
        expect(constructTypeDescByteString(true, 64, 1)).toEqual("c1");
      });

      test("should return 207 as hex int and cf as hexa string", () => {
        expect(parseInt(constructTypeDescByteString(true, 64, 15), 16)).toEqual(
          207
        );
        expect(constructTypeDescByteString(true, 64, 15)).toEqual("cf");
      });

      test("should return 143 as hex int and 8f as hexa string", () => {
        expect(
          parseInt(constructTypeDescByteString(true, null, 15), 16)
        ).toEqual(143);
        expect(constructTypeDescByteString(true, null, 15)).toEqual("8f");
      });

      test("should return 15 as hex int and ", () => {
        expect(
          parseInt(constructTypeDescByteString(false, null, 15), 16)
        ).toEqual(15);
        expect(constructTypeDescByteString(false, null, 15)).toEqual("0f");
      });

      test("should throw if typeValue >= 16", () => {
        expect(() => constructTypeDescByteString(false, null, 16)).toThrow();
      });

      test("should return the same as the bitewise implementation", () => {
        expect(
          parseInt(constructTypeDescByteString(false, null, 1), 16)
        ).toEqual(bitwiseImplem(false, null, 1));

        expect(
          parseInt(constructTypeDescByteString(true, null, 1), 16)
        ).toEqual(bitwiseImplem(true, null, 1));

        expect(parseInt(constructTypeDescByteString(true, 64, 1), 16)).toEqual(
          bitwiseImplem(true, 64, 1)
        );

        expect(parseInt(constructTypeDescByteString(true, 64, 15), 16)).toEqual(
          bitwiseImplem(true, 64, 15)
        );

        expect(
          parseInt(constructTypeDescByteString(true, null, 15), 16)
        ).toEqual(bitwiseImplem(true, null, 15));

        expect(
          parseInt(constructTypeDescByteString(false, null, 15), 16)
        ).toEqual(bitwiseImplem(false, null, 15));
      });
    });

    describe("makeTypeEntryStructBuffer", () => {
      test("should return the correct buffer for entry type `int`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForInt",
            type: "int",
          }).toString("hex")
        ).toEqual("410a6e616d65466f72496e74");
      });

      test("should return the correct buffer for entry type `int8`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForInt",
            type: "int8",
          }).toString("hex")
        ).toEqual("41010a6e616d65466f72496e74");
      });

      test("should return the correct buffer for entry type `uint`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForUint",
            type: "uint",
          }).toString("hex")
        ).toEqual("420b6e616d65466f7255696e74");
      });

      test("should return the correct buffer for entry type `uint64`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForUint",
            type: "uint64",
          }).toString("hex")
        ).toEqual("42080b6e616d65466f7255696e74");
      });

      test("should return the correct buffer for entry type `address`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForAddress",
            type: "address",
          }).toString("hex")
        ).toEqual("030e6e616d65466f7241646472657373");
      });

      test("should return the correct buffer for entry type `bool`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBool",
            type: "bool",
          }).toString("hex")
        ).toEqual("040b6e616d65466f72426f6f6c");
      });

      test("should return the correct buffer for entry type `string`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForString",
            type: "string",
          }).toString("hex")
        ).toEqual("050d6e616d65466f72537472696e67");
      });

      test("should return the correct buffer for entry type `string[3][]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "document",
            type: "string[3][]",
          }).toString("hex")
        ).toEqual("850201030008646f63756d656e74");
      });

      test("should return the correct buffer for entry type `bytes`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes",
          }).toString("hex")
        ).toEqual("070c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `bytes32`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32",
          }).toString("hex")
        ).toEqual("46200c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `bytes32[4]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32[4]",
          }).toString("hex")
        ).toEqual("c6200101040c6e616d65466f724279746573");
      });

      test("should return the correct buffer for entry type `bytes32[4][]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32[4][]",
          }).toString("hex")
        ).toEqual("c620020104000c6e616d65466f724279746573");
      });
      test("should return the correct buffer for entry type `bytes32[4][][256]`", () => {
        expect(
          makeTypeEntryStructBuffer({
            name: "nameForBytes",
            type: "bytes32[4][][256]",
          }).toString("hex")
        ).toEqual("c6200301040001100c6e616d65466f724279746573");
      });
    });

    describe("EIP712_TYPE_ENCODERS", () => {
      describe("INT", () => {
        describe("from string", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.INT("0").toString("hex")).toEqual("00");
          });
          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.INT("1").toString("hex")).toEqual("01");
          });
          test("should return 0a", () => {
            expect(EIP712_TYPE_ENCODERS.INT("10").toString("hex")).toEqual(
              "0a"
            );
          });
          test("should return 64", () => {
            expect(EIP712_TYPE_ENCODERS.INT("100").toString("hex")).toEqual(
              "64"
            );
          });
          test("should return 0101", () => {
            expect(EIP712_TYPE_ENCODERS.INT("257").toString("hex")).toEqual(
              "0101"
            );
          });
        });

        describe("from number", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.INT(0).toString("hex")).toEqual("00");
          });
          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.INT(1).toString("hex")).toEqual("01");
          });
          test("should return 0a", () => {
            expect(EIP712_TYPE_ENCODERS.INT(10).toString("hex")).toEqual("0a");
          });
          test("should return 64", () => {
            expect(EIP712_TYPE_ENCODERS.INT(100).toString("hex")).toEqual("64");
          });
          test("should return 0101", () => {
            expect(EIP712_TYPE_ENCODERS.INT(257).toString("hex")).toEqual(
              "0101"
            );
          });
        });

        describe("from hex", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.INT("0x00").toString("hex")).toEqual(
              "00"
            );
          });
          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.INT("0x01").toString("hex")).toEqual(
              "01"
            );
          });
          test("should return 0a", () => {
            expect(EIP712_TYPE_ENCODERS.INT("0x0a").toString("hex")).toEqual(
              "0a"
            );
          });
          test("should return 64", () => {
            expect(EIP712_TYPE_ENCODERS.INT("0x64").toString("hex")).toEqual(
              "64"
            );
          });
          test("should return 0101", () => {
            expect(EIP712_TYPE_ENCODERS.INT("0x0101").toString("hex")).toEqual(
              "0101"
            );
          });
        });
      });

      describe("UINT", () => {
        describe("from string", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("0").toString("hex")).toEqual(
              "00"
            );
          });
          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("1").toString("hex")).toEqual(
              "01"
            );
          });
          test("should return 0a", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("10").toString("hex")).toEqual(
              "0a"
            );
          });
          test("should return 64", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("100").toString("hex")).toEqual(
              "64"
            );
          });
          test("should return 0101", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("257").toString("hex")).toEqual(
              "0101"
            );
          });
        });

        describe("from number", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.UINT(0).toString("hex")).toEqual("00");
          });
          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.UINT(1).toString("hex")).toEqual("01");
          });
          test("should return 0a", () => {
            expect(EIP712_TYPE_ENCODERS.UINT(10).toString("hex")).toEqual("0a");
          });
          test("should return 64", () => {
            expect(EIP712_TYPE_ENCODERS.UINT(100).toString("hex")).toEqual(
              "64"
            );
          });
          test("should return 0101", () => {
            expect(EIP712_TYPE_ENCODERS.UINT(257).toString("hex")).toEqual(
              "0101"
            );
          });
        });

        describe("from hex", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("0x00").toString("hex")).toEqual(
              "00"
            );
          });
          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("0x01").toString("hex")).toEqual(
              "01"
            );
          });
          test("should return 0a", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("0x0a").toString("hex")).toEqual(
              "0a"
            );
          });
          test("should return 64", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("0x64").toString("hex")).toEqual(
              "64"
            );
          });
          test("should return 0101", () => {
            expect(EIP712_TYPE_ENCODERS.UINT("0x0101").toString("hex")).toEqual(
              "0101"
            );
          });
        });
      });

      describe("BOOL", () => {
        test("should not break from null", () => {
          expect(EIP712_TYPE_ENCODERS.BOOL(null).toString("hex")).toEqual("00");
        });

        describe("from string", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("0").toString("hex")).toEqual(
              "00"
            );
          });

          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("0x00").toString("hex")).toEqual(
              "00"
            );
          });

          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("1").toString("hex")).toEqual(
              "01"
            );
          });

          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL("0x01").toString("hex")).toEqual(
              "01"
            );
          });
        });

        describe("from boolean", () => {
          test("should return 00", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL(false).toString("hex")).toEqual(
              "00"
            );
          });

          test("should return 01", () => {
            expect(EIP712_TYPE_ENCODERS.BOOL(true).toString("hex")).toEqual(
              "01"
            );
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
          expect(EIP712_TYPE_ENCODERS.ADDRESS(null).toString("hex")).toEqual(
            ""
          );
        });

        test("should return 183c938611642ae18790db0A1eFC21Dfe009aA1c", () => {
          expect(
            EIP712_TYPE_ENCODERS.ADDRESS(
              "0x183c938611642ae18790db0A1eFC21Dfe009aA1c"
            ).toString("hex")
          ).toEqual("183c938611642ae18790db0a1efc21dfe009aa1c");
        });

        test("should return 03d7be9a073d7ed9ac0ccb2558d7f7c6a43d3c0aa993e00f2c03424fff0a80f3", () => {
          expect(
            EIP712_TYPE_ENCODERS.ADDRESS(
              // Starknet address are longer, yet the address type is supposed to be 20 characters only
              "0x03d7be9a073d7ed9ac0ccb2558d7f7c6a43d3c0aa993e00f2c03424fff0a80f3"
            ).toString("hex")
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
          expect(
            EIP712_TYPE_ENCODERS.STRING("kvnIsAGenius").toString("hex")
          ).toEqual("6b766e49734147656e697573");
        });
      });

      describe("BYTES", () => {
        describe("from fixed size bytes", () => {
          test("should not break from null", () => {
            expect(EIP712_TYPE_ENCODERS.BYTES(null).toString("hex")).toEqual(
              ""
            );
          });

          test("should return 973bb640", () => {
            expect(
              EIP712_TYPE_ENCODERS.BYTES("0x973bb640", 4).toString("hex")
            ).toEqual("973bb640");
          });
          test("should return 973bb640", () => {
            expect(
              EIP712_TYPE_ENCODERS.BYTES(
                "0x000000000000000000000000495f947276749ce646f68ac8c248420045cb7b5ebdf2657ffc1fadfd73cf0a8cde95d50b62d3df8c000000000000070000000032"
              ).toString("hex")
            ).toEqual(
              "000000000000000000000000495f947276749ce646f68ac8c248420045cb7b5ebdf2657ffc1fadfd73cf0a8cde95d50b62d3df8c000000000000070000000032"
            );
          });
        });
      });
    });
  });

  describe("SignEIP712Message mocked", () => {
    test("should sign correctly the 0.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("0.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("0.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "8a540510e13b0f2b11a451275716d29e08caad07e89a1c84964782fb5e1ad788",
        s: "64a0de235b270fbe81e8e40688f4a9f9ad9d283d690552c9331d7773ceafa513",
        v: 28,
      });
    });

    test("should sign correctly the 1.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("1.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("1.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "a7cd8fdac8707487908988d6111c2accdcaed9c43d6e993e8760ec8096cb2051",
        s: "394fc2a9b1a5107b28aa601b767a740761920c86797918365ac2460f6444ab98",
        v: 28,
      });
    });

    test("should sign correctly the 2.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("2.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("2.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "bee323485a7138784ec593146955255b1290eac0c9959fbe57f01b7e3e8e2dfe",
        s: "5f489023947c1d7cc4a8bba5c96e0717236f635d97c79203f56d57f3727cb5d1",
        v: 28,
      });
    });

    test("should sign correctly the 3.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("3.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("3.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "a032f358f76041e239d34a449d859742d79ede0705e294552e68c6f6345cd9a6",
        s: "5d14e1607eca346db7a1b4ded81c8dcc82821a8f2ceb24803b611095cf68d320",
        v: 28,
      });
    });

    test("should sign correctly the 4.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("4.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("4.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "cda73aa5e40061499b7faee1f85d6cefc371bb8f38bf407d6ab747aaaf1b047d",
        s: "702f036a1941e85f124f961e44c55fafe44533abd34aea8a5c4dba0df836925f",
        v: 27,
      });
    });

    test("should sign correctly the 5.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("5.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("5.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "7b6a345381330b91ee63d05c83ecc2fa1bc7cd5871da3f45341827b09fd44036",
        s: "7660f31b2cae89bc1826fbe153209b059968264b6387936551f2a5d80931490c",
        v: 27,
      });
    });

    test("should sign correctly the 6.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("6.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("6.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "ab0071346cd7ab388c7b4fa71d9634f5f3e3445acbe900874b7594890404d14c",
        s: "35a8e8d682652915e9afc0c684fc8d5a5b00e87e43a478dc0d9eb639b43d29f5",
        v: 27,
      });
    });

    test("should sign correctly the 7.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("7.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("7.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "5059ff4b6e0e4ccc8f7bcf233da23618a1f0be05b88d70b068dbe187d6b35955",
        s: "06d7d716d3b9b351856d656a7d58e47f8d8922411cc3c68aa9a2d32d1f188f26",
        v: 27,
      });
    });

    test("should sign correctly the 8.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("8.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("8.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "d6de64452d9a826ba639b736117d2a91ae04539577cb5a2a2445361ee9158034",
        s: "246339bfeba70f9dc2a9167b0da5169acc598797897d64cee52b3dbb998122cb",
        v: 28,
      });
    });

    test("should sign correctly the 9.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("9.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("9.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "6f5490a5f227b0a77eb59ebc9b51dad97759930a71692bb868b0b796245c57dd",
        s: "177634a3bada7e155beb1f79dc68bce7daf1a7931642a08aa2e82eb35c9546ec",
        v: 28,
      });
    });

    test("should sign correctly the 10.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("10.apdus"), "utf-8");
      const message = await fs
        .readFile(getFilePath("10.json"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`${apdusBuffer}`)
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "e71d7f114d3fc431f988e359bbea47c7ab81e755482201d3acd66557d7d611a4",
        s: "4b3fb9d06c08ff11764f7f296af9b2e17c50aa9776581485a0284d4e66ea70c4",
        v: 28,
      });
    });
  });
});
