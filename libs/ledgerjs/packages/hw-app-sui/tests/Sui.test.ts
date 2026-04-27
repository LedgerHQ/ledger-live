import { DeviceModelId } from "@ledgerhq/devices";
import { UpdateYourApp } from "@ledgerhq/errors";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Sui from "../src/Sui";

test("Sui init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const sui = new Sui(transport);
  expect(sui).not.toBe(undefined);
});

test("getVersion", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
      => 0000000021007f9c9e31ac8256ca2f258583df262dbc7d6f68f2a03043d5c99a4ae5a7396ce9
      <= 010002029000
    `),
  );
  const sui = new Sui(transport);
  const version = await sui.getVersion();
  expect(version).toEqual({ major: 0, minor: 2, patch: 2 });
});

test("getPublicKey", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
      => 0002000021007cfea3aa1e07cc4b500c237a8bf8dcb31d5cb855f29dfdeb92f9e4df9493a6cd
      <= 012041f928e1faf1343ae9805aa2b965001f9a05acbf9eb4645333df6f21bf74fca6206e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f09000
    `),
  );
  const sui = new Sui(transport);
  const { address, publicKey } = await sui.getPublicKey("44'/784'/0'/0'/0'", false);
  expect(Buffer.from(address).toString("hex")).toEqual(
    "6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
  );
  expect(Buffer.from(publicKey).toString("hex")).toEqual(
    "41f928e1faf1343ae9805aa2b965001f9a05acbf9eb4645333df6f21bf74fca6",
  );
});

test("getPublicKey (rejected by user)", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
      => 0002000021007cfea3aa1e07cc4b500c237a8bf8dcb31d5cb855f29dfdeb92f9e4df9493a6cd
      <= 6985
    `),
  );
  const sui = new Sui(transport);
  await expect(sui.getPublicKey("44'/784'/0'/0'/0'", false)).rejects.toThrow(
    new Error("Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)"),
  );
});

// Regression: the wrapper's resolution-branch version check used to call
// `this.getVersion()`, which is gated by the same `decorateAppAPIMethods`
// lock as `signTransaction`. The re-entrant call self-deadlocked with
// "Ledger Device is busy (lock signTransaction)" before any sign APDU
// could leave the host. Routing the read through `super.getVersion()`
// bypasses the instance-level decoration and reaches the prototype directly.
test("signTransaction surfaces UpdateYourApp on outdated firmware without self-deadlocking on the API lock", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
      => 0000000021007f9c9e31ac8256ca2f258583df262dbc7d6f68f2a03043d5c99a4ae5a7396ce9
      <= 010104009000
    `),
  );
  const sui = new Sui(transport);
  await expect(
    sui.signTransaction("44'/784'/0'/0'/0'", new Uint8Array([0]), undefined, {
      deviceModelId: DeviceModelId.nanoX,
      certificateSignatureKind: "prod",
    }),
  ).rejects.toThrow(UpdateYourApp);
});
