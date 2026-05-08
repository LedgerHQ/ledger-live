const getCeloClientMock = jest.fn();
const readContractMock = jest.fn();

jest.mock("../../network/client", () => ({
  getCeloClient: (...args: unknown[]) => getCeloClientMock(...args),
}));

const loadRegistryModule = (): typeof import("../../network/registry") =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("../../network/registry");

describe("network/registry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    getCeloClientMock.mockReturnValue({
      readContract: readContractMock,
    });
  });

  it("resolves a contract address from the on-chain registry", async () => {
    const { getRegistryAddressFor } = loadRegistryModule();
    const accountsAddress = "0x000000000000000000000000000000000000aa10";
    readContractMock.mockResolvedValue(accountsAddress);

    const result = await getRegistryAddressFor("Accounts");

    expect(result).toBe(accountsAddress);
    expect(readContractMock).toHaveBeenCalledWith({
      address: "0x000000000000000000000000000000000000ce10",
      abi: expect.anything(),
      functionName: "getAddressForString",
      args: ["Accounts"],
    });
  });

  it("caches lookups for the same contract name", async () => {
    const { getRegistryAddressFor } = loadRegistryModule();
    readContractMock.mockResolvedValue("0x000000000000000000000000000000000000aa10");

    const first = await getRegistryAddressFor("Accounts");
    const second = await getRegistryAddressFor("Accounts");

    expect(first).toBe(second);
    expect(readContractMock).toHaveBeenCalledTimes(1);
  });

  it("does not reuse cache entries across different contract names", async () => {
    const { getRegistryAddressFor } = loadRegistryModule();
    readContractMock.mockImplementation(async ({ args }: { args: [string] }) =>
      args[0] === "Accounts"
        ? "0x000000000000000000000000000000000000aa10"
        : "0x000000000000000000000000000000000000ce10",
    );

    await getRegistryAddressFor("Accounts");
    await getRegistryAddressFor("Election");

    expect(readContractMock).toHaveBeenCalledTimes(2);
  });
});
