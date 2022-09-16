import { log } from "@ledgerhq/logs";
import type { OperationType } from "@ledgerhq/types-live";

/**
 * Returns the operation type by using his palletMethod
 * the method case depends from which indexer you are using
 *
 * @param {*} pallet
 * @param {*} palletMethod
 *
 * @returns {string} - OperationType
 */
export const getOperationType = (
  pallet: string,
  palletMethod: string
): OperationType => {
  switch (palletMethod) {
    case "transfer":
    case "transferKeepAlive":
      return "OUT";

    case "bond":
    case "bondExtra":
    case "rebond":
      return "BOND";

    case "unbond":
      return "UNBOND";

    case "nominate":
      return "NOMINATE";

    case "chill":
      return "CHILL";

    case "withdrawUnbonded":
      return "WITHDRAW_UNBONDED";

    case "setController":
      return "SET_CONTROLLER";

    case "payoutStakers":
      return "FEES";

    default:
      log(
        "polkadot/api",
        `Unknown operation type ${pallet}.${palletMethod} - fallback to FEES`
      );
      return "FEES";
  }
};
