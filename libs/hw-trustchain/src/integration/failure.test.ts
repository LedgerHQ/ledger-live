import {
  CommandStream,
  crypto,
  device,
  APDU,
  CommandBlock,
  CommandStreamEncoder,
  Seed,
  TRUSTCHAIN_APP_NAME,
} from "..";
import {
  createSpeculosDevice,
  releaseSpeculosDevice,
  SpeculosDevice,
  DeviceModelId,
} from "@ledgerhq/speculos-transport";
import { setEnv } from "@ledgerhq/live-env";

/*
import { listen } from "@ledgerhq/logs";
listen(log => {
  console.log(log.type + ": " + log.message);
});
*/
setEnv("SPECULOS_PID_OFFSET", 20); // since two tests are running in parallel, we need to increase the counter

const DEFAULT_TOPIC = "c96d450545ff2836204c29af291428a5bf740304978f5dfb0b4a261474192851";

let speculos: SpeculosDevice;

beforeAll(
  async () => {
    speculos = await createSpeculosDevice({
      model: DeviceModelId.nanoSP,
      firmware: "2.1.0",
      appName: TRUSTCHAIN_APP_NAME,
      appVersion: "0.0.1",
      seed: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      coinapps: __dirname,
      overridesAppPath: "app.elf",
    });
  },
  5 * 60 * 1000, // speculos pull instance can be long
);

afterAll(async () => {
  releaseSpeculosDevice(speculos.id);
});

describe("Failure scenarios (hijack signature flow)", () => {
  it("should fail to sign an empty block", async () => {
    const alice = device.apdu(speculos.transport);
    const topic = crypto.from_hex(DEFAULT_TOPIC);
    expect(topic).not.toBe(null);

    const stream = new CommandStream([]);
    expect(stream).not.toBe(null);

    await expectFailure(stream.issue(alice, []));
  });

  it("should fail to sign a block when bypassing a command parsing", async () => {
    const alice = device.apdu(speculos.transport);
    expect(alice).not.toBe(null);

    const sessionKey = await crypto.randomKeypair();
    // Create a block
    const block: CommandBlock = {
      version: 0,
      parent: await crypto.randomBytes(32),
      issuer: new Uint8Array(33),
      commands: [
        new Seed(
          crypto.from_hex(DEFAULT_TOPIC),
          0,
          new Uint8Array(33),
          new Uint8Array(16),
          new Uint8Array(65),
          new Uint8Array(33),
        ),
      ],
      signature: new Uint8Array(0),
    };

    // Implement sign flow
    await APDU.initFlow(speculos.transport, sessionKey.publicKey);
    await APDU.signBlockHeader(speculos.transport, CommandStreamEncoder.encodeBlockHeader(block));

    // Directly sign without parsing the command
    await expectFailure(APDU.finalizeSignature(speculos.transport));
  });

  it("should fail to sign command when bypassing header signing", async () => {
    const alice = device.apdu(speculos.transport);
    expect(alice).not.toBe(null);

    const sessionKey = await crypto.randomKeypair();
    // Create a block
    const block: CommandBlock = {
      version: 0,
      parent: await crypto.randomBytes(32),
      issuer: new Uint8Array(33),
      commands: [
        new Seed(
          crypto.from_hex(DEFAULT_TOPIC),
          0,
          new Uint8Array(33),
          new Uint8Array(16),
          new Uint8Array(65),
          new Uint8Array(33),
        ),
      ],
      signature: new Uint8Array(0),
    };

    // Implement sign flow
    await APDU.initFlow(speculos.transport, sessionKey.publicKey);

    // Directly sign without parsing the command
    await expectFailure(
      APDU.signCommand(speculos.transport, CommandStreamEncoder.encodeCommand(block, 0)),
    );
  });

  it("should fail to sign when the flow was not initialiazed (sign block header)", async () => {
    const alice = device.apdu(speculos.transport);
    expect(alice).not.toBe(null);

    // Create a block
    const block: CommandBlock = {
      version: 0,
      parent: await crypto.randomBytes(32),
      issuer: new Uint8Array(33),
      commands: [
        new Seed(
          crypto.from_hex(DEFAULT_TOPIC),
          0,
          new Uint8Array(33),
          new Uint8Array(16),
          new Uint8Array(65),
          new Uint8Array(33),
        ),
      ],
      signature: new Uint8Array(0),
    };
    // Implement sign flow

    // Directly sign block header without init
    await expectFailure(
      APDU.signBlockHeader(speculos.transport, CommandStreamEncoder.encodeBlockHeader(block)),
    );
  });

  it("should fail to sign when the flow was not initialized (sign block)", async () => {
    const alice = device.apdu(speculos.transport);

    expect(alice).not.toBe(null);

    // Directly sign block without init
    await expectFailure(APDU.finalizeSignature(speculos.transport));
  });
});

async function expectFailure(promise: Promise<any>): Promise<void> {
  try {
    await promise;
  } catch (e) {
    return;
  }
  fail("Signature flow should have failed");
}
