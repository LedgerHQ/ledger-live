import BigNumber from "bignumber.js";
import { DEFAULT_FEE, OpKind } from "@taquito/taquito";
import { SignOperationEvent } from "@ledgerhq/types-live";
import buildSignOperation, { getOperationContents } from "./signOperation";
import config, { type TezosCoinConfig } from "../config";
import { TezosSigner } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";

const mockForgeOperations = jest.fn();
const mockEstimateReveal = jest.fn();
jest.mock("@taquito/taquito", () => ({
  ...jest.requireActual("@taquito/taquito"),
  TezosToolkit: jest.fn().mockReturnValue({
    setProvider: jest.fn(),
    rpc: {
      getBlock: jest.fn().mockResolvedValue({ hash: "hash" }),
      getContract: jest.fn().mockResolvedValue({ counter: "12" }),
      forgeOperations: () => mockForgeOperations(),
    },
    estimate: {
      reveal: () => mockEstimateReveal(),
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
      sign: (arg: unknown) => mockSign(arg),
      secretKey: () => Promise.resolve(undefined),
    }),
  };
  const signerContext = <T>(_deviceId: string, fn: (signer: TezosSigner) => Promise<T>) =>
    fn(fakeSigner);
  const signOperation = buildSignOperation(signerContext);
  const deviceId = "dummyDeviceId";

  beforeAll(() => {
    config.setCoinConfig(
      (): TezosCoinConfig => ({
        status: { type: "active" },
        baker: {
          url: "https://httpbin.org",
        },
        explorer: {
          url: "https://httpbin.org",
          maxTxQuery: 100,
        },
        node: {
          url: "https://httpbin.org",
        },
      }),
    );
  });

  afterEach(() => {
    mockForgeOperations.mockClear();
    mockEstimateReveal.mockClear();
    mockSign.mockClear();
  });

  it("returns events in the right order", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ fees: BigNumber(0) });
    mockForgeOperations.mockResolvedValue("FORGED_OP");

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
    mockForgeOperations.mockResolvedValue("f0463d");

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "signed") {
          const signature = e.signedOperation.signature;
          expect(signature).toEqual("SBYTES");
          expect(mockForgeOperations).toHaveBeenCalledTimes(1);
          expect(mockSign).toHaveBeenCalledTimes(1);
          expect(mockSign.mock.lastCall[0]).toEqual(
            Buffer.concat([Buffer.from("03", "hex"), Buffer.from("f0463d", "hex")]).toString("hex"),
          );

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });
});

describe("getOperationContents - revealed account", () => {
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
    expect(mockEstimateReveal).not.toHaveBeenCalled();
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
    expect(mockEstimateReveal).not.toHaveBeenCalled();
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
    expect(mockEstimateReveal).not.toHaveBeenCalled();
  });

  describe("getOperationContents - not revealed account", () => {
    const account = createFixtureAccount({
      freshAddress: "tz1addr",
      // We don't use `counter` in the OperationContents computation
      tezosResources: { revealed: false, counter: -10 },
    });

    it("mode - send", async () => {
      // Given
      mockEstimateReveal.mockResolvedValue({
        gasLimit: 100,
        storageLimit: 200,
      });
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
        counter: 0,
        public_key: "pk",
        public_key_hash: "pkh",
      });

      expect(type).toBe("OUT");
      expect(contents.length).toEqual(2);
      expect(contents).toStrictEqual([
        {
          kind: OpKind.REVEAL,
          fee: DEFAULT_FEE.REVEAL.toString(),
          gas_limit: "100",
          storage_limit: "200",
          source: "pkh",
          counter: "1",
          public_key: "pk",
        },
        {
          kind: OpKind.TRANSACTION,
          amount: transaction.amount.toString(),
          destination: transaction.recipient,
          source: "tz1addr",
          counter: "2",
          fee: new BigNumber(0).toString(),
          gas_limit: new BigNumber(0).toString(),
          storage_limit: new BigNumber(0).toString(),
        },
      ]);
      expect(mockEstimateReveal).toHaveBeenCalledTimes(1);
    });
  });
});
