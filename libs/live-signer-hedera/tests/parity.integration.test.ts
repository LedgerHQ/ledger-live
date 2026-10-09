import {
  ApduResponse,
  DeviceActionStatus,
  isSuccessCommandResult,
  type Command,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import Transport from "@ledgerhq/hw-transport";
import { UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import { of } from "rxjs";
import { DmkSignerHedera } from "../src/DmkSignerHedera";
import { LegacySignerHedera } from "../src/LegacySignerHedera";
import {
  createFakeHederaApp,
  publicKeyFor,
  signatureFor,
  type FakeHederaApp,
} from "./fakeHederaApp";

class FakeTransport extends Transport {
  constructor(private readonly app: FakeHederaApp) {
    super();
  }

  override async exchange(apdu: Buffer): Promise<Buffer> {
    const { data, statusCode } = this.app.exchange(Uint8Array.from(apdu));
    return Buffer.concat([Buffer.from(data), Buffer.from(statusCode)]);
  }
}

const fakeDmk = (app: FakeHederaApp) =>
  ({
    executeDeviceAction: ({
      deviceAction,
    }: {
      deviceAction: { input: { command: Command<unknown, unknown, unknown> } };
    }) => {
      const { command } = deviceAction.input;
      const result = command.parseResponse(
        new ApduResponse(app.exchange(command.getApdu().getRawApdu())),
      );
      return {
        observable: of(
          isSuccessCommandResult(result)
            ? { status: DeviceActionStatus.Completed, output: result.data }
            : { status: DeviceActionStatus.Error, error: result.error },
        ),
        cancel: jest.fn(),
      };
    },
  }) as unknown as DeviceManagementKit;

const PATH = "44/3030";
const BODY = Uint8Array.from(
  Buffer.from("0a0e0a0808b2d6c1a5061000120218021202180318c0843d", "hex"),
);

describe("DmkSignerHedera parity with hw-app-hedera", () => {
  let legacyApp: FakeHederaApp;
  let dmkApp: FakeHederaApp;
  let legacy: LegacySignerHedera;
  let dmk: DmkSignerHedera;

  beforeEach(() => {
    legacyApp = createFakeHederaApp();
    dmkApp = createFakeHederaApp();
    legacy = new LegacySignerHedera(new FakeTransport(legacyApp));
    dmk = new DmkSignerHedera(fakeDmk(dmkApp), "sessionId");
  });

  it("should derive the same public key, key index 0, from Ledger Live's path", async () => {
    const [legacyKey, dmkKey] = await Promise.all([
      legacy.getPublicKey(PATH),
      dmk.getPublicKey(PATH),
    ]);

    expect(dmkKey).toBe(legacyKey);
    expect(dmkKey).toBe(Buffer.from(publicKeyFor(0)).toString("hex"));
  });

  it("should read the public key with the same silent APDU header as hw-app-hedera, only re-encoding the key index", async () => {
    await legacy.getPublicKey(PATH);
    await dmk.getPublicKey(PATH);

    expect(Array.from(dmkApp.received[0].slice(0, 4))).toEqual(
      Array.from(legacyApp.received[0].slice(0, 4)),
    );
    expect(Array.from(dmkApp.received[0].slice(4))).toEqual([0x04, 0, 0, 0, 0]);
  });

  it("should send a byte-identical sign APDU and return the same signature", async () => {
    const legacySignature = await legacy.signTransaction(BODY);
    const dmkSignature = await dmk.signTransaction(BODY);

    expect(Array.from(dmkApp.received[0])).toEqual(Array.from(legacyApp.received[0]));
    expect(Array.from(dmkSignature)).toEqual(Array.from(legacySignature));
    expect(dmkSignature).toEqual(signatureFor(0, BODY));
  });

  it("should sign with the same key the public key was read from", async () => {
    await dmk.getPublicKey(PATH);
    await dmk.signTransaction(BODY);

    const keyIndexOf = (apdu: Uint8Array) => new DataView(apdu.buffer, 5, 4).getUint32(0, true);
    expect(keyIndexOf(dmkApp.received[0])).toBe(keyIndexOf(dmkApp.received[1]));
  });

  it("should turn a refusal to sign into UserRefusedOnDevice", async () => {
    dmkApp.rejectNext();

    await expect(dmk.signTransaction(BODY)).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("should refuse a transaction that cannot fit one APDU, as hw-app-hedera does", async () => {
    const oversized = new Uint8Array(252);

    await expect(legacy.signTransaction(oversized)).rejects.toThrow();
    await expect(dmk.signTransaction(oversized)).rejects.toThrow("the device accepts at most 251");
    expect(dmkApp.received).toHaveLength(0);
  });
});
