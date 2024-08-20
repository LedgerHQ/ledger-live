import { SignOperationEvent } from "@ledgerhq/types-live";
import { Keypair } from "@stellar/stellar-sdk";
import BigNumber from "bignumber.js";
import { subtle } from "crypto";
import coinConfig, { type StellarCoinConfig } from "../config";
import { NetworkInfo } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { StellarSigner } from "../types/signer";
import buildTransaction from "./buildTransaction";
import { buildSignOperation } from "./signOperation";

const stellarKp = Keypair.random();
const mockLoadAccount = jest.fn().mockResolvedValue(
  // Stub of Horizon.AccountResponse
  {
    id: stellarKp.publicKey(), //"GB3KJPLFUYN5VL6R3GU3EGCGVCKFDSD7BEDX42HWG5BWFKB3KQGJJRMA",
    sequence: "0",
    balances: [
      {
        balance: "1000",
        asset_type: "native", //AssetType.native,
        buying_liabilities: "",
        selling_liabilities: "",
      },
    ],
    accountId: () => stellarKp.publicKey(), //"GB3KJPLFUYN5VL6R3GU3EGCGVCKFDSD7BEDX42HWG5BWFKB3KQGJJRMA",
    sequenceNumber: () => "0",
    incrementSequenceNumber: () => "1",
  },
);
jest.mock("../network", () => ({
  ...jest.requireActual("../network"),
  loadAccount: () => mockLoadAccount(),
  fetchSequence: jest.fn(),
}));

describe.skip("signOperation", () => {
  let spySignTransaction: (addr: string, tx: Buffer) => Promise<{ signature: Buffer }>;
  const fakeSigner = {
    getPublicKey: jest.fn(),
    signTransaction: (addr: string, tx: Buffer) => spySignTransaction(addr, tx),
  };
  const signerContext = <T>(_deviceId: string, fn: (signer: StellarSigner) => Promise<T>) =>
    fn(fakeSigner);
  const signOperation = buildSignOperation(signerContext);
  const deviceId = "dummyDeviceId";

  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): StellarCoinConfig => ({
        status: { type: "active" },
        explorer: {
          url: "https://localhost",
        },
      }),
    );
  });

  // beforeEach(() => {
  // });

  it("returns events in the right order", done => {
    // GIVEN
    spySignTransaction = async (_addr: string, tx: Buffer) => {
      // const signature = stellarKp.sign(tx);
      const signature = stellarKp.signDecorated(tx).toXDR();
      const hashSig = await subtle.digest("SHA-256", signature);
      const hash = Buffer.from(hashSig);
      // expect(stellarKp.verify(tx, hash)).toBeTruthy();
      return Promise.resolve({ signature: hash });
    };
    const account = createFixtureAccount({
      freshAddress: stellarKp.publicKey(),
      freshAddressPath: stellarKp.publicKey(),
    });
    const transaction = createFixtureTransaction({
      amount: BigNumber(1),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
    });

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
    buildTransaction(account, transaction).then(unsigned => {
      const sig = stellarKp.sign(unsigned.hash());
      expect(stellarKp.verify(unsigned.hash(), sig)).toBeTruthy();
      unsigned.addSignature(stellarKp.publicKey(), sig.toString("base64"));
    });

    signOperation({ account, deviceId, transaction }).forEach(e => {
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

  it.skip("returns signature value from LedgerSigner", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({
      amount: BigNumber(1),
      fees: BigNumber(1),
      networkInfo: { family: "stellar" } as NetworkInfo,
    });

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "signed") {
          const signature = e.signedOperation.signature;
          expect(signature).toEqual("SBYTES");

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });
});
