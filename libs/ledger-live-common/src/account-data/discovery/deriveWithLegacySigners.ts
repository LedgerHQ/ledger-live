import { from, map, type Observable } from "rxjs";
import {
  AccountDescriptorSchema,
  currencyIdFromNetwork,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import type { AccountCandidate } from "@domain/entity-derivation";
import type { DeriveAccount } from "@features/platform-account-discovery";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { withDevice } from "../../hw/deviceAccess";
import getAddress from "../../hw/getAddress";
import { getAccountDescriptorType, loadSetupForFamily } from "../../coin-modules/registry";
import { resolveFamily } from "../../bridge/zcashRouting";
import { lastValueUntilAborted } from "../abort";
import { toLegacyPath } from "../full-sync/placeholderAccount";
import { LegacyDeriveUnsupportedError } from "./errors";

function deriveAddress(
  deviceId: string,
  candidate: AccountCandidate,
): Observable<AccountDescriptor> {
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(candidate.network));
  return withDevice(deviceId)(transport =>
    from(
      getAddress(transport, {
        currency,
        path: toLegacyPath(candidate.addressPath),
        derivationMode: asDerivationMode(candidate.derivationMode),
      }),
    ),
  ).pipe(
    map(({ address }) =>
      AccountDescriptorSchema.parse({
        purpose: "account",
        version: "2",
        type: "address",
        network: candidate.network,
        address,
        path: candidate.addressPath,
      }),
    ),
  );
}

/** Derives a candidate with the legacy signers, as `scanAccounts` would; aborting releases the device. */
export function deriveWithLegacySigners(deviceId: string): DeriveAccount {
  return async (candidate, signal) => {
    const currency = getCryptoCurrencyById(currencyIdFromNetwork(candidate.network));
    const family = resolveFamily(currency);
    const setup = await loadSetupForFamily(family);
    if (setup.deriveAccountDescriptor) {
      return lastValueUntilAborted(
        setup.deriveAccountDescriptor(deviceId, currency, candidate),
        signal,
      );
    }
    if (getAccountDescriptorType(family) !== "address") {
      throw new LegacyDeriveUnsupportedError(`${family} has no deriveAccountDescriptor`);
    }
    return lastValueUntilAborted(deriveAddress(deviceId, candidate), signal);
  };
}
