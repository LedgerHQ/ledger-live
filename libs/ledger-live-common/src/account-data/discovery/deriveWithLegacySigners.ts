import { firstValueFrom, from } from "rxjs";
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
import { LegacyDeriveUnsupportedError } from "./errors";

/** `m/44h/60h/0h/0/0` -> `44'/60'/0'/0/0`, the spelling of the legacy resolvers. */
export const toLegacyPath = (path: string) => path.replace(/^m\//, "").replaceAll("h", "'");

/**
 * Derives a candidate on the connected device with the legacy signers, so the account is the one
 * `scanAccounts` would have found: the family's own `deriveAccountDescriptor` if it has one, the
 * address its resolver gives otherwise.
 */
export function deriveWithLegacySigners(deviceId: string): DeriveAccount {
  return async (candidate: AccountCandidate): Promise<AccountDescriptor> => {
    const currency = getCryptoCurrencyById(currencyIdFromNetwork(candidate.network));
    const family = resolveFamily(currency);
    const setup = await loadSetupForFamily(family);
    if (setup.deriveAccountDescriptor) {
      return setup.deriveAccountDescriptor(deviceId, currency, candidate);
    }
    if (getAccountDescriptorType(family) !== "address") {
      throw new LegacyDeriveUnsupportedError(`${family} has no deriveAccountDescriptor`);
    }
    const { address } = await firstValueFrom(
      withDevice(deviceId)(transport =>
        from(
          getAddress(transport, {
            currency,
            path: toLegacyPath(candidate.addressPath),
            derivationMode: asDerivationMode(candidate.derivationMode),
          }),
        ),
      ),
    );
    return AccountDescriptorSchema.parse({
      purpose: "account",
      version: "1",
      type: "address",
      network: candidate.network,
      address,
      path: candidate.addressPath,
    });
  };
}
