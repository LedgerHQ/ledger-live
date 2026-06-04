import { ethers } from "ethers";
import { fetchRewards } from "./rewards";
import { USEI_TO_EVM_SCALE } from "../utils";

jest.mock("@ledgerhq/live-network", () => jest.fn());
jest.mock("../config");
jest.mock("../network/node/types");

const mockNetwork = jest.mocked(require("@ledgerhq/live-network"));
const mockGetCoinConfig = jest.mocked(require("../config").getCoinConfig);
const mockIsExternalNodeConfig = jest.mocked(require("../network/node/types").isExternalNodeConfig);

const EVM_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const COSMOS_ADDRESS = "sei1defaultcosmosaddressfortest";

type RewardCoin = { denom: string; amount: string };
const restResponse = (rewards: Array<{ validator_address: string; reward: RewardCoin[] }>) => ({
  data: { rewards },
});

describe("fetchRewards", () => {
  let contractSpy: jest.SpyInstance;
  let providerSpy: jest.SpyInstance;
  let mockGetSeiAddr: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeiAddr = jest.fn().mockResolvedValue(COSMOS_ADDRESS);
    providerSpy = jest.spyOn(ethers, "JsonRpcProvider" as any).mockReturnValue({});
    contractSpy = jest
      .spyOn(ethers, "Contract" as any)
      .mockReturnValue({ getSeiAddr: mockGetSeiAddr });

    const mockNode = { type: "external", uri: "https://sei-evm.coin.ledger.com" };
    mockGetCoinConfig.mockReturnValue({ info: { node: mockNode } });
    mockIsExternalNodeConfig.mockImplementation((node: unknown) => node === mockNode);
  });

  afterEach(() => {
    contractSpy.mockRestore();
    providerSpy.mockRestore();
  });

  it.each([
    { case: "unknown currencyId", currencyId: "unknown_chain", setup: () => {} },
    { case: "chain has no rewardsStrategy (e.g. Celo)", currencyId: "celo", setup: () => {} },
    {
      case: "REST call fails",
      currencyId: "sei_evm",
      setup: () => mockNetwork.mockRejectedValue(new Error("network error")),
    },
    {
      case: "API response has no rewards array",
      currencyId: "sei_evm",
      setup: () => mockNetwork.mockResolvedValue({ data: {} }),
    },
    {
      case: "address precompile call fails",
      currencyId: "sei_evm",
      setup: () => mockGetSeiAddr.mockRejectedValueOnce(new Error("not associated")),
    },
  ])("returns an empty map when $case", async ({ currencyId, setup }) => {
    setup();
    expect(await fetchRewards(currencyId, EVM_ADDRESS)).toEqual(new Map());
  });

  it("resolves the EVM address to its canonical Cosmos bech32 via the precompile", async () => {
    const canonicalCosmosAddress = "sei1qpvm20rgmjq4mlf0m28l088snu8ldm05pf2c5d";
    mockGetSeiAddr.mockResolvedValueOnce(canonicalCosmosAddress);
    mockNetwork.mockResolvedValueOnce(restResponse([]));

    await fetchRewards("sei_evm", "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3");

    expect((mockNetwork.mock.calls[0][0] as { url: string }).url).toContain(canonicalCosmosAddress);
  });

  it("scales the integer usei portion to wei (drops sub-usei sdk.Dec precision)", async () => {
    // 569 usei integer survives; fractional .024…000 is dropped on-chain at withdrawal.
    mockNetwork.mockResolvedValue(
      restResponse([
        {
          validator_address: "seivaloper1one",
          reward: [{ denom: "usei", amount: "569.024692675122000000" }],
        },
      ]),
    );

    const result = await fetchRewards("sei_evm", EVM_ADDRESS);

    expect(result.size).toBe(1);
    expect(result.get("seivaloper1one")).toBe(569n * USEI_TO_EVM_SCALE);
  });

  it("aggregates multiple matching-denom coins on the same validator", async () => {
    mockNetwork.mockResolvedValue(
      restResponse([
        {
          validator_address: "seivaloper1one",
          reward: [
            { denom: "usei", amount: "100" },
            { denom: "usei", amount: "23" },
          ],
        },
      ]),
    );

    const result = await fetchRewards("sei_evm", EVM_ADDRESS);

    expect(result.get("seivaloper1one")).toBe(123n * USEI_TO_EVM_SCALE);
  });

  it("ignores reward coins whose denom does not match the strategy", async () => {
    mockNetwork.mockResolvedValue(
      restResponse([
        {
          validator_address: "seivaloper1one",
          reward: [
            { denom: "usei", amount: "500" },
            { denom: "uatom", amount: "9999" },
          ],
        },
      ]),
    );

    const result = await fetchRewards("sei_evm", EVM_ADDRESS);

    expect(result.get("seivaloper1one")).toBe(500n * USEI_TO_EVM_SCALE);
  });

  it("skips validators whose reward integer part is zero (sub-usei amounts)", async () => {
    mockNetwork.mockResolvedValue(
      restResponse([
        {
          validator_address: "seivaloper1dust",
          reward: [{ denom: "usei", amount: "0.019211023787000000" }],
        },
        { validator_address: "seivaloper1real", reward: [{ denom: "usei", amount: "42" }] },
      ]),
    );

    const result = await fetchRewards("sei_evm", EVM_ADDRESS);

    expect(result.has("seivaloper1dust")).toBe(false);
    expect(result.get("seivaloper1real")).toBe(42n * USEI_TO_EVM_SCALE);
  });

  it("handles multiple validators independently", async () => {
    mockNetwork.mockResolvedValue(
      restResponse([
        { validator_address: "seivaloper1a", reward: [{ denom: "usei", amount: "10" }] },
        { validator_address: "seivaloper1b", reward: [{ denom: "usei", amount: "20" }] },
        { validator_address: "seivaloper1c", reward: [{ denom: "usei", amount: "30" }] },
      ]),
    );

    const result = await fetchRewards("sei_evm", EVM_ADDRESS);

    expect(result.size).toBe(3);
    expect(result.get("seivaloper1a")).toBe(10n * USEI_TO_EVM_SCALE);
    expect(result.get("seivaloper1b")).toBe(20n * USEI_TO_EVM_SCALE);
    expect(result.get("seivaloper1c")).toBe(30n * USEI_TO_EVM_SCALE);
  });

  it("returns an empty map when the malformed amount cannot be parsed", async () => {
    mockNetwork.mockResolvedValue(
      restResponse([
        {
          validator_address: "seivaloper1bad",
          reward: [{ denom: "usei", amount: "not-a-number" }],
        },
      ]),
    );

    const result = await fetchRewards("sei_evm", EVM_ADDRESS);

    expect(result.has("seivaloper1bad")).toBe(false);
  });

  it("keeps the good amount when one coin is malformed alongside a valid one", async () => {
    mockNetwork.mockResolvedValue(
      restResponse([
        {
          validator_address: "seivaloper1mixed",
          reward: [
            { denom: "usei", amount: "100" },
            { denom: "usei", amount: "not-a-number" },
          ],
        },
      ]),
    );

    const result = await fetchRewards("sei_evm", EVM_ADDRESS);

    expect(result.get("seivaloper1mixed")).toBe(100n * USEI_TO_EVM_SCALE);
  });
});
