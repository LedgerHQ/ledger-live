/**
 * This directory is the home for all types and logic based on Ledger's signer.
 */

import getAddress from "./getAddress";
import getFullViewingKey from "./getFullViewingKey";

export { composeXpub } from "./xpub";
export { deriveAccountXpub } from "./accountXpub";
export { getAddress, getFullViewingKey };
export default getAddress;
