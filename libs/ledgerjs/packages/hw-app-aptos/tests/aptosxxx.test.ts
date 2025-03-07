import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Aptos from "../src/AptosXXX";

test("getVersion", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => 5b03000000
        <= 0000019000
    `),
  );
  const aptos = new Aptos(transport);
  const result = await aptos.getVersion();
  expect(result).toEqual({
    version: "0.0.1",
  });
});

test("getAddress without display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => 5b05000015058000002c8000027d800000018000000080000000
        <= 2104d1d99b67e37b483161a0fa369c46f34a3be4863c20e20fc7cdc669c0826a41132070c750d272682024bdab22357e7091dff07583574df88850196c14e2da0209df9000
    `),
  );
  const aptos = new Aptos(transport);
  const { address } = await aptos.getAddress("m/44'/637'/1'/0'/0'", false);
  expect(address).toEqual("0x783135e8b00430253a22ba041d860c373d7a1501ccf7ac2d1ad37a8ed2775aee");
});

test("getAddress with display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => 5b05010015058000002c8000027d800000018000000080000000
        <= 2104d1d99b67e37b483161a0fa369c46f34a3be4863c20e20fc7cdc669c0826a41132070c750d272682024bdab22357e7091dff07583574df88850196c14e2da0209df9000
    `),
  );
  const aptos = new Aptos(transport);
  const { address } = await aptos.getAddress("m/44'/637'/1'/0'/0'", true);
  expect(address).toEqual("0x783135e8b00430253a22ba041d860c373d7a1501ccf7ac2d1ad37a8ed2775aee");
});

test("signTransaction", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => 5b06008015058000002c8000027d800000018000000080000000
        <= 9000
        => 5b060100f3b5e97db07fa0bd0e5598aa3643a9bc6f6693bddc1a9fec9e674a461eaa00b193783135e8b00430253a22ba041d860c373d7a1501ccf7ac2d1ad37a8ed2775aee000000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220094c6fc0d3b382a599c37e1aaa7618eff2c96a3586876082c4594c50c50d7dde082a00000000000000204e0000000000006400000000000000565c51630000000022
        <= 409f6cc54741dceafa8ef5cd11bb33bf432b3296dc516ffa7d798778dac588e2efe2974a9401a366003fd66e14ae446f1d2a9eb99d863e9cf4bf7665cd19663b079000
    `),
  );
  const aptos = new Aptos(transport);
  const transaction = Buffer.from(
    "b5e97db07fa0bd0e5598aa3643a9bc6f6693bddc1a9fec9e674a461eaa00b193783135e8b00430253a22ba041d860c373d7a1501ccf7ac2d1ad37a8ed2775aee000000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220094c6fc0d3b382a599c37e1aaa7618eff2c96a3586876082c4594c50c50d7dde082a00000000000000204e0000000000006400000000000000565c51630000000022",
    "hex",
  );
  const { signature } = await aptos.signTransaction("m/44'/637'/1'/0'/0'", transaction);
  expect(signature.toString("hex")).toEqual(
    "9f6cc54741dceafa8ef5cd11bb33bf432b3296dc516ffa7d798778dac588e2efe2974a9401a366003fd66e14ae446f1d2a9eb99d863e9cf4bf7665cd19663b07",
  );
});

test("should throw on invalid derivation path", async () => {
  const transport = await openTransportReplayer(new RecordStore());
  const aptos = new Aptos(transport);
  return expect(aptos.getAddress("some invalid derivation path", false)).rejects.toThrow("input");
});
