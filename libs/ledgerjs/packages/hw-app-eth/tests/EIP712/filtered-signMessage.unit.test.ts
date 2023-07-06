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

jest.mock("@ledgerhq/cryptoassets/data/eip712", () => require("../fixtures/CAL"));
nock.disableNetConnect();

describe("EIP712", () => {
  describe("SignEIP712Message with filters", () => {
    test("should sign correctly the 0.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "0-filtered"), "utf-8");
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
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "1-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "1"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        v: 28,
        r: "66ab3c335fa92801af51551371a95a898a6d862bae2087e0d4074cedb48f9d93",
        s: "71aac1298822efc8b86b5d4618e7b0b91d73813b150645118414f40d06b2465a",
      });
    });

    test("should sign correctly the 2.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "2-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "2"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "5e729ca9970c6436cfb23d50b93c5674aa87adeed4010d89a8e9926732e012fa",
        s: "5bb260889e3bacdb322c46343bc38366b0456d36b16a452317f1361cd9ed9e9b",
        v: 28,
      });
    });

    test("should sign correctly the 3.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "3-filtered"), "utf-8");
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
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "4-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "4"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "c5de7830122a8f8cb769bc22b5c1a1ff56e5afa820125b6d67ac681361409946",
        s: "1bf9da83833f445e80a5aa1b04afe62b66f8210cf4ce77281d98dc9596af3294",
        v: 27,
      });
    });

    test("should sign correctly the 5.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "5-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "5"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "23c178dc4b78a8c6b6fc87c295927673b22862f7fbabebbeaa9b546e47c241a3",
        s: "3efa002b0409d9538ad73638baa7dbe4d2dd760f278c84fbce81ff2c06dee3d5",
        v: 28,
      });
    });

    test("should sign correctly the 6.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "6-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "6"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "0e178627d230e134ade95f4d828050bb5906d42605c085d9512ca0cb80efa3b0",
        s: "20e280cee0a50fa349a1d95708419f29ae03d34d25edd71a5faffdcfe7935251",
        v: 27,
      });
    });

    test("should sign correctly the 7.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "7-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "7"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "9d94c45d9fed0c7804c8acae6a51c1f955e26f9b97dbb0bb086ec432f6890c05",
        s: "63484ac40b7cf6d71f6764625a6eb5204554efc16fcb4990011ae9801dd5362d",
        v: 27,
      });
    });

    test("should sign correctly the 8.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "8-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "8"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "72cd1152bbd5513ebfc9cd2550395de96597bcfde23e79650caae9197f4da51a",
        s: "630f3daba6843aa7cb4f14af72648c0a40e1a96bb33e9f46288333b00662cac7",
        v: 27,
      });
    });

    test("should sign correctly the 9.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "9-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "9"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "b1e40db9bd432986de0013a55d0564a1bfc232fb25b3c3da19db3d867df2d551",
        s: "6941ad66c0ec9100f3676a4f61761509c1345fe73df16d84053420008c8d73b7",
        v: 28,
      });
    });

    test("should sign correctly the 10.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "10-filtered"), "utf-8");
      const message = await fs.readFile(getFilePath("message", "10"), "utf-8").then(JSON.parse);

      const transport = await openTransportReplayer(RecordStore.fromString(`${apdusBuffer}`));

      const eth = new Eth(transport);
      const result = await eth.signEIP712Message("44'/60'/0'/0/0", message);

      expect(result).toEqual({
        r: "bd1a1bd027e9922fba0b5f298791c70074c4fa5564b024833e885872cc6a187c",
        s: "256485b3fba419e3454006353d2de19390f0c2fc11dc819cf297bc3b7aa6a005",
        v: 27,
      });
    });

    test("should sign correctly the 11.json sample message", async () => {
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "11-filtered"), "utf-8");
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
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "12-filtered"), "utf-8");
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
      const apdusBuffer = await fs.readFile(getFilePath("apdu", "13-filtered"), "utf-8");
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
  });
});
