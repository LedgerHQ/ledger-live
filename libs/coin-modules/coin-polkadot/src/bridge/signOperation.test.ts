import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { u8aConcat } from "@polkadot/util";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { createRegistryAndExtrinsics } from "../network/common";
import {
  fixtureChainSpec,
  fixtureTransactionParams,
  fixtureTxMaterialWithMetadata,
} from "../network/sidecar.fixture";
import type { PolkadotOperationMode, PolkadotSigner, PolkadotOperationExtra } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import buildSignOperation from "./signOperation";

jest.mock("../config");
const mockGetConfig = jest.mocked(coinConfig.getCoinConfig);
const mockRegistry = jest
  .fn()
  .mockResolvedValue(createRegistryAndExtrinsics(fixtureTxMaterialWithMetadata, fixtureChainSpec));
const mockTransactionParams = jest.fn().mockResolvedValue(fixtureTransactionParams);
const mockPaymentInfo = jest.fn().mockResolvedValue({
  weight: "WHATEVER",
  class: "WHATEVER",
  partialFee: "155099814",
});

const shortenMetadataMock = jest.fn();
jest.mock("../network", () => ({
  ...jest.requireActual("../network").default,
  metadataHash: () => jest.fn().mockResolvedValue(""),
  shortenMetadata: (transaction: string, currency?: CryptoCurrency) =>
    shortenMetadataMock(transaction, currency),
}));
jest.mock("../network/sidecar", () => ({
  getRegistry: () => mockRegistry(),
  paymentInfo: (args: any) => mockPaymentInfo(args),
  getTransactionParams: () => mockTransactionParams(),
  fetchTransactionMaterial: () => fixtureTxMaterialWithMetadata,
}));

