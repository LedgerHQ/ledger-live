import type { Cluster } from "@solana/web3.js";
import { getChainAPI } from "./network";
import { getValidators } from "./network/validator-app";
import type { ValidatorsAppValidator } from "./network/validator-app";
import { LEDGER_VALIDATOR_BY_BITWISE, LEDGER_VALIDATOR_BY_FIGMENT } from "./utils";
import { fetchValidators, getSolanaValidators } from "./validators";
import coinConfig, { type SolanaCoinConfig } from "./config";

coinConfig.setCoinConfig(
  () =>
    ({
      token2022Enabled: false,
      legacyOCMSMaxVersion: "1.0.0",
      status: { type: "active" },
    }) as SolanaCoinConfig,
);

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
    mockedGetValidators.mockImplementationOnce((_cluster: Cluster) => Promise.resolve(validators));

    const result = await fetchValidators("solana");

    expect(result).toEqual(
      expect.arrayContaining([
        ...validators,
        LEDGER_VALIDATOR_BY_FIGMENT,
        LEDGER_VALIDATOR_BY_BITWISE,
      ]),
    );
  });

  it("returns the validators as-is for solana_testnet", async () => {
    mockedGetValidators.mockImplementationOnce((_cluster: Cluster) => Promise.resolve(validators));

    const result = await fetchValidators("solana_testnet");

    expect(result).toEqual(validators);
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

    const result = await fetchValidators("solana_devnet");

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
    await expect(fetchValidators("not_solana")).rejects.toThrow();
  });
});

describe("getSolanaValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSolanaValidators.reset();
  });

  it("fetches only once for concurrent calls on the same currency", async () => {
    mockedGetValidators.mockImplementation((_cluster: Cluster) => Promise.resolve(validators));

    await Promise.all([getSolanaValidators("solana"), getSolanaValidators("solana")]);
    await getSolanaValidators("solana");

    expect(mockedGetValidators).toHaveBeenCalledTimes(1);
  });

  it("fetches again once the entry is cleared", async () => {
    mockedGetValidators.mockImplementation((_cluster: Cluster) => Promise.resolve(validators));

    await getSolanaValidators("solana");
    getSolanaValidators.clear("solana");
    await getSolanaValidators("solana");

    expect(mockedGetValidators).toHaveBeenCalledTimes(2);
  });

  it("does not cache failures", async () => {
    mockedGetValidators.mockRejectedValueOnce(new Error("validators.app is down"));
    mockedGetValidators.mockImplementationOnce((_cluster: Cluster) => Promise.resolve(validators));

    await expect(getSolanaValidators("solana")).rejects.toThrow("validators.app is down");
    await expect(getSolanaValidators("solana")).resolves.toEqual(
      expect.arrayContaining(validators),
    );
  });
});
