import { isConfidentialError } from "@ledgerhq/coin-evm/confidential";
import { realConfidentialApi, type ConfidentialApi } from "../utils/confidentialApi";

describe("realConfidentialApi", () => {
  it("uses the functions coin-evm exports", () => {
    const getConfidentialBalance = jest.fn();

    const api = realConfidentialApi({ getConfidentialBalance } as Partial<ConfidentialApi>);

    expect(api.getConfidentialBalance).toBe(getConfidentialBalance);
  });

  it("reports a function coin-evm does not export yet as unavailable", () => {
    const api = realConfidentialApi({});

    let thrown: unknown;
    try {
      api.revealConfidentialBalance({} as never, "", "", "", jest.fn());
    } catch (error) {
      thrown = error;
    }

    expect(isConfidentialError(thrown, "Unavailable")).toBe(true);
  });
});
