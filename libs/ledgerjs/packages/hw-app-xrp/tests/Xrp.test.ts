import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Xrp from "../src/Xrp";

test("getAppConfiguration", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e006000000
    <= 000100069000
    `)
  );
  const xrp = new Xrp(transport);
  const result = await xrp.getAppConfiguration();
  expect(result).toEqual({ version: "1.0.6" });
});

test("getPublicKey", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e002004015058000002c80000090800000000000000000000000
    <= 21031d68bc1a142e6766b2bdfb006ccfe135ef2e0e2e94abb5cf5c9ab6104776fbae227248734d4751456b564e4a6d70475773385855426f54426941416277785a4e3576339000
    `)
  );
  const xrp = new Xrp(transport);
  const result = await xrp.getAddress("44'/144'/0'/0/0");
  expect(result).toEqual({
    address: "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3",
    publicKey:
      "031d68bc1a142e6766b2bdfb006ccfe135ef2e0e2e94abb5cf5c9ab6104776fbae",
  });
});

test("signTransaction", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e004004083058000002c8000009080000000000000000000000012000022800000002400000002614000000001315d3468400000000000000c73210324e5f600b52bb3d9246d49c4ab1722ba7f32b7a3e4f9f2b8a1a28b9118cc36c48114f31b152151b6f42c1d61fe4139d34b424c8647d183142ecfc1831f6e979c6da907e88b1cad602db59e2f
    <= 3044022041673ea6da17205b9b0d279436b508cd092b686bf5b921ddf4fbf38879e4950402207510cebf32019f5d994102bfe6570bb2f5d0b931902ad6d839c5b4552a492cb99000
    `)
  );
  const xrp = new Xrp(transport);
  const result = await xrp.signTransaction(
    "44'/144'/0'/0/0",
    "12000022800000002400000002614000000001315D3468400000000000000C73210324E5F600B52BB3D9246D49C4AB1722BA7F32B7A3E4F9F2B8A1A28B9118CC36C48114F31B152151B6F42C1D61FE4139D34B424C8647D183142ECFC1831F6E979C6DA907E88B1CAD602DB59E2F"
  );
  expect(result).toEqual(
    "3044022041673ea6da17205b9b0d279436b508cd092b686bf5b921ddf4fbf38879e4950402207510cebf32019f5d994102bfe6570bb2f5d0b931902ad6d839c5b4552a492cb9"
  );
});