describe("signOperation", () => {
  // Global setup
  const fakeSignature = u8aConcat(new Uint8Array([1]), new Uint8Array(64).fill(0x42));
  const fakeSigner = {
    getAddress: jest.fn(),
    sign: jest.fn().mockResolvedValue({
      signature: fakeSignature,
      return_code: -1,
    }),
  };
  const signerContext = <T>(_deviceId: string, fn: (signer: PolkadotSigner) => Promise<T>) =>
    fn(fakeSigner);
  const signOperation = buildSignOperation(signerContext);
  const deviceId = "dummyDeviceId";

  beforeAll(() => {
    mockGetConfig.mockImplementation((): any => {
      return {
        status: {
          type: "active",
        },
        sidecar: {
          url: "https://polkadot-sidecar.coin.ledger.com",
          credentials: "",
        },
        staking: {
          electionStatusThreshold: 25,
        },
        metadataShortener: {
          url: "https://polkadot-metadata-shortener.api.live.ledger.com/transaction/metadata",
        },
        metadataHash: {
          url: "https://polkadot-metadata-shortener.api.live.ledger.com/node/metadata/hash",
        },
      };
    });
  });

  beforeEach(() => {
    shortenMetadataMock.mockResolvedValue("");
  });

  afterEach(() => {
    shortenMetadataMock.mockClear();
  });

  it("returns events in the right order", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ fees: new BigNumber(0) });

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
          expect(shortenMetadataMock).toHaveBeenCalledTimes(1);
          const currency = getCryptoCurrencyById(account.currency.id);
          expect(shortenMetadataMock.mock.lastCall[1]).toEqual(currency);
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
    const transaction = createFixtureTransaction();

    // WHEN & THEN
    const observer = {
      error: (e: Error) => {
        expect(e.name).toMatch("FeeNotLoaded");
        expect(shortenMetadataMock).not.toHaveBeenCalled();
        done();
      },
    };
    signOperation({ account, deviceId, transaction }).subscribe(observer);
  });

  const modesData: Array<{
    mode: PolkadotOperationMode;
    expected: {
      type: string;
      palletMethod: string;
    };
  }> = [
    { mode: "send", expected: { type: "OUT", palletMethod: "balances.transferKeepAlive" } },
    { mode: "bond", expected: { type: "BOND", palletMethod: "staking.bond" } },
    { mode: "unbond", expected: { type: "UNBOND", palletMethod: "staking.unbond" } },
    { mode: "rebond", expected: { type: "BOND", palletMethod: "staking.rebond" } },
    {
      mode: "withdrawUnbonded",
      expected: { type: "WITHDRAW_UNBONDED", palletMethod: "staking.withdrawUnbonded" },
    },
    { mode: "nominate", expected: { type: "NOMINATE", palletMethod: "staking.nominate" } },
    { mode: "chill", expected: { type: "CHILL", palletMethod: "staking.chill" } },
    {
      mode: "setController",
      expected: { type: "SET_CONTROLLER", palletMethod: "staking.setController" },
    },
    {
      mode: "claimReward",
      expected: { type: "REWARD_PAYOUT", palletMethod: "staking.payoutStakers" },
    },
  ];
  it.each(modesData)(
    "returns expected operation when tx mode is $mode",
    ({ mode, expected: { type, palletMethod } }, done) => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        mode,
        fees: new BigNumber(0),
        // Valid validator address needed (this one is a real one)
        validators: ["111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S"],
        era: "12",
      });

      // WHEN & THEN
      const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
        (e: SignOperationEvent) => {
          if (e.type === "device-signature-granted") {
            expect(shortenMetadataMock).toHaveBeenCalledTimes(1);
            const currency = getCryptoCurrencyById(account.currency.id);
            expect(shortenMetadataMock.mock.lastCall[1]).toEqual(currency);
          } else if (e.type === "signed") {
            const { operation } = e.signedOperation;
            expect(operation.recipients[0]).toEqual(transaction.recipient);
            expect(operation.fee).toEqual(new BigNumber(0));
            expect(operation.type).toEqual(type);
            const extra = operation.extra as PolkadotOperationExtra;
            expect(extra.palletMethod).toEqual(palletMethod);

            // Cleanup
            subscriber.unsubscribe();
            done();
          }
        },
      );
    },
  );

  it("returns expected extra operation with transferAmount when tx mode is send", done => {
    // GIVEN
    const account = createFixtureAccount();
    const amount = new BigNumber(123);
    const transaction = createFixtureTransaction({ fees: new BigNumber(0), mode: "send", amount });

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "device-signature-granted") {
          expect(shortenMetadataMock).toHaveBeenCalledTimes(1);
          const currency = getCryptoCurrencyById(account.currency.id);
          expect(shortenMetadataMock.mock.lastCall[1]).toEqual(currency);
        } else if (e.type === "signed") {
          const extra = e.signedOperation.operation.extra as PolkadotOperationExtra;
          expect(extra).toEqual({
            index: 0,
            palletMethod: "balances.transferKeepAlive",
            transferAmount: amount,
          });

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });

  it("returns expected extra operation with bondedAmount when tx mode is bond", done => {
    // GIVEN
    const account = createFixtureAccount();
    const amount = new BigNumber(123);
    const transaction = createFixtureTransaction({ fees: new BigNumber(0), mode: "bond", amount });

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "device-signature-granted") {
          expect(shortenMetadataMock).toHaveBeenCalledTimes(1);
          const currency = getCryptoCurrencyById(account.currency.id);
          expect(shortenMetadataMock.mock.lastCall[1]).toEqual(currency);
        } else if (e.type === "signed") {
          const extra = e.signedOperation.operation.extra as PolkadotOperationExtra;
          expect(extra).toEqual({
            index: 0,
            palletMethod: "staking.bond",
            bondedAmount: amount,
          });

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });

  it("returns expected extra operation with unbondedAmount when tx mode is unbond", done => {
    // GIVEN
    const account = createFixtureAccount();
    const amount = new BigNumber(123);
    const transaction = createFixtureTransaction({
      fees: new BigNumber(0),
      mode: "unbond",
      amount,
    });

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "device-signature-granted") {
          expect(shortenMetadataMock).toHaveBeenCalledTimes(1);
          const currency = getCryptoCurrencyById(account.currency.id);
          expect(shortenMetadataMock.mock.lastCall[1]).toEqual(currency);
        } else if (e.type === "signed") {
          const extra = e.signedOperation.operation.extra as PolkadotOperationExtra;
          expect(extra).toEqual({
            index: 0,
            palletMethod: "staking.unbond",
            unbondedAmount: amount,
          });

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });

  it("returns expected extra operation with withdrawUnbondedAmount when tx mode is withdrawUnbonded", done => {
    // GIVEN
    const account = createFixtureAccount();
    const amount = new BigNumber(123);
    const transaction = createFixtureTransaction({
      fees: new BigNumber(0),
      mode: "withdrawUnbonded",
      amount,
    });

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "device-signature-granted") {
          expect(shortenMetadataMock).toHaveBeenCalledTimes(1);
          const currency = getCryptoCurrencyById(account.currency.id);
          expect(shortenMetadataMock.mock.lastCall[1]).toEqual(currency);
        } else if (e.type === "signed") {
          const extra = e.signedOperation.operation.extra as PolkadotOperationExtra;
          expect(extra).toEqual({
            index: 0,
            palletMethod: "staking.withdrawUnbonded",
            withdrawUnbondedAmount: account.polkadotResources.unlockedBalance,
          });

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });

  it("returns expected extra operation with withdrawUnbondedAmount when tx mode is nominate", done => {
    // GIVEN
    const account = createFixtureAccount();
    const amount = new BigNumber(123);
    const transaction = createFixtureTransaction({
      fees: new BigNumber(0),
      mode: "nominate",
      // Valid validator address needed (this one is a real one)
      validators: ["111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S"],
      amount,
    });

    // WHEN & THEN
    const subscriber = signOperation({ account, deviceId, transaction }).subscribe(
      (e: SignOperationEvent) => {
        if (e.type === "device-signature-granted") {
          expect(shortenMetadataMock).toHaveBeenCalledTimes(1);
          const currency = getCryptoCurrencyById(account.currency.id);
          expect(shortenMetadataMock.mock.lastCall[1]).toEqual(currency);
        } else if (e.type === "signed") {
          const extra = e.signedOperation.operation.extra as PolkadotOperationExtra;
          expect(extra).toEqual({
            index: 0,
            palletMethod: "staking.nominate",
            validators: ["111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S"],
          });

          // Cleanup
          subscriber.unsubscribe();
          done();
        }
      },
    );
  });
});
