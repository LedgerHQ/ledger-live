import { Account, VersionedMessage } from "@solana/web3.js";
import { ChainAPI } from "./network";
import { prepareTransaction } from "./prepareTransaction";
import { SolanaAccount, Transaction } from "./types";
import BigNumber from "bignumber.js";
import { transaction } from "./__tests__/fixtures/helpers.fixture";
import { NotEnoughGas } from "@ledgerhq/errors";

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

describe("testing prepareTransaction", () => {
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
