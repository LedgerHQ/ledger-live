import { getStakes } from "./getStakes";
import MultiversXApi from "../api/apiCalls";
import type { MultiversXDelegation } from "../types";

// Mock the apiCalls module
jest.mock("../api/apiCalls");
const MockedMultiversXApi = MultiversXApi as jest.MockedClass<typeof MultiversXApi>;

// Mock logic.ts for isValidAddress
jest.mock("../logic", () => ({
  isValidAddress: jest.fn((address: string) => address.startsWith("erd1")),
}));

describe("getStakes", () => {
  const TEST_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const VALIDATOR_CONTRACT = "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx";

  let mockApiClient: jest.Mocked<MultiversXApi>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient = new MockedMultiversXApi("", "") as jest.Mocked<MultiversXApi>;
  });

  const createDelegation = (
    overrides: Partial<MultiversXDelegation> = {},
  ): MultiversXDelegation => ({
    address: TEST_ADDRESS,
    contract: VALIDATOR_CONTRACT,
    userActiveStake: "1000000000000000000",
    claimableRewards: "50000000000000000",
    userUnBondable: "0",
    userUndelegatedList: [],
    ...overrides,
  });

  it("returns Page with stakes for address with delegations (Subtask 7.2)", async () => {
    const delegations: MultiversXDelegation[] = [createDelegation()];
    mockApiClient.getAccountDelegations = jest.fn().mockResolvedValue(delegations);

    const result = await getStakes(mockApiClient, TEST_ADDRESS);

    expect(result.items).toHaveLength(1);
    expect(result.next).toBeUndefined();
    expect(result.items[0].uid).toBe(`${TEST_ADDRESS}-${VALIDATOR_CONTRACT}`);
    expect(result.items[0].address).toBe(TEST_ADDRESS);
    expect(result.items[0].delegate).toBe(VALIDATOR_CONTRACT);
    expect(result.items[0].state).toBe("active");
  });

  it("returns Page with multiple stakes for multi-validator address (Subtask 7.3)", async () => {
    const validator2 = "erd1qqqqqqqqqqqqqpgqdp68fhkp4xud02tmyk9f7g92aqdv0ga35yqs8h6ghu";
    const delegations: MultiversXDelegation[] = [
      createDelegation(),
      createDelegation({ contract: validator2 }),
    ];
    mockApiClient.getAccountDelegations = jest.fn().mockResolvedValue(delegations);

    const result = await getStakes(mockApiClient, TEST_ADDRESS);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].delegate).toBe(VALIDATOR_CONTRACT);
    expect(result.items[1].delegate).toBe(validator2);
  });

  it("returns empty items array for address with no delegations (Subtask 7.4)", async () => {
    mockApiClient.getAccountDelegations = jest.fn().mockResolvedValue([]);

    const result = await getStakes(mockApiClient, TEST_ADDRESS);

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("throws error for invalid address format (Subtask 7.5)", async () => {
    await expect(getStakes(mockApiClient, "invalid-address")).rejects.toThrow(
      /Invalid MultiversX address/,
    );
  });

  it("correctly wraps API errors with descriptive message (Subtask 7.6)", async () => {
    mockApiClient.getAccountDelegations = jest.fn().mockRejectedValue(new Error("Network error"));

    await expect(getStakes(mockApiClient, TEST_ADDRESS)).rejects.toThrow(
      /Failed to fetch delegations for/,
    );
  });

  it("maps each delegation using mapToStake", async () => {
    const delegations: MultiversXDelegation[] = [
      createDelegation({ userActiveStake: "2000000000000000000" }),
    ];
    mockApiClient.getAccountDelegations = jest.fn().mockResolvedValue(delegations);

    const result = await getStakes(mockApiClient, TEST_ADDRESS);

    expect(result.items[0].amountDeposited).toBe(2000000000000000000n);
  });

  it("returns Page structure with items and next fields", async () => {
    mockApiClient.getAccountDelegations = jest.fn().mockResolvedValue([createDelegation()]);

    const result = await getStakes(mockApiClient, TEST_ADDRESS);

    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("next");
    expect(Array.isArray(result.items)).toBe(true);
  });
});
