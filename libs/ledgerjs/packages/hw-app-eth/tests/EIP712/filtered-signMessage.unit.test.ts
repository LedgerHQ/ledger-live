import path from "path";
import nock from "nock";
import fs from "fs/promises";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { v1, v2 } from "../fixtures/CAL";
import Eth from "../../src/Eth";

const getFilePath = (type: "apdu" | "message", filename: string): string => {
  switch (type) {
    case "apdu":
      return path.resolve(`./tests/fixtures/apdus/${filename}.apdus`);
    case "message":
      return path.resolve(`./tests/fixtures/messages/${filename}.json`);
  }
};

jest.mock("@ledgerhq/cryptoassets-evm-signatures/data/eip712", () => v1);
jest.mock("@ledgerhq/cryptoassets-evm-signatures/data/eip712_v2", () => v2);
jest.mock("@ledgerhq/cryptoassets-evm-signatures/data/evm/index", () => ({
  signatures: {
    1: "AAAAZwRVU0RDoLhpkcYhizbB0Z1KLp6wzjYG60gAAAAGAAAAATBEAiBT0S5lTL5ipustFl3sP7dsPLF2QWaAyaXg3iWQsLnNigIgUEdqFpFVhGEAxiwzjHZ5FC0GD/VU92W8nBjTHrsy42AAAABoBFdFVEjAKqo5siP+jQoOXE8n6tkIPHVswgAAABIAAAABMEUCIQDGNSQY0A9zJrjwtmxxxdCfMG4OzgBJPLqeqOoXe0pI7QIgZGYxocaD2s6sFSA355FC7owyjNN8g6eOy4BeE44/Ovc=",
    137: "AAAAZwRVU0RDJ5G8ofLeRmHtiKMMmaepRJqoQXQAAAAGAAAAiTBEAiBjxSGrC/C4mPSUtg6cVMGpgokwZmVNpdnc0rkfhL2c1gIgD+CqcDL9MWCffzbolbi1oWATL/5P3F1YWPvrLGaLG00AAABnBFdFVEh86yP9a8Ct1Z5irCVXgnDP8bn2GQAAABIAAACJMEQCIFBR0vbDO+KtsBq864UEM6P8+6U9jtZ80MCzRJi9MCpsAiAiSy+Re8z4tNPMwJh778qv04NadWUdQK8kfzY2EkC+WgAAAGkGV01BVElDDVALHY6O8x4hyZ0duaZETTrfEnAAAAASAAAAiTBEAiAzUzhabCGosL5APk2DKlMgGkrJxI8WmHeZ0xNKbrSHGQIgQIeT1ugsoIZD7J/5HZf6WmJ9yG/CRdvi88LrccoM9Bc=",
  },
}));
nock.disableNetConnect();

