import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Solana from "../src/Solana";

test("getAppConfiguration", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
            => e004000000
            <= 00000100069000
        `)
  );
  const solana = new Solana(transport);
  const result = await solana.getAppConfiguration();
  expect(result).toEqual({
    version: "1.0.6",
    blindSigningEnabled: false,
    pubKeyDisplayMode: 0,
  });
});

test("getAddress without display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
            => e005000015058000002c800001f5800000008000000080000000
            <= 4d65a10662b9759d62bb59048366705454654cf4f9b4b3525cf314429e46c6919000
        `)
  );
  const solana = new Solana(transport);
  const { address } = await solana.getAddress("44'/501'/0'/0'/0'", false);
  expect(address.toString("hex")).toEqual(
    "4d65a10662b9759d62bb59048366705454654cf4f9b4b3525cf314429e46c691"
  );
});

test("getAddress with display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
            => e005010015058000002c800001f5800000008000000080000000
            <= 4d65a10662b9759d62bb59048366705454654cf4f9b4b3525cf314429e46c6919000
        `)
  );
  const solana = new Solana(transport);
  const { address } = await solana.getAddress("44'/501'/0'/0'/0'", true);
  expect(address.toString("hex")).toEqual(
    "4d65a10662b9759d62bb59048366705454654cf4f9b4b3525cf314429e46c691"
  );
});

test("signTransaction", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e0060100a001028000002c800001f5010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000
    <= 1ad0702faddc8b2072c59547637c10e6affad2f186b69cf3288f2b029de2e309e1d73b73eb925a79f7b0d026ee07203d714e15807267001fbd3914de76a5490e9000
    `)
  );
  const solana = new Solana(transport);
  const transaction = Buffer.from(
    "010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030301020200010c020000002a00000000000000",
    "hex"
  );
  const { signature } = await solana.signTransaction("44'/501'", transaction);
  const result = signature.toString("hex");
  expect(result).toEqual(
    "1ad0702faddc8b2072c59547637c10e6affad2f186b69cf3288f2b029de2e309e1d73b73eb925a79f7b0d026ee07203d714e15807267001fbd3914de76a5490e"
  );
});

test("signOffchainMessage", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e00701003a01028000002c800001f5ff736f6c616e61206f6666636861696e00001c004c6f6e67204f66662d436861696e2054657374204d6573736167652e
    <= dd23d8f798aeb0085f97f3aae20e52866bf529e0d880959784ff0e91beaf6f2eb73b7b0ef484801399066b92561f6c523b27f9579e17d0f8106b33edc5f45b079000
    `)
  );
  const solana = new Solana(transport);
  const message = Buffer.from(
    "ff736f6c616e61206f6666636861696e00001c004c6f6e67204f66662d436861696e2054657374204d6573736167652e",
    "hex"
  );
  const { signature } = await solana.signOffchainMessage("44'/501'", message);
  const result = signature.toString("hex");
  expect(result).toEqual(
    "dd23d8f798aeb0085f97f3aae20e52866bf529e0d880959784ff0e91beaf6f2eb73b7b0ef484801399066b92561f6c523b27f9579e17d0f8106b33edc5f45b07"
  );
});

test("chunked payload (payload length > MAX_PAYLOAD)", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
            => e0060102ff01028000002c800001f5010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030307020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a
            <= 9000
            => e00601010700000000000000
            <= d9ed529ab24ab4e796c006cf85e7e51db85825b31d3477dd3bf8350745b7a9cdc29840442d96dbeca73289a06841655d9f5c342bd6f697dcfdb6dadf8a0784049000
        `)
  );
  const solana = new Solana(transport);
  const transaction = Buffer.from(
    "010001035eb9862fe23e544a2a0969cc157cb31fd72901cc2824d536a67fb8ee911e02363b9ba3a2ebaf40c1cd672a80a8e1932b982cca8264be33c39359701e113c3da20000000000000000000000000000000000000000000000000000000000000000030303030303030303030303030303030303030303030303030303030303030307020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000020200010c020000002a00000000000000",
    "hex"
  );
  const { signature } = await solana.signTransaction("44'/501'", transaction);
  const result = signature.toString("hex");
  expect(result).toEqual(
    "d9ed529ab24ab4e796c006cf85e7e51db85825b31d3477dd3bf8350745b7a9cdc29840442d96dbeca73289a06841655d9f5c342bd6f697dcfdb6dadf8a078404"
  );
});

test("should throw on invalid derivation path", async () => {
  const transport = await openTransportReplayer(new RecordStore());
  const solana = new Solana(transport);
  return expect(
    solana.getAddress("some invalid derivation path", false)
  ).rejects.toThrow("input");
});

test("report blind signature required", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
            => e004000000
            <= 6808
        `)
  );
  const solana = new Solana(transport);

  return expect(solana.getAppConfiguration()).rejects.toThrow(
    "blind signature"
  );
});
