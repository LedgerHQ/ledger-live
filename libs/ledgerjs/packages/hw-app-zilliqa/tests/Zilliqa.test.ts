import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Zilliqa from "../src/Zilliqa";

test("Zilliqa init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const zilliqa = new Zilliqa(transport);
  expect(zilliqa).not.toBe(undefined);
});

test("getAppConfiguration", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004049000
        `)
  );
  const zilliqa = new Zilliqa(transport);
  const result = await zilliqa.getAppConfiguration();
  expect(result).toEqual({
    version: "0.4.4",
    major: 0,
    minor: 4,
    patch: 4,
  });
});

test("getAddressIndex1", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004049000
=> e00200000c010000800000008000000080
<= 02d0fa63f917e8c6504c8ed9d28669d6fab0137862c81e355af953cb884a463ab87a696c3164746d6b70636c33306566356a66303665377163656c64366a79686a326c70786468726375639000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const result = await zilliqa.getAddress("44'/313'/1'/0'/0'");
  expect(result).toEqual({
    address: "zil1dtmkpcl30ef5jf06e7qceld6jyhj2lpxdhrcuc",
    publicKey:
      "02d0fa63f917e8c6504c8ed9d28669d6fab0137862c81e355af953cb884a463ab8",
  });
});