describe("EIP712", () => {
  describe("SignEIP712Message with filters v1", () => {
    let nanoAppVersionApdus;
    beforeAll(async () => {
      nanoAppVersionApdus = await fs.readFile(getFilePath("apdu", "version-1.0.0"), "utf-8");
    });

    it("should sign correctly the 0.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "0-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "0"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "b1a7312afb06c47b56d25475bdfdf37d907c84e6c1143825f85136062e941ff7",
        s: "759c2298e0dba1792facd2e579eda48109e4640f4227575bf60db9b06f6e78c8",
        v: 28,
      });
    });

    it("should sign correctly the 1.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "1-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "1"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "ea66f747173762715751c889fea8722acac3fc35db2c226d37a2e58815398f64",
        s: "52d8ba9153de9255da220ffd36762c0b027701a3b5110f0a765f94b16a9dfb55",
        v: 28,
      });
    });

    it("should sign correctly the 2.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "2-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "2"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "1539547ae7cf8ebcd3eabfb57cd2b1fb7775ce757c3f4a307c7425d35b7bfff7",
        s: "47248cb61e554c1f90af6331d9c9e51cbb8655667514194f509abe097a032319",
        v: 27,
      });
    });

    it("should sign correctly the 3.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "3-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "3"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "5677fec212710c03127cc58c2b0ce31885f6147bc807cdd94de1343c1396d452",
        s: "6624ddd7e50c1185f91d80ce4ef7adc96adb8c73e74cd8cb5087a44d3a134c8f",
        v: 27,
      });
    });

    it("should sign correctly the 4.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "4-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "4"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "341bca1c0dfd805d4befc21500084424dbe559c7aafd78d8fb461c0c76dfea1d",
        s: "33ebb7b6fe0691961cd8b263faac20ecbbdcaef3febb57eb76614cad629080ea",
        v: 28,
      });
    });

    it("should sign correctly the 5.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "5-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "5"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "e42c7fad36f615a566be673ecbd0542f83addf76ffa97af30acda06b3443ceca",
        s: "72ca3cd5b3c9790e2a199c9d03342db7be374794d8bbffa2c4cb2aa1a16389e1",
        v: 28,
      });
    });

    it("should sign correctly the 6.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "6-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "6"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "d10f6b61205cf5c5ec45735d7f7186afb7e454212102883caf9b6fd2ebdf9fd3",
        s: "2d9c1af9ded7ddb0237c0b67b6a1a2c98fc73af8ff0bf6c43b356a79bbc929f3",
        v: 27,
      });
    });

    it("should sign correctly the 7.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "7-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "7"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "df9e8b6b94a196b5b5608d8a83ad5479f050bbdfb301d4d3f4e2bfb30497fd44",
        s: "1bd7074ce7035305a091b2f9994854fec0ceb2b11cf2620b93b76c1723029f6f",
        v: 27,
      });
    });

    it("should sign correctly the 8.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "8-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "8"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "59adf8ab1d0e87d2623747eac10d5ef23d0145d7f30e2960cba3503b28add2d3",
        s: "109f81625ca7a9bb448fa58325b2f08d7f7141b14a20e363d7ea10a9483b780d",
        v: 28,
      });
    });

    it("should sign correctly the 9.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "9-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "9"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "87698ac1d846331b4b393417353dd20c60b9401a407d76db52fb9e45844aab30",
        s: "11b09b38be74fbf2cb5851470d4f70bf0cccaf1bea00ff28e16ca914deba15ce",
        v: 28,
      });
    });

    it("should sign correctly the 10.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "10-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "10"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "aaa9e17e5cb7d8a7d0ecc832a883254599909d8123d846aa6f3f63f47ab78704",
        s: "2b7e6adaeb26906e6577efa04c1733a19169ee2747020b73f8f309ca8c2ccc1f",
        v: 28,
      });
    });

    it("should sign correctly the 11.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "11-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "11"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "cce2e63aaac6a5f9a74684d8fdddcbc7f3b27aa17235bfab89226821ead933b6",
        s: "3f3c93977abcc3f8cc9a3dc1ecc02dbca14aca1a6ecb2fb6ca3d7c713ace1ec4",
        v: 28,
      });
    });

    it("should sign correctly the 12.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "12-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "12"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "7be1671577753c13bfd1da8b234b6df8484daf47351c2366637fd291dd4aa4d9",
        s: "1a7ffbb01dc8a64e9ee97d19b8f154e9eecbe0b1bfb9dcfa781a65e474573963",
        v: 27,
      });
    });

    it("should sign correctly the 13.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "13-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "13"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "fde9bc1860bae0b867b66176ca654578530edf97771c714cc7bb146943443ef3",
        s: "06f92884f1de6fe75c4a650b0fe88d0c185af9943a95dc1c4b3045ae0f81edfe",
        v: 28,
      });
    });

    it("should sign correctly the 14.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "14-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "14"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "55ad4a9295fd8e64082f751f19f158db34de2a9072c0b348483ca4a303cf0cb0",
        s: "69d732a52e29963a23d7c6ca032e46ae452cc2e3d9487952567ae4bffd14e237",
        v: 28,
      });
    });

    it("should sign correctly the 14bis.json sample message and have the same APDUs as 14.json", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "14-filtered-v1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "14bis"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "55ad4a9295fd8e64082f751f19f158db34de2a9072c0b348483ca4a303cf0cb0",
        s: "69d732a52e29963a23d7c6ca032e46ae452cc2e3d9487952567ae4bffd14e237",
        v: 28,
      });
    });

    it("should sign correctly the 15-permit.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "15-filtered-v1"), "utf-8");
      const message = await fs
        .readFile(getFilePath("message", "15-permit"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "9573c40857d73d28b43120231886cf4199b1456e00da8887a508d576b6985a6f",
        s: "18515302ca7809f9d36b95c8ea91509b602adc3c1653be0255ac5726969307bd",
        v: 28,
      });
    });

    it("should sign correctly the 16-permit2.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "16-filtered-v1"), "utf-8");
      const message = await fs
        .readFile(getFilePath("message", "16-permit2"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "ce7c4941157899c0db37c4363c773d919c896ddef669c878e856573659bb3655",
        s: "0fed0222b941702c2fd5611ac13ac0217ed889586a56b047b0d5bf0566edbbb7",
        v: 27,
      });
    });

    it("should sign correctly the 17-uniswapx.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "17-filtered-v1"), "utf-8");
      const message = await fs
        .readFile(getFilePath("message", "17-uniswapx"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "63e951154de94e9f81ecefa38c0f11c2e4a9bfbaa3524b6c9744161211d6cc3b",
        s: "62480171ceb1f39f2c41ff06a2ecd483c0faaaf459063b278c09803b8bef3e4d",
        v: 27,
      });
    });

    it("should sign correctly the 18-1inch-fusion.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "18-filtered-v1"), "utf-8");
      const message = await fs
        .readFile(getFilePath("message", "18-1inch-fusion"), "utf-8")
        .then(JSON.parse);

      const transport = await openTransportReplayer(
        RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
      );

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "6f07ba3bb7fa9369ee9b5e4cc3bdc8545d75e3527fa242a5e4d23ead9d232af8",
        s: "412a55401fe955b996125682ad0a47277d3ce1b314ee3962956ae643b71166cb",
        v: 27,
      });
    });
  });

  describe("SignEIP712Message with filters v2", () => {
    describe("from version 1.11.1", () => {
      let nanoAppVersionApdus;
      beforeAll(async () => {
        nanoAppVersionApdus = await fs.readFile(getFilePath("apdu", "version-1.11.1"), "utf-8");
      });

      it("should sign correctly the 15-permit.json sample message", async () => {
        const apdusBuffer = await fs.readFile(getFilePath("apdu", "15-filtered-v2"), "utf-8");
        const message = await fs
          .readFile(getFilePath("message", "15-permit"), "utf-8")
          .then(JSON.parse);

        const transport = await openTransportReplayer(
          RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
        );

        const eth = new Eth(transport);
        const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

        expect(result).toEqual({
          r: "9573c40857d73d28b43120231886cf4199b1456e00da8887a508d576b6985a6f",
          s: "18515302ca7809f9d36b95c8ea91509b602adc3c1653be0255ac5726969307bd",
          v: 28,
        });
      });

      it("should sign correctly the 16-permit2.json sample message", async () => {
        const apdusBuffer = await fs.readFile(getFilePath("apdu", "16-filtered-v2"), "utf-8");
        const message = await fs
          .readFile(getFilePath("message", "16-permit2"), "utf-8")
          .then(JSON.parse);

        const transport = await openTransportReplayer(
          RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
        );

        const eth = new Eth(transport);
        const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

        expect(result).toEqual({
          r: "ce7c4941157899c0db37c4363c773d919c896ddef669c878e856573659bb3655",
          s: "0fed0222b941702c2fd5611ac13ac0217ed889586a56b047b0d5bf0566edbbb7",
          v: 27,
        });
      });

      it("should sign correctly the 17-uniswapx.json sample message", async () => {
        const apdusBuffer = await fs.readFile(getFilePath("apdu", "17-filtered-v2"), "utf-8");
        const message = await fs
          .readFile(getFilePath("message", "17-uniswapx"), "utf-8")
          .then(JSON.parse);

        const transport = await openTransportReplayer(
          RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
        );

        const eth = new Eth(transport);
        const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

        expect(result).toEqual({
          r: "63e951154de94e9f81ecefa38c0f11c2e4a9bfbaa3524b6c9744161211d6cc3b",
          s: "62480171ceb1f39f2c41ff06a2ecd483c0faaaf459063b278c09803b8bef3e4d",
          v: 27,
        });
      });

      it("should sign correctly the 18-1inch-fusion.json sample message", async () => {
        const apdusBuffer = await fs.readFile(getFilePath("apdu", "18-filtered-v2"), "utf-8");
        const message = await fs
          .readFile(getFilePath("message", "18-1inch-fusion"), "utf-8")
          .then(JSON.parse);

        const transport = await openTransportReplayer(
          RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
        );

        const eth = new Eth(transport);
        const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

        expect(result).toEqual({
          r: "6f07ba3bb7fa9369ee9b5e4cc3bdc8545d75e3527fa242a5e4d23ead9d232af8",
          s: "412a55401fe955b996125682ad0a47277d3ce1b314ee3962956ae643b71166cb",
          v: 27,
        });
      });
    });
    describe("from version 1.12.0", () => {
      let nanoAppVersionApdus;
      beforeAll(async () => {
        nanoAppVersionApdus = await fs.readFile(getFilePath("apdu", "version-1.12.0"), "utf-8");
      });

      it("should sign correctly the 1-empty-array-1-level.json sample message", async () => {
        const apdusBuffer = await fs.readFile(
          getFilePath("apdu", "1-filtered-empty-array-1-level-v2"),
          "utf-8",
        );
        const message = await fs
          .readFile(getFilePath("message", "1-empty-array-1-level"), "utf-8")
          .then(JSON.parse);

        const transport = await openTransportReplayer(
          RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
        );

        const eth = new Eth(transport);
        const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

        expect(result).toEqual({
          r: "d564c78ed10b539ca83410d9deca79fdaaa250ad53c4dc41433ba55d02a26d25",
          s: "50d3ed7f9c66b3f2c60ffb9b6c696b8f06cd88cafe4ae8371642ab7771827c3a",
          v: 27,
        });
      });

      it("should sign correctly the 1-empty-array-2-levels.json sample message", async () => {
        const apdusBuffer = await fs.readFile(
          getFilePath("apdu", "1-filtered-empty-array-2-levels-v2"),
          "utf-8",
        );
        const message = await fs
          .readFile(getFilePath("message", "1-empty-array-2-levels"), "utf-8")
          .then(JSON.parse);

        const transport = await openTransportReplayer(
          RecordStore.fromString(nanoAppVersionApdus + apdusBuffer),
        );

        const eth = new Eth(transport);
        const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

        expect(result).toEqual({
          r: "4217052c28965d9d1cdba00a65b5d9a18c41e0ea60161cd5f3b0ccffd2d4a536",
          s: "589c87ae016194d0981925d203d203390e6f706e270a7b4ba579a106539ade08",
          v: 28,
        });
      });
    });
  });
});
