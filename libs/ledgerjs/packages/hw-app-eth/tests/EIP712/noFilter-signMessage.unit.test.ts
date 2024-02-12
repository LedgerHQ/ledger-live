import path from "path";
import nock from "nock";
import fs from "fs/promises";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Eth from "../../src/Eth";

const getFilePath = (type: "apdu" | "message", filename: string): string => {
  switch (type) {
    case "apdu":
      return path.resolve(`./tests/fixtures/apdus/${filename}.apdus`);
    case "message":
      return path.resolve(`./tests/fixtures/messages/${filename}.json`);
  }
};

// act like no message has filters
jest.mock("@ledgerhq/cryptoassets/data/eip712", () => ({}));
nock.disableNetConnect();

describe("EIP712", () => {
  describe("SignEIP712Message without filters", () => {
    test("should sign correctly the 0.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "0"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "0"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "8a540510e13b0f2b11a451275716d29e08caad07e89a1c84964782fb5e1ad788",
        s: "64a0de235b270fbe81e8e40688f4a9f9ad9d283d690552c9331d7773ceafa513",
        v: 28,
      });
    });

    test("should sign correctly the 1.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "1"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "1"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "a7cd8fdac8707487908988d6111c2accdcaed9c43d6e993e8760ec8096cb2051",
        s: "394fc2a9b1a5107b28aa601b767a740761920c86797918365ac2460f6444ab98",
        v: 28,
      });
    });

    test("should sign correctly the 2.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "2"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "2"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "bee323485a7138784ec593146955255b1290eac0c9959fbe57f01b7e3e8e2dfe",
        s: "5f489023947c1d7cc4a8bba5c96e0717236f635d97c79203f56d57f3727cb5d1",
        v: 28,
      });
    });

    test("should sign correctly the 3.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "3"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "3"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "a032f358f76041e239d34a449d859742d79ede0705e294552e68c6f6345cd9a6",
        s: "5d14e1607eca346db7a1b4ded81c8dcc82821a8f2ceb24803b611095cf68d320",
        v: 28,
      });
    });

    test("should sign correctly the 4.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "4"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "4"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "cda73aa5e40061499b7faee1f85d6cefc371bb8f38bf407d6ab747aaaf1b047d",
        s: "702f036a1941e85f124f961e44c55fafe44533abd34aea8a5c4dba0df836925f",
        v: 27,
      });
    });

    test("should sign correctly the 5.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "5"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "5"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "7b6a345381330b91ee63d05c83ecc2fa1bc7cd5871da3f45341827b09fd44036",
        s: "7660f31b2cae89bc1826fbe153209b059968264b6387936551f2a5d80931490c",
        v: 27,
      });
    });

    test("should sign correctly the 6.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "6"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "6"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "ab0071346cd7ab388c7b4fa71d9634f5f3e3445acbe900874b7594890404d14c",
        s: "35a8e8d682652915e9afc0c684fc8d5a5b00e87e43a478dc0d9eb639b43d29f5",
        v: 27,
      });
    });

    test("should sign correctly the 7.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "7"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "7"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "5059ff4b6e0e4ccc8f7bcf233da23618a1f0be05b88d70b068dbe187d6b35955",
        s: "06d7d716d3b9b351856d656a7d58e47f8d8922411cc3c68aa9a2d32d1f188f26",
        v: 27,
      });
    });

    test("should sign correctly the 8.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "8"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "8"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "d6de64452d9a826ba639b736117d2a91ae04539577cb5a2a2445361ee9158034",
        s: "246339bfeba70f9dc2a9167b0da5169acc598797897d64cee52b3dbb998122cb",
        v: 28,
      });
    });

    test("should sign correctly the 9.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "9"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "9"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "6f5490a5f227b0a77eb59ebc9b51dad97759930a71692bb868b0b796245c57dd",
        s: "177634a3bada7e155beb1f79dc68bce7daf1a7931642a08aa2e82eb35c9546ec",
        v: 28,
      });
    });

    test("should sign correctly the 10.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "10"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "10"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "e71d7f114d3fc431f988e359bbea47c7ab81e755482201d3acd66557d7d611a4",
        s: "4b3fb9d06c08ff11764f7f296af9b2e17c50aa9776581485a0284d4e66ea70c4",
        v: 28,
      });
    });

    test("should sign correctly the 11.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "11"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "11"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "d0259bc5208c369532c6161486d7533966d382fc725bcb781a190c0f1a53f771",
        s: "7ebbf21c5569d2d2a480615d529b431d3b0dfce863f723d21e3370e860a8965c",
        v: 28,
      });
    });

    test("should sign correctly the 12.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "12"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "12"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "4aef3aaff62fa0731f4e661c4dbb92a48f8c12d7225219fad74b55ef2ad0045b",
        s: "46d7e01804c33a99c4dc7dd7b2ac5e63d07ee4641b01cd3a598cc91d74bbe3e0",
        v: 28,
      });
    });

    test("should sign correctly the 13.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "13"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "13"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "daf758e25d9d7769adcab19c4d64953983d29fb44041e0ba4263a9d4686a3de3",
        s: "03c52a566b18568ba71576e768ed321a6a90605365fe9766387db3bd24bebe96",
        v: 28,
      });
    });

    test("should sign correctly the 14.json sample message (shorthand byte string => 0x3 vs 0x03)", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "14"), "utf-8");
      const messageShorthand = await fs
        .readFile(getFilePath("message", "14"), "utf-8")
        .then(JSON.parse);
      const messageFull = await fs
        .readFile(getFilePath("message", "14bis"), "utf-8")
        .then(JSON.parse);

      const transportShort = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));
      const ethShort = new Eth(transportShort);
      const resultShorthand = await ethShort.signEIP712Message("44'/60'/0'/0/0", messageShorthand);
      const transportFull = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));
      const ethFull = new Eth(transportFull);
      const resultFull = await ethFull.signEIP712Message("44'/60'/0'/0/0", messageFull);

      expect(resultShorthand).toEqual(resultFull);
      expect(resultShorthand).toEqual({
        r: "15502f71994b3a6cade2f2aa0243058ccfd44d09ad1fb5392180f2a430ed396d",
        s: "1ecf5ac4964fd1068ad90b2586bc12e9ac9a77fb04331da54023ee1674794411",
        v: 27,
      });
    });
  });
});
