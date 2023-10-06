import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Vet from "../src/Vet";
import { Transaction as ThorTransaction } from "thor-devkit";

test("getAppConfiguration", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e006000000
    <= 030100079000
    `)
  );
  const vet = new Vet(transport);
  const result = await vet.getAppConfiguration();
  expect({ version: result[1] + "." + result[2] + "." + result[3] }).toEqual({
    version: "1.0.7",
  });
});

test("Get address", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
          => e002000015058000002c80000332800000000000000000000000
          <= 410482c44bc99cdf08d4360c97fbf62d387288ab75c576926943ad90059002720e93f58799391393c98ad41136aa4ac871b103d25cb9a88f1aadd7dbbe3c7794888928333234373631393364346133323438383332326666426239383335613763463263376532323032439000
      `)
  );
  const vet = new Vet(transport);
  const { address } = await vet.getAddress("44'/818'/0'/0/0");
  expect(address).toEqual("0x32476193d4a32488322ffbb9835a7cf2c7e2202c");
});

test("signMessage", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e004000037058000002c80000332800000000000000000000000e1278012d8d7940000000000000000000000000000000000000000808080808080c0
        <= dd0ad907f6cfdd068226999eee0d20789732905270a7c4ed385872599f40978e043a5d7a15e396e59e9c9e921be5f4e02e3b6284b8cf835443f4123ca20b5b35009000
    `)
  );

  const unsigned = new ThorTransaction({
    chainTag: 39,
    blockRef: "0x0000000000000000",
    expiration: 18,
    clauses: [
      {
        to: "0x0000000000000000000000000000000000000000",
        value: "0",
        data: "0x",
      },
    ],
    gasPriceCoef: 0,
    gas: "0",
    dependsOn: null,
    nonce: 0,
  });

  const vet = new Vet(transport);
  const res = await vet.signTransaction(
    "44'/818'/0'/0/0",
    unsigned.encode().toString("hex")
  );

  expect(res.toString("hex")).toEqual(
    "dd0ad907f6cfdd068226999eee0d20789732905270a7c4ed385872599f40978e043a5d7a15e396e59e9c9e921be5f4e02e3b6284b8cf835443f4123ca20b5b3500"
  );
});
