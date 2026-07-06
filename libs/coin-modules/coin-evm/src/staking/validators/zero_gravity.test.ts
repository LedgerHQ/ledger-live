import network from "@ledgerhq/live-network";
import { clearValidatorsCache, getValidators } from "./index";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedNetwork = jest.mocked(network);

const makeValidator = (
  overrides: Partial<{
    addr: string;
    moniker: string | null;
    commission_pct: string;
    voting_power_tokens: string;
  }> = {},
) => ({
  addr: "aabbccddee" + "00".repeat(15),
  moniker: "TestValidator",
  commission_pct: "5.00",
  voting_power_tokens: "1000000000000000000",
  ...overrides,
});

describe("staking/validators/zero_gravity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearValidatorsCache("zero_gravity");
  });

  it("maps addr to validatorAddress with 0x prefix", async () => {
    const addr = "aabbccddee" + "00".repeat(15);
    mockedNetwork.mockResolvedValueOnce({ data: [makeValidator({ addr })] } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].validatorAddress).toEqual("0x" + addr);
  });

  it("uses moniker as name", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ moniker: "MyNode" })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].name).toEqual("MyNode");
  });

  it("falls back to 0x+addr when moniker is null", async () => {
    const addr = "aabbccddee" + "00".repeat(15);
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ addr, moniker: null })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].name).toEqual("0x" + addr);
  });

  it("converts commission_pct string to a decimal fraction", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ commission_pct: "5.00" })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].commission).toEqual(0.05);
  });

  it("maps voting_power_tokens to tokens", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator({ voting_power_tokens: "42000000000000000000" })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].tokens).toEqual("42000000000000000000");
  });

  it("assigns votingPower from position index", async () => {
    mockedNetwork.mockResolvedValueOnce({
      data: [makeValidator(), makeValidator({ addr: "ff" + "00".repeat(19) })],
    } as never);

    const page = await getValidators("zero_gravity");

    expect(page.items[0].votingPower).toEqual(0);
    expect(page.items[1].votingPower).toEqual(1);
  });

  it("returns empty page on network error", async () => {
    mockedNetwork.mockRejectedValueOnce(new Error("network failure"));

    const page = await getValidators("zero_gravity");

    expect(page).toEqual({ items: [], next: undefined });
  });

  it("always returns next: undefined (single-page API)", async () => {
    mockedNetwork.mockResolvedValueOnce({ data: [makeValidator()] } as never);

    const page = await getValidators("zero_gravity");

    expect(page.next).toBeUndefined();
  });
});
