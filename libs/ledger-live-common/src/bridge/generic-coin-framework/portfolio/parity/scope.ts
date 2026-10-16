import { AsyncLocalStorage } from "node:async_hooks";

/** The portfolio method running, through every await it makes. */
const portfolioMethod = new AsyncLocalStorage<string>();

/** The calls made around the portfolio layer since the last `takeBypasses`. */
const bypasses: string[] = [];

/**
 * Fails a call to the network, a coin module or an account module made outside a portfolio
 * method: recorded (a caller may swallow the error) and rejected.
 */
export function guardCall(target: string): void {
  if (portfolioMethod.getStore() !== undefined) return;
  bypasses.push(target);
  throw new Error(`${target} was called around the portfolio layer`);
}

/** The bypasses recorded since the last call, cleared. */
export const takeBypasses = (): string[] => bypasses.splice(0);

/** `portfolio`, whose members are all methods, with each run inside a portfolio method scope. */
export function scoped<P extends object>(portfolio: P): P {
  return Object.fromEntries(
    Object.entries(portfolio).map(([name, method]) => [
      name,
      (...args: unknown[]) =>
        portfolioMethod.run(name, () => (method as (...a: unknown[]) => unknown)(...args)),
    ]),
  ) as P;
}
