import { fetchAddressBalance, fetchPendingUtxos } from "../../network/explorer";
import { getBalance } from "../getBalance";
import { testContext } from "./helpers/msw";

jest.mock("../../network/explorer");

const mockedBalance = jest.mocked(fetchAddressBalance);

const ME = "bc1qme";

describe("getBalance", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBalance.mockImplementation(async () => 1_000n);
  });

  it("returns the confirmed balance as a single native entry", async () => {
    expect(await getBalance(testContext(), "bitcoin", ME)).toEqual([
      { value: 1_000n, asset: { type: "native" } },
    ]);
  });

  it("returns a single native 0 balance for a pristine address", async () => {
    mockedBalance.mockImplementation(async () => 0n);
    expect(await getBalance(testContext(), "bitcoin", ME)).toEqual([
      { value: 0n, asset: { type: "native" } },
    ]);
  });

  it("does not read the mempool", async () => {
    await getBalance(testContext(), "bitcoin", ME);
    expect(fetchPendingUtxos).not.toHaveBeenCalled();
  });

  it("reads the config of the instance's currency", async () => {
    const context = testContext();
    const config = jest.spyOn(context, "config");
    await getBalance(context, "litecoin", ME);
    expect(config).toHaveBeenCalledWith("litecoin");
    expect(mockedBalance).toHaveBeenCalledWith(expect.anything(), "litecoin", ME);
  });
});
