import { Observable, from, of, EMPTY } from "rxjs";
import { concatMap } from "rxjs/operators";
import invariant from "invariant";
import bs58 from "bs58";
import type { DerivationMode } from "@ledgerhq/coin-framework/derivation";
import type { Result } from "../../hw/getAddress/types";
import { hash256, hash160 } from "../../crypto";
import {
  walletDerivation,
  getDerivationModesForCurrency,
  runAccountDerivationScheme,
  getDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { withDevice } from "../../hw/deviceAccess";
import getAddress from "../../hw/getAddress";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { decodeAccountId } from "../../account/index";

export type AccountDescriptor = {
  internal: string;
  external: string;
};
const perDerivation: Partial<
  Record<DerivationMode, ((arg0: string) => string) | null | undefined>
> = {
  "": (fragment) => `pkh(${fragment})`,
  segwit: (fragment) => `sh(wpkh(${fragment}))`,
  native_segwit: (fragment) => `wpkh(${fragment})`,
  taproot: (fragment) => `tr(${fragment})`,
};

function makeFingerprint(compressedPubKey) {
  return hash160(compressedPubKey).slice(0, 4);
}

function makeDescriptor({
  currency,
  index,
  derivationMode,
  fingerprint,
  xpub,
}) {
  const tmpl = perDerivation[derivationMode];
  if (!tmpl || !xpub) return;
  const keyOrigin = fingerprint.toString("hex");
  const scheme = getDerivationScheme({
    currency,
    derivationMode,
  });
  const accountPath = runAccountDerivationScheme(scheme, currency, {
    account: index,
  });
  return {
    external: tmpl(`[${keyOrigin}/${accountPath}]${xpub}/0/*`),
    internal: tmpl(`[${keyOrigin}/${accountPath}]${xpub}/1/*`),
  };
}

export function inferDescriptorFromAccount(
  account: Account
): AccountDescriptor | null | undefined {
  if (account.currency.family !== "bitcoin") return;
  const { id, derivationMode, seedIdentifier, currency, index } = account;
  const xpub = decodeAccountId(id).xpubOrAddress;
  const fingerprint = makeFingerprint(
    compressPublicKeySECP256(Buffer.from(seedIdentifier, "hex"))
  );
  return makeDescriptor({
    derivationMode,
    currency,
    fingerprint,
    xpub,
    index,
  });
}

function asBufferUInt32BE(n) {
  const buf = Buffer.allocUnsafe(4);
  buf.writeUInt32BE(n, 0);
  return buf;
}

const compressPublicKeySECP256 = (publicKey: Buffer) =>
  Buffer.concat([
    Buffer.from([0x02 + (publicKey[64] & 0x01)]),
    publicKey.slice(1, 33),
  ]);

function makeXpub({
  version,
  depth,
  parentFingerprint,
  index,
  chainCode,
  pubKey,
}) {
  const indexBuffer = asBufferUInt32BE(index);
  indexBuffer[0] |= 0x80;
  const extendedKeyBytes = Buffer.concat([
    asBufferUInt32BE(version),
    Buffer.from([depth]),
    parentFingerprint,
    indexBuffer,
    chainCode,
    pubKey,
  ]);
  const checksum = hash256(extendedKeyBytes).slice(0, 4);
  return bs58.encode(Buffer.concat([extendedKeyBytes, checksum]));
}

export function inferDescriptorFromDeviceInfo({
  derivationMode,
  currency,
  index,
  parentDerivation,
  accountDerivation,
}: {
  derivationMode: DerivationMode;
  currency: CryptoCurrency;
  index: number;
  parentDerivation: Result;
  accountDerivation: Result;
}): AccountDescriptor | null | undefined {
  invariant(currency.bitcoinLikeInfo, "bitcoin currency expected");
  const { bitcoinLikeInfo } = currency;
  const { XPUBVersion } = bitcoinLikeInfo as {
    P2PKH: number;
    P2SH: number;
    XPUBVersion?: number;
    hasTimestamp?: boolean;
  };
  invariant(XPUBVersion, "unsupported bitcoin fork %s", currency.id);
  const { chainCode } = accountDerivation;
  invariant(chainCode, "chainCode is required");
  const fingerprint = makeFingerprint(
    compressPublicKeySECP256(Buffer.from(parentDerivation.publicKey, "hex"))
  );
  const xpub = makeXpub({
    version: XPUBVersion,
    depth: 3,
    parentFingerprint: fingerprint,
    index,
    chainCode: Buffer.from(chainCode as string, "hex"),
    pubKey: compressPublicKeySECP256(
      Buffer.from(accountDerivation.publicKey, "hex")
    ),
  });
  return makeDescriptor({
    derivationMode,
    currency,
    fingerprint,
    xpub,
    index,
  });
}
export function scanDescriptors(
  deviceId: string,
  currency: CryptoCurrency,
  limit = 10
): Observable<AccountDescriptor> {
  const derivateAddress = (opts) =>
    withDevice(deviceId)((transport) => from(getAddress(transport, opts)));

  function stepAddress({
    index,
    accountDerivation,
    parentDerivation,
    derivationMode,
  }) {
    const result = inferDescriptorFromDeviceInfo({
      derivationMode,
      currency,
      index,
      parentDerivation,
      accountDerivation,
    });
    return !result
      ? EMPTY
      : of({
          result,
          complete: index >= limit,
        });
  }

  return from(getDerivationModesForCurrency(currency)).pipe(
    concatMap((derivationMode) =>
      walletDerivation({
        currency,
        derivationMode,
        derivateAddress,
        stepAddress,
        shouldDerivesOnAccount: true,
      })
    )
  );
}
