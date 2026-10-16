import { PortfolioApiError } from "./errors";
import {
  ACCOUNT_EXTENSION_METHODS,
  EXTENSION_METHODS,
  isUnsupported,
  NETWORK_EXTENSION_METHODS,
  requireExtension,
  WRITE_EXTENSION_METHODS,
  type ExtensionMethod,
} from "./extensions";
import type { PortfolioApi } from "./types";

type OptionalKeys<T> = { [K in keyof T]-?: object extends Pick<T, K> ? K : never }[keyof T];
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
// Compile time: the extension methods are exactly the optional methods of PortfolioApi.
const exhaustive: Same<ExtensionMethod, OptionalKeys<PortfolioApi>> = true;

describe("extension methods", () => {
  it("are grouped by what serves them, each named once", () => {
    expect(exhaustive).toBe(true);
    expect(EXTENSION_METHODS).toEqual([
      ...ACCOUNT_EXTENSION_METHODS,
      ...NETWORK_EXTENSION_METHODS,
      ...WRITE_EXTENSION_METHODS,
    ]);
    expect(new Set(EXTENSION_METHODS).size).toBe(10);
  });
});

describe("requireExtension", () => {
  it("returns the extension, bound to the portfolio serving it", async () => {
    class Portfolio {
      readonly address = { address: "addr", derivation_path: "44'/0'/0'/0/0" };
      async getFreshAddress(_portfolioId: string, _accountId: string) {
        return this.address;
      }
    }

    const getFreshAddress = requireExtension(new Portfolio(), "getFreshAddress");

    expect(await getFreshAddress("portfolio", "account")).toEqual({
      address: "addr",
      derivation_path: "44'/0'/0'/0/0",
    });
  });

  it("refuses an extension the portfolio does not serve, as unsupported", () => {
    const refusal = (() => {
      try {
        requireExtension({}, "getAccountUtxos");
      } catch (error) {
        return error;
      }
    })();

    expect(refusal).toBeInstanceOf(PortfolioApiError);
    expect(refusal).toMatchObject({
      type: "METHOD_NOT_ALLOWED",
      status: 405,
      message: "getAccountUtxos is not served",
    });
    expect(isUnsupported(refusal)).toBe(true);
  });
});

describe("isUnsupported", () => {
  it("tells a METHOD_NOT_ALLOWED portfolio error", () => {
    expect(isUnsupported(new PortfolioApiError("METHOD_NOT_ALLOWED", "call is not served"))).toBe(
      true,
    );
  });

  it.each(["BAD_REQUEST", "NOT_FOUND", "INTERNAL_ERROR", "UNAVAILABLE"] as const)(
    "does not take a %s portfolio error for unsupported",
    type => {
      expect(isUnsupported(new PortfolioApiError(type, "failed"))).toBe(false);
    },
  );

  it("does not take another error with a 405 status for unsupported", () => {
    expect(isUnsupported(Object.assign(new Error("Method Not Allowed"), { status: 405 }))).toBe(
      false,
    );
    expect(isUnsupported({ type: "METHOD_NOT_ALLOWED", status: 405 })).toBe(false);
    expect(isUnsupported(undefined)).toBe(false);
  });
});
