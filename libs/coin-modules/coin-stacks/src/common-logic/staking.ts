import { validateAddress } from "./addresses";

/** pox-5's `MAX_NUM_CYCLES` (`pox-5.clar:78`) bounds a stake's lock period to 1-96 reward cycles. */
export const MIN_NUM_CYCLES = 1;
export const MAX_NUM_CYCLES = 96;

// Clarity's contract-name rule (stacks-core `clarity-types/src/representations.rs`): a letter, then
// letters, digits, `-` or `_` (`CONTRACT_NAME_REGEX_STRING`), at most `CONTRACT_MAX_NAME_LENGTH`
// (40) bytes -- the bound the `ContractName` wire codec enforces, so no contract deployed today, a
// pox-5 pool included, has a longer name. The regex's own 128 only keeps legacy principals
// parseable. It can't be stricter: a contract name is fixed at deploy time, so a rejected
// legitimate pool would be unusable.
const CONTRACT_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;

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
