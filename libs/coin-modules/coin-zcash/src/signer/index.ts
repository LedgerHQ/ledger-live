/**
 * This directory is the home for all types and logic based on Ledger's signer.
 */

import getAddress from "./getAddress";
import getFullViewingKey from "./getFullViewingKey";
import { composeXpub } from "./xpub";

export { getAddress, getFullViewingKey, composeXpub };
export default getAddress;
