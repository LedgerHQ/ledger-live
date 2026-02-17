/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Cluster } from "@solana/web3.js";
import { firstValueFrom } from "rxjs";
import { ChainAPI } from "./network";
import { getValidators, ValidatorsAppValidator } from "./network/validator-app";
import { preloadWithAPI } from "./preload";
import { getSolanaPreloadData } from "./preload-data";
import { LEDGER_VALIDATOR_BY_CHORUS_ONE, LEDGER_VALIDATOR_BY_FIGMENT } from "./utils";

jest.mock("./network/validator-app");

const mockedGetValidators = jest.mocked(getValidators);

describe("preloadWithAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return correctly the preloaded data for solana", async () => {
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
    mockedGetValidators.mockImplementationOnce((_cluster: Cluster) => Promise.resolve(validators));

    const currency = {
      id: "solana",
    } as unknown as CryptoCurrency;

    const result = await preloadWithAPI(currency, {} as unknown as ChainAPI);
    expect(result).toEqual({
      validators: expect.arrayContaining([
        ...validators,
        LEDGER_VALIDATOR_BY_FIGMENT,
        LEDGER_VALIDATOR_BY_CHORUS_ONE,
      ]),
      validatorsWithMeta: [],
      version: "1",
    });

    const solanaPreloadedData = await firstValueFrom(getSolanaPreloadData(currency));
    expect(solanaPreloadedData).toEqual(result);
  });

  it("should return correctly the preloaded data for solana_devnet", async () => {
    const voteAccount = {
      activatedStake: 6,
      commission: 7,
      votePubkey: "some random account from account",
    };

    const api = {
      getVoteAccounts: () =>
        Promise.resolve({
          current: [voteAccount],
        }),
    } as unknown as ChainAPI;

    const currency = {
      id: "solana_devnet",
    } as unknown as CryptoCurrency;
    const result = await preloadWithAPI(currency, api);
    expect(result).toEqual({
      validators: expect.arrayContaining([
        {
          activeStake: voteAccount.activatedStake,
          commission: voteAccount.commission,
          voteAccount: voteAccount.votePubkey,
          totalScore: 0,
        },
      ]),
      validatorsWithMeta: [],
      version: "1",
    });

    const solanaPreloadedData = await firstValueFrom(getSolanaPreloadData(currency));
    expect(solanaPreloadedData).toEqual(result);
  });

  it("should return correctly the preloaded data for solana_testnet", async () => {
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
    mockedGetValidators.mockImplementationOnce((_cluster: Cluster) => Promise.resolve(validators));

    const currency = {
      id: "solana_testnet",
    } as unknown as CryptoCurrency;

    const result = await preloadWithAPI(currency, {} as unknown as ChainAPI);
    expect(result).toEqual({
      validators: expect.arrayContaining(validators),
      validatorsWithMeta: [],
      version: "1",
    });

    const solanaPreloadedData = await firstValueFrom(getSolanaPreloadData(currency));
    expect(solanaPreloadedData).toEqual(result);
  });
});
