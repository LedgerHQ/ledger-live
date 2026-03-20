import Transport from "@ledgerhq/hw-transport";
import SuiAPI from "@mysten/ledgerjs-hw-app-sui";

/**
 * Sui App API
 *
 * @example
 * import Sui from "@ledgerhq/hw-app-sui";
 * const sui = new Sui(transport)
 */
export default class Sui extends SuiAPI {
  constructor(transport: Transport, scrambleKey?: string, verbose?: boolean) {
    // The upstream @mysten/ledgerjs-hw-app-sui bundles its own Transport type
    // declarations, which are structurally identical but nominally incompatible
    // due to private property checks. This cast bridges the two type universes.
    super(transport as unknown as ConstructorParameters<typeof SuiAPI>[0], scrambleKey, verbose);
  }
}
