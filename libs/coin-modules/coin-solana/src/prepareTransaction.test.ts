import { NotEnoughGas } from "@ledgerhq/errors";
import { Account, VersionedMessage } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { transaction } from "./__tests__/fixtures/helpers.fixture";
import { SolanaMemoIsTooLong } from "./errors";
import * as logicValidateMemo from "./logic/validateMemo";
import { ChainAPI } from "./network";
import { prepareTransaction } from "./prepareTransaction";
import { SolanaAccount, Transaction, TransferTransaction } from "./types";

jest.mock("./estimateMaxSpendable", () => {
  const originalModule = jest.requireActual("./estimateMaxSpendable");

  return {
    __esModule: true,
    ...originalModule,
    estimateFeeAndSpendable: jest.fn(
      (_api: ChainAPI, _account: Account, _transaction?: Transaction | undefined | null) =>
        Promise.resolve({ fee: 0, spendable: BigNumber(0) }),
    ),
  };
});
jest.mock("./logic/validateMemo", () => {
  const actual = jest.requireActual("./logic/validateMemo");
  return {
    ...actual,
    validateMemo: jest.fn(actual.validateMemo), // replace with mock
  };
});

const mockGetMaybeVoteAccount = jest.fn();
const mockGetStakeAccountAddressWithSeed = jest.fn();
const mockGetStakeAccountMinimumBalanceForRentExemption = jest.fn();
jest.mock("./network/chain/web3", () => {
  const actual = jest.requireActual("./network/chain/web3");
  return {
    ...actual,
    getMaybeVoteAccount: (...args: unknown[]) => mockGetMaybeVoteAccount(...args),
    getStakeAccountAddressWithSeed: (...args: unknown[]) =>
      mockGetStakeAccountAddressWithSeed(...args),
    getStakeAccountMinimumBalanceForRentExemption: (...args: unknown[]) =>
      mockGetStakeAccountMinimumBalanceForRentExemption(...args),
  };
});

