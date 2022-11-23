import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Zilliqa from "../src/Zilliqa";
import { UserRefusedOnDevice } from "@ledgerhq/errors";

class NoErrorThrownError extends Error {}
const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();

    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};

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
    fullProtocol: false,
  });
});

test("validPath", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () => await zilliqa.getAddress("45'/313'/9'/0'/0/0/0/0")
  );
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe("Only valid BIP44 paths are supported.");
});

test("onlyPurpose44", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () => await zilliqa.getAddress("45'/313'/9'/0'/0")
  );
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe(
    "Only wallets with hardened purpose 44 are supported."
  );
});

test("onlyZilliqaCoin", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () => await zilliqa.getAddress("44'/314'/9'/0'/0")
  );
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe("Only coin 313' is supported.");
});

test("onlyZilliqaHardened", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () => await zilliqa.getAddress("44'/313/9'/0'/0")
  );
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe("Only coin 313' is supported.");
});

test("onlyHardenedAccounts", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () => await zilliqa.getAddress("44'/313'/9/0'/0")
  );
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe(
    "Wallet does not allow softened accounts. Please harden by adding '."
  );
});

test("getAddressLegacyIndex1", async () => {
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

test("getAddressLegacyIndex2", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004049000
=> e00200000c090000800000008000000080
<= 022bd1398de96097bad4e776cc3c15c1440a8bfb1de9bd35f95d31e40458d60d7d7a696c313239783768756768306578756e763478637a72306a356e6e30777a70356e30683472397535619000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const result = await zilliqa.getAddress("44'/313'/9'/0'/0'");
  expect(result).toEqual({
    address: "zil129x7hugh0exunv4xczr0j5nn0wzp5n0h4r9u5a",
    publicKey:
      "022bd1398de96097bad4e776cc3c15c1440a8bfb1de9bd35f95d31e40458d60d7d",
  });
});

test("getAddressLegacyInccorrectChange", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004049000
=> e00200000c090000800000008000000080
<= 022bd1398de96097bad4e776cc3c15c1440a8bfb1de9bd35f95d31e40458d60d7d7a696c313239783768756768306578756e763478637a72306a356e6e30777a70356e30683472397535619000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () => await zilliqa.getAddress("44'/313'/9'/0'/0")
  );
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe(
    "Path 'index' must be hardended and equal to zero"
  );
});

test("getAddressLegacyInccorrectIndex", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004049000
=> e00200000c090000800000008000000080
<= 022bd1398de96097bad4e776cc3c15c1440a8bfb1de9bd35f95d31e40458d60d7d7a696c313239783768756768306578756e763478637a72306a356e6e30777a70356e30683472397535619000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () => await zilliqa.getAddress("44'/313'/9'/0/0'")
  );
  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe(
    "Path 'change' must be hardended and equal to zero"
  );
});

///
// Future versions

test("getAddressFuture", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0005009000
=> e00200000c000000800000000000000000
<= 03853700fb316184febef12161af5b0b80323e9f546a0b2fc915d77c40408d41457a696c3170656d346a346b736a7375673778386432673933386d6333366e653534796b6b716b736d326c9000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const result = await zilliqa.getAddress("44'/313'/0'/0/0");
  expect(result).toEqual({
    address: "zil1pem4j4ksjsug7x8d2g938mc36ne54ykkqksm2l",
    publicKey:
      "03853700fb316184febef12161af5b0b80323e9f546a0b2fc915d77c40408d4145",
  });
});

test("signMessage1", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004029000
=> e008000024000000806f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f
<= 86f03ee9202704820efbb97c16d64b407393952263be88bfdbf65a58b17b9148a3139db23197f667c6d380de60a602a473b52186230bf94bdafda44a2e88456f9000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const result = await zilliqa.signMessage(
    "44'/313'/0'/0'/0'",
    "6f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f"
  );
  expect(result).toEqual({
    returnCode: 36864,
    signature: Buffer.from(
      "86f03ee9202704820efbb97c16d64b407393952263be88bfdbf65a58b17b9148a3139db23197f667c6d380de60a602a473b52186230bf94bdafda44a2e88456f",
      "hex"
    ),
  });
});

test("signMessage2", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004029000
=> e008000024090000806f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f
<= 11b4f7374b937e8742534e46f274e62130bb2853029b29d8bcbb92468f50004c55db9d7451598ea8966c60a9c95ae9dde803556397f3224af6820383f94abd089000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const result = await zilliqa.signMessage(
    "44'/313'/9'/0'/0'",
    "6f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f"
  );
  expect(result).toEqual({
    returnCode: 36864,
    signature: Buffer.from(
      "11b4f7374b937e8742534e46f274e62130bb2853029b29d8bcbb92468f50004c55db9d7451598ea8966c60a9c95ae9dde803556397f3224af6820383f94abd08",
      "hex"
    ),
  });
});

test("signMessageRejected", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004029000
=> e008000024000000806f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f
<= 6985
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () =>
      await zilliqa.signMessage(
        "44'/313'/0'/0'/0'",
        "6f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f"
      )
  );

  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error).toBeInstanceOf(UserRefusedOnDevice);
});

test("signMessageChangeNotHardened", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004029000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () =>
      await zilliqa.signMessage(
        "44'/313'/9'/0/0'",
        "6f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f"
      )
  );

  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe(
    "Path 'change' must be hardended and equal to zero"
  );
});

test("signMessageIndexNotHardened", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
=> e001000000
<= 0004029000
`)
  );
  const zilliqa = new Zilliqa(transport);
  const error: Error | NoErrorThrownError = await getError(
    async () =>
      await zilliqa.signMessage(
        "44'/313'/9'/0'/0",
        "6f249e6e1aa2a859e3a0fda7c44ad64183c2ce2ac5e34a84c8c9d8a7037cdb6f"
      )
  );

  expect(error).not.toBeInstanceOf(NoErrorThrownError);
  expect(error.message).toBe(
    "Path 'index' must be hardended and equal to zero"
  );
});
