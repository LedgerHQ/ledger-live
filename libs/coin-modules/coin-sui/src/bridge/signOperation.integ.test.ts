import { getEnv } from "@ledgerhq/live-env";
import coinConfig from "../config";
import { SuiSigner } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import buildSignOperation from "./signOperation";

describe("signOperation", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: getEnv("API_SUI_NODE_PROXY"),
      },
    }));
  });

  const fakeSignature = new Uint8Array(64).fill(0x42);
  const fakeSigner = {
    getPublicKey: jest.fn().mockResolvedValue({
      publicKey: new Uint8Array(32).fill(0x01),
      address: "0x1234567890abcdef",
    }),
    signTransaction: jest.fn().mockResolvedValue({
      signature: fakeSignature,
    }),
    getVersion: jest.fn().mockResolvedValue({ major: 0, minor: 1, patch: 0 }),
    transport: {} as any,
  } as unknown as SuiSigner;
  const signerContext = <T>(_deviceId: string, fn: (signer: SuiSigner) => Promise<T>) =>
    fn(fakeSigner);
  const signOperation = buildSignOperation(signerContext);
  const deviceId = "dummyDeviceId";

  it("returns events in the right order", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    // WHEN & THEN
    const expectedEvent = [
      {
        type: "device-signature-requested",
      },
      {
        type: "device-signature-granted",
      },
      {
        type: "signed",
      },
    ];
    let eventIdx = 0;

    signOperation({ account, deviceId, transaction }).forEach((e: { type: string }) => {
      try {
        expect(e.type).toEqual(expectedEvent[eventIdx].type);
        eventIdx++;

        if (eventIdx === expectedEvent.length) {
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });

  it("throws an error of transaction has no fees", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ fees: undefined });

    // WHEN & THEN
    const observer = {
      error: (e: Error) => {
        expect(e.name).toMatch("FeeNotLoaded");
        done();
      },
    };
    signOperation({ account, deviceId, transaction }).subscribe(observer);
  });
});
