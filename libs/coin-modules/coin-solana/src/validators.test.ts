import { getChainAPI } from "./network";
import { getValidators } from "./network/validator-app";
import type { ValidatorsAppValidator } from "./network/validator-app";
import { LEDGER_VALIDATOR_BY_BITWISE, LEDGER_VALIDATOR_BY_FIGMENT } from "./constants";
import { fetchValidators, getSolanaValidators } from "./validators";
import type { SolanaCoinConfig, SolanaContext } from "./config";
import { TEST_CONFIG } from "./test/coinConfig";

const CONFIG: SolanaCoinConfig = {
  ...TEST_CONFIG,
  rpcUrls: { solana_devnet: "https://solana-devnet.test.invalid" },
  validatorsUrl: "https://validators.test.invalid",
};

const contextOf = (config: SolanaCoinConfig): SolanaContext => ({
  config: async () => config,
  logger: () => {},
});
const context = contextOf(CONFIG);

jest.mock("./network/validator-app");
jest.mock("./network", () => ({
  ...jest.requireActual("./network"),
  getChainAPI: jest.fn(),
}));

const mockedGetValidators = jest.mocked(getValidators);
const mockedGetChainAPI = jest.mocked(getChainAPI);

const validators: ValidatorsAppValidator[] = [
  {
    activeStake: 0,
    commission: 1,
    totalScore: 2,
    voteAccount: "some random account",
  },
  {
    activeStake: 3,
    commission: 4,
    totalScore: 5,
    voteAccount: "some random account 2",
  },
];

describe("fetchValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("puts the Ledger validators first for solana", async () => {
    mockedGetValidators.mockImplementationOnce(() => Promise.resolve(validators));

    const result = await fetchValidators(CONFIG, "solana");

    expect(result).toEqual(
      expect.arrayContaining([
        ...validators,
        LEDGER_VALIDATOR_BY_FIGMENT,
        LEDGER_VALIDATOR_BY_BITWISE,
      ]),
    );
  });

  it("returns the validators as-is for solana_testnet", async () => {
    mockedGetValidators.mockImplementationOnce(() => Promise.resolve(validators));

    const result = await fetchValidators(CONFIG, "solana_testnet");

    expect(mockedGetValidators).toHaveBeenCalledWith("https://validators.test.invalid", undefined);
    expect(result).toEqual(validators);
  });

  it("throws when the coin config has no validatorsUrl", async () => {
    const { validatorsUrl: _, ...withoutValidatorsUrl } = CONFIG;

    await expect(fetchValidators(withoutValidatorsUrl, "solana")).rejects.toThrow(
      "no validatorsUrl in the coin config of solana",
    );
    expect(mockedGetValidators).not.toHaveBeenCalled();
  });

  it("derives the validators from the vote accounts for solana_devnet", async () => {
    const voteAccount = {
      activatedStake: 6,
      commission: 7,
      votePubkey: "some random account from account",
    };
    mockedGetChainAPI.mockReturnValueOnce({
      getVoteAccounts: () => Promise.resolve({ current: [voteAccount] }),
    } as unknown as ReturnType<typeof getChainAPI>);

    const result = await fetchValidators(CONFIG, "solana_devnet");

    expect(mockedGetChainAPI).toHaveBeenCalledWith({
      endpoint: "https://solana-devnet.test.invalid",
    });
    expect(mockedGetValidators).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        activeStake: voteAccount.activatedStake,
        commission: voteAccount.commission,
        voteAccount: voteAccount.votePubkey,
        totalScore: 0,
      },
    ]);
  });

  it("throws for an unknown currency id", async () => {
    await expect(fetchValidators(CONFIG, "not_solana")).rejects.toThrow();
  });
});

describe("getSolanaValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSolanaValidators.reset();
  });

  it("fetches only once for concurrent calls on the same currency", async () => {
    mockedGetValidators.mockImplementation(() => Promise.resolve(validators));

    await Promise.all([
      getSolanaValidators(context, "solana"),
      getSolanaValidators(context, "solana"),
    ]);
    await getSolanaValidators(context, "solana");

    expect(mockedGetValidators).toHaveBeenCalledTimes(1);
  });

  it("fetches again once the entry is cleared", async () => {
    mockedGetValidators.mockImplementation(() => Promise.resolve(validators));

    await getSolanaValidators(context, "solana");
    getSolanaValidators.clear("solana");
    await getSolanaValidators(context, "solana");

    expect(mockedGetValidators).toHaveBeenCalledTimes(2);
  });

  it("keeps a separate cache per configured TTL", async () => {
    mockedGetValidators.mockImplementation(() => Promise.resolve(validators));

    await getSolanaValidators(context, "solana");
    await getSolanaValidators(contextOf({ ...CONFIG, validators: { cacheTtlMs: 1000 } }), "solana");
    await getSolanaValidators(context, "solana");

    expect(mockedGetValidators).toHaveBeenCalledTimes(2);
  });

  it("does not share a result between configs with the same currency and TTL", async () => {
    const otherValidators = [{ ...validators[0], voteAccount: "from the other list" }];
    mockedGetValidators.mockImplementation(async url =>
      url === "https://other-validators.test.invalid" ? otherValidators : validators,
    );
    const otherContext = contextOf({
      ...CONFIG,
      validatorsUrl: "https://other-validators.test.invalid",
    });

    await getSolanaValidators(context, "solana");
    const fromOther = await getSolanaValidators(otherContext, "solana");

    expect(mockedGetValidators).toHaveBeenCalledTimes(2);
    expect(fromOther).toEqual(expect.arrayContaining(otherValidators));
    expect(fromOther).not.toEqual(expect.arrayContaining(validators));
  });

  it("clears every config variant of a currency", async () => {
    mockedGetValidators.mockImplementation(() => Promise.resolve(validators));
    const otherContext = contextOf({
      ...CONFIG,
      validatorsUrl: "https://other-validators.test.invalid",
    });

    await getSolanaValidators(context, "solana");
    await getSolanaValidators(otherContext, "solana");
    getSolanaValidators.clear("solana");
    await getSolanaValidators(context, "solana");
    await getSolanaValidators(otherContext, "solana");

    expect(mockedGetValidators).toHaveBeenCalledTimes(4);
  });

  it("does not cache failures", async () => {
    mockedGetValidators.mockRejectedValueOnce(new Error("validators.app is down"));
    mockedGetValidators.mockImplementationOnce(() => Promise.resolve(validators));

    await expect(getSolanaValidators(context, "solana")).rejects.toThrow("validators.app is down");
    await expect(getSolanaValidators(context, "solana")).resolves.toEqual(
      expect.arrayContaining(validators),
    );
  });
});
