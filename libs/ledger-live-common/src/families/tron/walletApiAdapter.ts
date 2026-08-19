import type { TronTransaction as WalletAPITronTransaction } from "@ledgerhq/wallet-api-core";
import type { AreFeesProvided, GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";
import type { Transaction, TronFamilySpecificData } from "./types";

// Tron fees are chain-computed and not editable — `descriptor/index.ts` declares neither presets nor
// custom fees — so a live app can neither provide nor let the user change them.
const CAN_EDIT_FEES = false;

const areFeesProvided: AreFeesProvided<WalletAPITronTransaction> = () => false;

/**
 * The wallet API carries `resource`, `duration` and `votes` at the top level. On the generic coin
 * framework they live in `familySpecificData` (`bridge/api.ts:buildIntentData` reads them from
 * there and nowhere else), so without this adapter `converters.ts` would pass them through
 * verbatim and they would be silently ignored — a StakeKit freeze would reach coin-tron with no
 * resource, and a vote with no votes.
 */
const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPITronTransaction,
  Transaction
> = ({ walletApiTransaction }) => {
  const { resource, duration, votes, ...common } = walletApiTransaction;

  // Absent fields are omitted rather than set to undefined, matching `buildIntentData`. The wallet API
  // vote has no `name` (it is display-only, and the craft path reads address/voteCount), so it is
  // filled with null to satisfy coin-tron's `Vote`. The cost is the pending row: a name is only
  // resolvable per address through `accountNamesCache`, and the optimistic descriptor is synchronous,
  // so the operation detail renders nameless until the next sync fills it in.
  const familySpecificData: TronFamilySpecificData = {
    ...(resource !== undefined ? { resource } : {}),
    ...(duration !== undefined ? { duration } : {}),
    ...(votes?.length
      ? { votes: votes.map(({ address, voteCount }) => ({ address, voteCount, name: null })) }
      : {}),
  };

  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: {
      ...common,
      family: "tron",
      ...(Object.keys(familySpecificData).length > 0 ? { familySpecificData } : {}),
    },
    hasFeesProvided: areFeesProvided(walletApiTransaction),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
