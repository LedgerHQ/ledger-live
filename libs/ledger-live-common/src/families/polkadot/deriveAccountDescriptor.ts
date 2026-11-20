import { map } from "rxjs";
import { AccountDescriptorSchema, networkFromCurrencyId } from "@domain/entity-account-descriptor";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { AccountCandidate } from "@domain/entity-derivation";
import type { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import { getCurrencyConfiguration } from "../../config";
import { deriveAddress } from "../../account-data/discovery/deriveAddress";
import type { DeriveAccountDescriptor } from "../../coin-modules/types";

const ASSET_HUB_ID = "assethub_polkadot";
const POLKADOT_NETWORK = networkFromCurrencyId(CryptoCurrencyIdSchema.parse("polkadot"));
const ASSET_HUB_NETWORK = networkFromCurrencyId(CryptoCurrencyIdSchema.parse(ASSET_HUB_ID));

const syncedNetworkOf = (candidate: AccountCandidate) =>
  candidate.network === POLKADOT_NETWORK &&
  getCurrencyConfiguration<PolkadotCoinConfig>(ASSET_HUB_ID).hasBeenMigrated
    ? ASSET_HUB_NETWORK
    : candidate.network;

export const deriveAccountDescriptor: DeriveAccountDescriptor = (
  runOnTransport,
  _currency,
  candidate,
) =>
  deriveAddress(runOnTransport, candidate).pipe(
    map(descriptor =>
      AccountDescriptorSchema.parse({ ...descriptor, network: syncedNetworkOf(candidate) }),
    ),
  );
