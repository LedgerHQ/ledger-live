import BigNumber from "bignumber.js";
import { OpKind, TezosToolkit } from "@taquito/taquito";
import { SignOperationEvent } from "@ledgerhq/types-live";
import buildSignOperation, { getOperationContents } from "./signOperation";
import { TezosSigner, Transaction } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";

const mockForgeOperations = jest.fn().mockResolvedValue("FORGED_OP");
jest.mock("@taquito/taquito", () => ({
  ...jest.requireActual("@taquito/taquito"),
  TezosToolkit: jest.fn().mockReturnValue({
    setProvider: jest.fn(),
    rpc: {
      getBlock: jest.fn().mockResolvedValue({ hash: "hash" }),
      getContract: jest.fn().mockResolvedValue({ counter: "12" }),
      forgeOperations: () => mockForgeOperations(),
    },
  }),
}));

describe("signOperation", () => {
  const mockSign = jest.fn().mockResolvedValue({
    bytes: "SIG_BYTES",
    sig: "SIG",
    prefixSig: "PREFIX_SIG",
    sbytes: "03SBYTES",
  });
  const fakeSigner = {
    getAddress: jest.fn(),
    signOperation: jest.fn(),
    createLedgerSigner: () => ({
      publicKey: () => Promise.resolve("PUBKEY"),
      publicKeyHash: () => Promise.resolve("PUBKEYHASH"),
      sign: () => mockSign(),
      secretKey: () => Promise.resolve(undefined),
    }),
  };
  const signerContext = <T>(_deviceId: string, fn: (signer: TezosSigner) => Promise<T>) =>
    fn(fakeSigner);
  const signOperation = buildSignOperation(signerContext);
  const deviceId = "dummyDeviceId";

  afterEach(() => {
    mockForgeOperations.mockClear();
    mockSign.mockClear();
  });

  it("returns events in the right order", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ fees: BigNumber(0) });

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

  it("returns signature value from LedgerSigner", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ fees: new BigNumber(0) });

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "signed") {
          const signature = e.signedOperation.signature;
          expect(signature).toEqual("SBYTES");
          expect(mockSign).toHaveBeenCalledTimes(1);
          expect(mockForgeOperations).toHaveBeenCalledTimes(1);

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });
});

describe("getOperationContents - revealed account", () => {
  const tezos = new TezosToolkit("MOCK_API_KEY");
  const account = createFixtureAccount({ freshAddress: "tz1addr" });

  it("mode - send", async () => {
    const transaction = createFixtureTransaction({
      family: "tezos",
      amount: new BigNumber(0),
      recipient: "RECIPIENT_ADD",
      fees: new BigNumber(0),
      mode: "send",
      gasLimit: new BigNumber(0),
      storageLimit: new BigNumber(0),
    });

    const { type, contents } = await getOperationContents({
      account,
      transaction,
      tezos,
      counter: 0,
      public_key: "pk",
      public_key_hash: "pkh",
    });

    expect(type).toBe("OUT");
    expect(contents.length).toEqual(1);
    expect(contents).toStrictEqual([
      {
        kind: OpKind.TRANSACTION,
        amount: transaction.amount.toString(),
        destination: transaction.recipient,
        source: "tz1addr",
        counter: "1",
        fee: new BigNumber(0).toString(),
        gas_limit: new BigNumber(0).toString(),
        storage_limit: new BigNumber(0).toString(),
      },
    ]);
  });

  it("mode - delegate", async () => {
    const transaction = createFixtureTransaction({
      family: "tezos",
      amount: new BigNumber(0),
      recipient: "RECIPIENT_ADD",
      fees: new BigNumber(0),
      mode: "delegate",
      gasLimit: new BigNumber(0),
      storageLimit: new BigNumber(0),
    });

    const { type, contents } = await getOperationContents({
      account,
      transaction,
      tezos,
      counter: 0,
      public_key: "pk",
      public_key_hash: "pkh",
    });

    expect(type).toBe("DELEGATE");
    expect(contents.length).toEqual(1);
    expect(contents).toStrictEqual([
      {
        kind: OpKind.DELEGATION,
        source: "tz1addr",
        counter: "1",
        fee: new BigNumber(0).toString(),
        gas_limit: new BigNumber(0).toString(),
        storage_limit: new BigNumber(0).toString(),
        delegate: transaction.recipient,
      },
    ]);
  });

  it("mode - undelegate", async () => {
    const transaction = createFixtureTransaction({
      family: "tezos",
      amount: new BigNumber(0),
      recipient: "",
      fees: new BigNumber(0),
      mode: "undelegate",
      gasLimit: new BigNumber(0),
      storageLimit: new BigNumber(0),
    });

    const { type, contents } = await getOperationContents({
      account,
      transaction,
      tezos,
      counter: 0,
      public_key: "pk",
      public_key_hash: "pkh",
    });

    expect(type).toBe("UNDELEGATE");
    expect(contents.length).toEqual(1);
    expect(contents).toStrictEqual([
      {
        kind: OpKind.DELEGATION,
        source: "tz1addr",
        counter: "1",
        fee: new BigNumber(0).toString(),
        gas_limit: new BigNumber(0).toString(),
        storage_limit: new BigNumber(0).toString(),
      },
    ]);
  });
});