describe("testing prepareTransaction", () => {
  const spiedValidateMemo = logicValidateMemo.validateMemo as jest.Mock;

  it("packs a 'NotEnoughGas' error if the sender can not afford the fees during a token transfer", async () => {
    const preparedTransaction = await prepareTransaction(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {
        currency: { units: [{ magnitude: 2 }] },
        subAccounts: [
          {
            id: "subAccountId",
            type: "TokenAccount",
            token: { contractAddress: "mintAddress", units: [{ magnitude: 2 }] },
          },
        ],
      } as unknown as SolanaAccount,
      transaction({ kind: "token.transfer", subAccountId: "subAccountId" }),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {
        getAccountInfo: () => ({
          data: {
            parsed: {
              type: "mint",
              info: {
                mintAuthority: null,
                supply: "",
                decimals: 2,
                isInitialized: true,
                freezeAuthority: null,
              },
            },
            program: "spl-token",
          },
        }),
      } as unknown as ChainAPI,
    );

    expect(preparedTransaction.model.commandDescriptor?.errors.gasPrice).toBeInstanceOf(
      NotEnoughGas,
    );
  });

  it("does not fail on unknown SPL 2022 extensions", async () => {
    const preparedTransaction = prepareTransaction(
      {
        currency: { units: [{ magnitude: 2 }] },
        subAccounts: [
          {
            id: "subAccountId",
            type: "TokenAccount",
            token: { contractAddress: "mintAddress", units: [{ magnitude: 2 }] },
          },
        ],
      } as unknown as SolanaAccount,
      transaction({ kind: "token.transfer", subAccountId: "subAccountId" }),
      {
        getAccountInfo: () => ({
          data: {
            parsed: {
              type: "mint",
              info: {
                extensions: [{ extension: "defaultAccountState" }],
                mintAuthority: null,
                supply: "",
                decimals: 2,
                isInitialized: true,
                freezeAuthority: null,
              },
            },
            program: "spl-token-2022",
          },
        }),
      } as unknown as ChainAPI,
    );

    await expect(() => preparedTransaction).not.toThrow();
  });

  it("should return a new transaction from the raw transaction when user provide it", async () => {
    // Given
    const estimatedFees = 0.00005;
    const rawTransaction = transaction({
      raw: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=",
    });
    const chainAPI = api(estimatedFees);
    const getFeeForMessageSpy = jest.spyOn(chainAPI, "getFeeForMessage");

    // When
    const preparedTransaction = await prepareTransaction(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {} as SolanaAccount,
      rawTransaction,
      chainAPI,
    );

    // Then
    expect(preparedTransaction).not.toBe(rawTransaction);

    expect(getFeeForMessageSpy).toHaveBeenCalledTimes(1);

    expect(preparedTransaction).toMatchObject({
      raw: rawTransaction.raw,
      family: "solana",
      amount: BigNumber(0),
      recipient: "",
      model: {
        kind: "raw",
        uiState: {},
        commandDescriptor: {
          command: {
            kind: "raw",
            raw: rawTransaction.raw,
          },
          fee: estimatedFees,
          warnings: {},
          errors: {},
        },
      },
    });
  });

  it("should return a new transaction when user does not provide a raw one", async () => {
    const nonRawTransaction = transaction();
    const preparedTransaction = await prepareTransaction(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {} as SolanaAccount,
      nonRawTransaction,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      {} as ChainAPI,
    );

    expect(preparedTransaction).not.toBe(nonRawTransaction);
  });

  it.each(["transfer", "token.transfer"])(
    "should not set error on transaction when memo is validated for kind %s",
    async (kind: string) => {
      spiedValidateMemo.mockReturnValue(true);

      const transactionToPrepare = transaction({
        kind: kind as Transaction["model"]["kind"],
        subAccountId: "subAccountId",
      });
      const preparedTransaction = await prepareTransaction(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          currency: { units: [{ magnitude: 2 }] },
          subAccounts: [
            {
              id: "subAccountId",
              type: "TokenAccount",
              token: { contractAddress: "mintAddress", units: [{ magnitude: 2 }] },
            },
          ],
        } as unknown as SolanaAccount,
        transactionToPrepare,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          getAccountInfo: () => ({
            data: {
              parsed: {
                type: "mint",
                info: {
                  mintAuthority: null,
                  supply: "",
                  decimals: 2,
                  isInitialized: true,
                  freezeAuthority: null,
                },
              },
              program: "spl-token",
            },
          }),
        } as unknown as ChainAPI,
      );

      expect(preparedTransaction.model.commandDescriptor?.errors.transaction).not.toBeDefined();

      expect(spiedValidateMemo).toHaveBeenCalledWith(
        (transactionToPrepare.model as TransferTransaction).uiState.memo,
      );
    },
  );

  it.each(["transfer", "token.transfer"])(
    "should set error on transaction when memo is invalidated for kind %s",
    async (kind: string) => {
      spiedValidateMemo.mockReturnValue(false);

      const transactionToPrepare = transaction({
        kind: kind as Transaction["model"]["kind"],
        subAccountId: "subAccountId",
      });
      const preparedTransaction = await prepareTransaction(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          currency: { units: [{ magnitude: 2 }] },
          subAccounts: [
            {
              id: "subAccountId",
              type: "TokenAccount",
              token: { contractAddress: "mintAddress", units: [{ magnitude: 2 }] },
            },
          ],
        } as unknown as SolanaAccount,
        transactionToPrepare,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          getAccountInfo: () => ({
            data: {
              parsed: {
                type: "mint",
                info: {
                  mintAuthority: null,
                  supply: "",
                  decimals: 2,
                  isInitialized: true,
                  freezeAuthority: null,
                },
              },
              program: "spl-token",
            },
          }),
        } as unknown as ChainAPI,
      );

      expect(preparedTransaction.model.commandDescriptor?.errors.transaction).toBeInstanceOf(
        SolanaMemoIsTooLong,
      );

      expect(spiedValidateMemo).toHaveBeenCalledWith(
        (transactionToPrepare.model as TransferTransaction).uiState.memo,
      );
    },
  );

  describe("stake.createAccount and stake.split (createWithSeed-compatible seed)", () => {
    const voteAccAddress = "Vote111111111111111111111111111111111111111111";
    const stakeAccAddress = "StakeAccountAddr111111111111111111111111111";
    const STAKE_SEED_MAX_BYTES = 32;

    beforeEach(() => {
      mockGetMaybeVoteAccount.mockResolvedValue({});
      mockGetStakeAccountAddressWithSeed.mockResolvedValue(stakeAccAddress);
      mockGetStakeAccountMinimumBalanceForRentExemption.mockResolvedValue(123456);
    });

    it("should derive stake.createAccount command with seed <= 32 bytes", async () => {
      const stakeCreateTx = transaction({
        kind: "stake.createAccount",
        uiState: { delegate: { voteAccAddress } },
      });
      (stakeCreateTx as { amount?: BigNumber }).amount = new BigNumber(1000);

      const preparedTransaction = await prepareTransaction(
        {
          currency: { units: [{ magnitude: 9 }] },
          freshAddress: "Sender11111111111111111111111111111111",
          spendableBalance: new BigNumber(1e9),
        } as unknown as SolanaAccount,
        stakeCreateTx,
        {} as ChainAPI,
      );

      const command = preparedTransaction.model.commandDescriptor?.command;
      expect(command !== undefined && command !== null).toBe(true);
      expect(command?.kind).toBe("stake.createAccount");
      if (command?.kind === "stake.createAccount") {
        expect(command.seed).toMatch(/^stake:[0-9a-f]{26}$/);
        expect(Buffer.byteLength(command.seed, "utf8")).toBeLessThanOrEqual(STAKE_SEED_MAX_BYTES);
        expect(command.stakeAccAddress).toBe(stakeAccAddress);
      }
    });

    it("should derive stake.split command with seed <= 32 bytes", async () => {
      const stakeSplitTx = transaction({
        kind: "stake.split",
        uiState: { stakeAccAddr: stakeAccAddress },
      });
      (stakeSplitTx as { amount?: BigNumber }).amount = new BigNumber(500);

      const preparedTransaction = await prepareTransaction(
        {
          currency: { units: [{ magnitude: 9 }] },
          freshAddress: "Sender11111111111111111111111111111111",
          solanaResources: { stakes: [] },
        } as unknown as SolanaAccount,
        stakeSplitTx,
        {} as ChainAPI,
      );

      const command = preparedTransaction.model.commandDescriptor?.command;
      expect(command !== undefined && command !== null).toBe(true);
      expect(command?.kind).toBe("stake.split");
      if (command?.kind === "stake.split") {
        expect(command.seed).toMatch(/^stake:[0-9a-f]{26}$/);
        expect(Buffer.byteLength(command.seed, "utf8")).toBeLessThanOrEqual(STAKE_SEED_MAX_BYTES);
        expect(command.splitStakeAccAddr).toBe(stakeAccAddress);
      }
    });
  });
});

function api(estimatedFees?: number) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    getLatestBlockhash: () => {
      return Promise.resolve({
        blockhash: "blockhash",
        lastValidBlockHeight: 1,
      });
    },

    getFeeForMessage: (_message: VersionedMessage) => Promise.resolve(estimatedFees),
  } as ChainAPI;
}
