import { spyOn } from "bun:test";

type FastPasswordKdf = {
  /** The PBKDF2 iteration counts the CLI asked for, in order. */
  requestedIterations: number[];
  restore: () => void;
};

/**
 * Runs PBKDF2 with one iteration instead of the CLI's 600,000 (about 50 ms per ring password),
 * and records what the CLI asked for. Other derivations pass through. Call it in `beforeAll`.
 */
export function useFastPasswordKdf(): FastPasswordKdf {
  const subtle = globalThis.crypto.subtle;
  const deriveKey = subtle.deriveKey.bind(subtle);
  const requestedIterations: number[] = [];
  const spy = spyOn(subtle, "deriveKey").mockImplementation((algorithm, ...rest) => {
    if (typeof algorithm === "object" && algorithm.name === "PBKDF2" && "iterations" in algorithm) {
      requestedIterations.push(algorithm.iterations as number);
      return deriveKey({ ...algorithm, iterations: 1 }, ...rest);
    }
    return deriveKey(algorithm, ...rest);
  });
  return { requestedIterations, restore: () => spy.mockRestore() };
}
