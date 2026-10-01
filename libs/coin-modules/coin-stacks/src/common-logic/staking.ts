import { validateAddress } from "./addresses";

/** pox-5's `MAX_NUM_CYCLES` (`pox-5.clar:78`) bounds a stake's lock period to 1-96 reward cycles. */
export const MIN_NUM_CYCLES = 1;
export const MAX_NUM_CYCLES = 96;

// Clarity's contract-name rule (stacks-core `clarity-types/src/representations.rs`,
// `CONTRACT_NAME_REGEX_STRING`): a letter, then up to 127 letters, digits, `-` or `_`. It can't be
// stricter: a contract name is fixed at deploy time, so a rejected legitimate pool is unusable.
const CONTRACT_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/;

/** A pool is a pox-5 signer-manager contract principal: `<c32 address>.<contract name>`. */
export function isPoolAddress(valAddress: string | undefined): boolean {
  if (!valAddress) return false;
  const dotIndex = valAddress.indexOf(".");
  if (dotIndex === -1) return false;
  const address = valAddress.slice(0, dotIndex);
  const contractName = valAddress.slice(dotIndex + 1);
  return validateAddress(address).isValid && CONTRACT_NAME_RE.test(contractName);
}

export function isValidNumCycles(numCycles: number | undefined): boolean {
  return (
    typeof numCycles === "number" &&
    Number.isInteger(numCycles) &&
    numCycles >= MIN_NUM_CYCLES &&
    numCycles <= MAX_NUM_CYCLES
  );
}
