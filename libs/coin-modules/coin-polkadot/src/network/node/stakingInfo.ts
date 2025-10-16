import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { IUnlocking, SidecarStakingInfo } from "../types";
import getApiPromise from "./apiPromise";

// Required to leverage PolkadotJS *type augmentation*
// (https://polkadot.js.org/docs/api/FAQ#since-upgrading-to-the-7x-series-typescript-augmentation-is-missing)
import "@polkadot/api-augment";

/**
 * Fetch the staking info for an account.
 *
 * @async
 * @param {string} addr
 *
 * @returns {SidecarStakingInfo}
 */
export const fetchStakingInfo = async (
  addr: string,
  currency?: CryptoCurrency,
): Promise<SidecarStakingInfo> => {
  const api = await getApiPromise(currency);
  const hash = await api.rpc.chain.getFinalizedHead();
  const historicApi = await api.at(hash);

  if (currency?.id === "assethub_polkadot" && !historicApi.query.staking)
    return {
      staking: { unlocking: [] },
      numSlashingSpans: 0,
    };

  const controllerOption = await historicApi.query.staking.bonded(addr); // Option<AccountId> representing the controller

  if (controllerOption.isNone) {
    throw new Error(`The address ${addr} is not a stash address.`);
  }

  const controller = controllerOption.unwrap();

  const stakingLedgerOption = await historicApi.query.staking.ledger(controller);

  const stakingLedger = stakingLedgerOption.unwrapOr(null);

  if (stakingLedger === null) {
    // should never throw because by time we get here we know we have a bonded pair
    throw new Error(
      `Staking ledger could not be found for controller address "${controller.toString()}"`,
    );
  }

  const slashingSpansOption = await historicApi.query.staking.slashingSpans?.(addr);

  const numSlashingSpans =
    slashingSpansOption && slashingSpansOption.isSome
      ? slashingSpansOption.unwrap().prior.length + 1
      : 0;

  const unlocking = stakingLedger.unlocking.map<IUnlocking>(lock => ({
    value: lock.value.toString(),
    era: lock.era.toString(),
  }));

  return {
    staking: {
      unlocking,
    },
    numSlashingSpans,
  };
};
