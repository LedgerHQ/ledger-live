const parsePsbt = jest.fn((_psbt: string) => Buffer.from("psbt"));
const feeFromPsbt = jest.fn((_psbt: Buffer): unknown => undefined);
const buildKnownAddressDerivations = jest.fn(async (..._args: unknown[]) => new Map([["k", "v"]]));
jest.mock("@ledgerhq/coin-bitcoin/api", () => ({
  parsePsbt: (psbt: string) => parsePsbt(psbt),
  feeFromPsbt: (psbt: Buffer) => feeFromPsbt(psbt),
  buildKnownAddressDerivations: (...args: unknown[]) => buildKnownAddressDerivations(...args),
}));
const derive = jest.fn(async (chain: number, index: number) => `addr-${chain}-${index}`);
const addressDeriver = jest.fn((..._args: unknown[]) => derive);
jest.mock("./accountLayer/derivation", () => ({
  ...jest.requireActual("./accountLayer/derivation"),
  addressDeriver: (...args: unknown[]) => addressDeriver(...args),
}));

import { BigNumber } from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { emptyAccountState } from "./accountLayer/state";
import { buildSignRawOperation } from "./signRawOperation";
import type { BitcoinAccount } from "./types";

const XPUB = "xpub-of-the-account";

const account = (
  accountState: unknown = {
    ...emptyAccountState(),
    addresses: [
      { address: "addr-0-0", chain: 0, index: 0 },
      { address: "addr-0-4", chain: 0, index: 4 },
      { address: "addr-1-1", chain: 1, index: 1 },
    ],
  },
) =>
  ({
    id: `js:2:bitcoin:${XPUB}:native_segwit`,
    currency: getCryptoCurrencyById("bitcoin"),
    derivationMode: "native_segwit",
    freshAddressPath: "84'/0'/2'/0/5",
    bitcoinResources: { utxos: [], accountState },
  }) as unknown as BitcoinAccount;

const signer = {
  signPsbtBuffer: jest.fn(
    async (_currencyId: string, _psbt: Buffer, options: Record<string, any>) => {
      options.onDeviceStreaming({ progress: 0.5, index: 0, total: 2 });
      options.onDeviceSignatureRequested();
      options.onDeviceSignatureGranted();
      return { psbt: Buffer.from("signed"), tx: "" } as { psbt: Buffer; tx?: string } | undefined;
    },
  ),
};
const signerContext = jest.fn(async (_deviceId: string, fn: (s: typeof signer) => unknown) =>
  fn(signer),
);

const sign = (a: Account, broadcast?: boolean) =>
  lastValueFrom(
    buildSignRawOperation(signerContext as never)({
      account: a,
      deviceId: "device",
      transaction: "cHNidP8=",
      ...(broadcast === undefined ? {} : { broadcast }),
    }).pipe(toArray()),
  );

beforeEach(() => jest.clearAllMocks());

describe("buildSignRawOperation", () => {
  it("signs a PSBT with the derivations of the account's addresses and two ahead on each chain", async () => {
    feeFromPsbt.mockReturnValueOnce(new BigNumber(300));
    const events = await sign(account());

    expect(addressDeriver).toHaveBeenCalledWith("bitcoin", "Native SegWit", XPUB);
    expect(buildKnownAddressDerivations).toHaveBeenCalledWith("bitcoin", XPUB, "84'/0'/2'", [
      { address: "addr-0-0", chain: 0, index: 0 },
      { address: "addr-0-4", chain: 0, index: 4 },
      { address: "addr-1-1", chain: 1, index: 1 },
      { address: "addr-0-5", chain: 0, index: 5 },
      { address: "addr-0-6", chain: 0, index: 6 },
      { address: "addr-1-2", chain: 1, index: 2 },
      { address: "addr-1-3", chain: 1, index: 3 },
    ]);
    expect(signer.signPsbtBuffer).toHaveBeenCalledWith(
      "bitcoin",
      Buffer.from("psbt"),
      expect.objectContaining({
        accountPath: "84'/0'/2'",
        addressFormat: "bech32",
        finalizePsbt: false,
        knownAddressDerivations: new Map([["k", "v"]]),
      }),
    );
    expect(signerContext.mock.calls[0][0]).toBe("device");

    expect(events.map(e => e.type)).toEqual([
      "device-streaming",
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
    expect(events[0]).toEqual({ type: "device-streaming", progress: 0.5, index: 0, total: 2 });
    const signed = events[3] as Extract<SignOperationEvent, { type: "signed" }>;
    const base64 = Buffer.from("signed").toString("base64");
    expect(signed.signedOperation).toMatchObject({
      signature: base64,
      rawData: { psbtSigned: base64 },
      operation: {
        id: `js:2:bitcoin:${XPUB}:native_segwit--OUT`,
        hash: "",
        type: "OUT",
        value: new BigNumber(300),
        fee: new BigNumber(300),
        senders: [],
        recipients: [],
        blockHeight: null,
        extra: { psbt: true },
      },
    });
  });

  it("returns the finalized transaction when broadcasting, and a zero fee it cannot read", async () => {
    signer.signPsbtBuffer.mockResolvedValueOnce({ psbt: Buffer.from("signed"), tx: "0200hex" });
    const events = await sign(account({ ...emptyAccountState() }), true);

    expect(signer.signPsbtBuffer.mock.calls[0][2]).toMatchObject({ finalizePsbt: true });
    expect(buildKnownAddressDerivations.mock.calls[0][3]).toEqual([
      { address: "addr-0-0", chain: 0, index: 0 },
      { address: "addr-0-1", chain: 0, index: 1 },
      { address: "addr-1-0", chain: 1, index: 0 },
      { address: "addr-1-1", chain: 1, index: 1 },
    ]);
    const signed = events.at(-1) as Extract<SignOperationEvent, { type: "signed" }>;
    expect(signed.signedOperation.signature).toBe("0200hex");
    expect(signed.signedOperation.operation.fee).toEqual(new BigNumber(0));
    expect(signed.signedOperation.operation.value).toEqual(new BigNumber(0));
  });

  it("needs a resync without an account state", async () => {
    // `undefined` would take the fixture's default state
    await expect(sign(account(null))).rejects.toThrow("AccountNeedResync");
    expect(signer.signPsbtBuffer).not.toHaveBeenCalled();
  });

  it("fails when the device returns nothing", async () => {
    signer.signPsbtBuffer.mockResolvedValueOnce(undefined);
    await expect(sign(account())).rejects.toThrow(
      `PSBT signing failed: no result from device for account js:2:bitcoin:${XPUB}:native_segwit (bitcoin)`,
    );
  });
});
