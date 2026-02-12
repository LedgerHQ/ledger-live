import { encodeAccountId } from "@ledgerhq/coin-framework/lib/account/accountId";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import cloneDeep from "lodash/cloneDeep";
import usdcTokenData from "../__fixtures__/solana-spl-epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v.json";
import {
  SolanaRecipientMemoIsRequired,
  SolanaTokenAccountFrozen,
  SolanaTokenNonTransferable,
} from "../errors";
import getTransactionStatus from "../getTransactionStatus";
import { calculateToken2022TransferFees } from "../helpers/token";
import { encodeAccountIdWithTokenAccountAddress } from "../logic";

import { ChainAPI, LAST_VALID_BLOCK_HEIGHT_MOCK, LATEST_BLOCKHASH_MOCK } from "../network";
import { NonTransferableExt, TransferFeeConfigExt } from "../network/chain/account/tokenExtensions";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import { prepareTransaction } from "../prepareTransaction";
import {
  SolanaAccount,
  SolanaTokenAccount,
  SolanaTokenProgram,
  TokenTransferCommand,
  TokenTransferTransaction,
  Transaction,
  TransactionStatus,
} from "../types";

const USDC_TOKEN = usdcTokenData as unknown as TokenCurrency;

// fake addresses
const testData = {
  address1: "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe",
  address2: "6oK54jLodm3D5Qd7Zju5D4LPXhWX61hzog15pvc6UVrX",
  address3: "DYS9SVj8nhK2V7NprSRqbWpiF8euSGWv4QTSX45HTbfX",
  mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  ataAddress1: PublicKey.findProgramAddressSync(
    [
      new PublicKey("8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe").toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0].toBase58(),
  fees: 5000,
};

const mainAccId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "solana",
  xpubOrAddress: testData.address1,
  derivationMode: "solanaMain",
});

const wSolSubAccId = encodeAccountIdWithTokenAccountAddress(mainAccId, testData.ataAddress1);

setupMockCryptoAssetsStore({
  findTokenByAddressInCurrency: async (address: string, _currencyId: string) => {
    if (address === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
      return USDC_TOKEN;
    }
    return undefined;
  },
  getTokensSyncHash: async () => "0",
});

// Create a mock token for testing
const wSolToken: TokenCurrency = {
  type: "TokenCurrency",
  id: testData.mintAddress,
  contractAddress: testData.mintAddress,
  name: "Wrapped SOL",
  ticker: "WSOL",
  units: [{ name: "WSOL", code: "WSOL", magnitude: 9 }],
  parentCurrency: getCryptoCurrencyById("solana"),
} as TokenCurrency;

const baseAccount = {
  balance: new BigNumber(10000),
  spendableBalance: new BigNumber(10000),
} as Account;

const baseAPI = {
  getLatestBlockhash: () =>
    Promise.resolve({
      blockhash: LATEST_BLOCKHASH_MOCK,
      lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT_MOCK,
    }),
  getFeeForMessage: (_msg: unknown) => Promise.resolve(testData.fees),
  getRecentPrioritizationFees: (_: string[]) => {
    return Promise.resolve([
      {
        slot: 122422797,
        prioritizationFee: 0,
      },
      {
        slot: 122422797,
        prioritizationFee: 0,
      },
    ]);
  },
  getSimulationComputeUnits: (_ixs: any[], _payer: any) => Promise.resolve(1000),
  getBalance: (_: string) => Promise.resolve(10),
  findAssocTokenAccAddress: (owner: string, mint: string, program: SolanaTokenProgram) => {
    return Promise.resolve(
      PublicKey.findProgramAddressSync(
        [
          new PublicKey(owner).toBuffer(),
          program === "spl-token" ? TOKEN_PROGRAM_ID.toBuffer() : TOKEN_2022_PROGRAM_ID.toBuffer(),
          new PublicKey(mint).toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID,
      )[0].toBase58(),
    );
  },
} as ChainAPI;

// Broken tests as the address used is not support anymore
// Returning other errors we don't expect
describe("Solana tokens bridge integration tests", () => {
  const baseSolanaAccount: SolanaAccount = {
    ...baseAccount,
    freshAddress: testData.address1,
    solanaResources: { stakes: [], unstakeReserve: BigNumber(0) },
  };
  const baseTxModel: TokenTransferTransaction = {
    kind: "token.transfer",
    uiState: {
      subAccountId: wSolSubAccId,
    },
  };
  const baseTx: Transaction = {
    model: baseTxModel,
    amount: new BigNumber(10),
    recipient: testData.address2,
    family: "solana",
  };

  const baseAtaMock = {
    parsed: {
      info: {
        isNative: false,
        mint: wSolToken.contractAddress,
        owner: testData.address1,
        state: "initialized",
        tokenAmount: {
          amount: "10000000",
          decimals: wSolToken.units[0].magnitude,
          uiAmount: 10.0,
          uiAmountString: "10",
        },
      },
      type: "account",
    },
    program: PARSED_PROGRAMS.SPL_TOKEN,
    space: 165,
  };
  const frozenAtaMock = {
    ...baseAtaMock,
    parsed: {
      ...baseAtaMock.parsed,
      info: {
        ...baseAtaMock.parsed.info,
        state: "frozen",
      },
    },
  };

  const mockedTokenAcc: SolanaTokenAccount = {
    type: "TokenAccount",
    id: wSolSubAccId,
    parentId: mainAccId,
    token: wSolToken,
    balance: new BigNumber(100),
    operations: [],
    pendingOperations: [],
    spendableBalance: new BigNumber(100),
    state: "initialized",
    creationDate: new Date(),
    operationsCount: 0,
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
    swapHistory: [],
  };

  const baseAta2022Mock = {
    parsed: {
      info: {
        isNative: false,
        mint: wSolToken.contractAddress,
        owner: testData.address1,
        state: "initialized",
        tokenAmount: {
          amount: "10000000",
          decimals: wSolToken.units[0].magnitude,
          uiAmount: 10.0,
          uiAmountString: "10",
        },
      },
      type: "account",
    },
    program: PARSED_PROGRAMS.SPL_TOKEN_2022,
    space: 165,
  };
  const baseTokenMintMock = {
    data: {
      parsed: {
        info: {
          decimals: 9,
          freezeAuthority: null,
          isInitialized: true,
          mintAuthority: null,
          supply: "0",
        },
        type: "mint",
      },
      program: PARSED_PROGRAMS.SPL_TOKEN,
      space: 82,
    },
    executable: false,
    lamports: 419787401967,
    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    rentEpoch: 304,
  };
  const baseToken2022MintMock = {
    ...baseTokenMintMock,
    data: {
      ...baseTokenMintMock.data,
      parsed: {
        ...baseTokenMintMock.data.parsed,
        info: {
          ...baseTokenMintMock.data.parsed.info,
          extensions: [] as any[],
        },
      },
      program: PARSED_PROGRAMS.SPL_TOKEN_2022,
    },
  };
  const mockedToken2022Acc: SolanaTokenAccount = {
    ...mockedTokenAcc,
  };

  const buildTransferFeeConfig = (bps: number, maxFee: number): TransferFeeConfigExt => {
    return {
      extension: "transferFeeConfig",
      state: {
        newerTransferFee: {
          epoch: 300,
          maximumFee: maxFee,
          transferFeeBasisPoints: bps,
        },
        olderTransferFee: {
          epoch: 299,
          maximumFee: maxFee,
          transferFeeBasisPoints: bps,
        },
        transferFeeConfigAuthority: null,
        withdrawWithheldAuthority: null,
        withheldAmount: 0,
      },
    };
  };

  test("token.transfer :: status is success", async () => {
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(baseTokenMintMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAtaMock } as any);
      },
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [mockedTokenAcc],
    };

    const preparedTx = await prepareTransaction(account, baseTx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(10),
      errors: {},
      warnings: {},
    };

    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  // Send flow
  test("token.transfer :: status is success: transfer with subAccountId", async () => {
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(baseTokenMintMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAtaMock } as any);
      },
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [mockedTokenAcc],
    };

    const transferTxWithSubAccountId: Transaction = {
      model: {
        kind: "transfer",
        uiState: {},
      },
      amount: new BigNumber(10),
      recipient: testData.address2,
      family: "solana",
      subAccountId: wSolSubAccId,
    };

    const preparedTx = await prepareTransaction(account, transferTxWithSubAccountId, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(10),
      errors: {},
      warnings: {},
    };

    expect(preparedTx.model.commandDescriptor?.command.kind).toEqual("token.transfer");
    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  test("token.transfer :: status is error: sender ATA is frozen", async () => {
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(baseTokenMintMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAtaMock } as any);
      },
    } as ChainAPI;

    const tokenAcc: SolanaTokenAccount = {
      ...mockedTokenAcc,
      state: "frozen",
    };
    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [tokenAcc],
    };

    const preparedTx = await prepareTransaction(account, baseTx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(10),
      errors: {
        amount: new SolanaTokenAccountFrozen(),
      },
      warnings: {},
    };

    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  test("token.transfer :: status is error: recipient ATA is frozen", async () => {
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(baseTokenMintMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: frozenAtaMock } as any);
      },
    } as ChainAPI;

    const tokenAcc: SolanaTokenAccount = {
      ...mockedTokenAcc,
    };
    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [tokenAcc],
    };

    const preparedTx = await prepareTransaction(account, baseTx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(10),
      errors: {
        recipient: new SolanaTokenAccountFrozen(),
      },
      warnings: {},
    };

    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  test("token2022.transfer :: status is success", async () => {
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(baseToken2022MintMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAta2022Mock } as any);
      },
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [mockedToken2022Acc],
    };

    const preparedTx = await prepareTransaction(account, baseTx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(10),
      errors: {},
      warnings: {},
    };

    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  test("token2022.transfer :: ATA with required memo :: status is error", async () => {
    const ataWithRequiredMemoMock = cloneDeep(baseAta2022Mock);
    (ataWithRequiredMemoMock.parsed.info as any).extensions = [
      {
        extension: "memoTransfer",
        state: { requireIncomingTransferMemos: true },
      },
    ];
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(baseToken2022MintMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: ataWithRequiredMemoMock } as any);
      },
      getBalance: () => Promise.resolve(10),
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [mockedToken2022Acc],
    };

    const preparedTx = await prepareTransaction(account, baseTx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedErrors = {
      memo: new SolanaRecipientMemoIsRequired(),
      transaction: new SolanaRecipientMemoIsRequired(),
    };

    expect(receivedTxStatus.errors).toEqual(expectedErrors);
  });

  test("token2022.transfer :: correct transfer fee extension calculations", async () => {
    const mintWithTransferFeeMock = cloneDeep(baseToken2022MintMock);
    mintWithTransferFeeMock.data.program = PARSED_PROGRAMS.SPL_TOKEN_2022;

    const magnitude = BigNumber(10).pow(baseTokenMintMock.data.parsed.info.decimals);
    const maxFee = BigNumber(10).times(magnitude).toNumber();
    const bps = 100;
    const transferConfigExt: TransferFeeConfigExt = buildTransferFeeConfig(bps, maxFee);
    mintWithTransferFeeMock.data.parsed.info.extensions = [transferConfigExt];
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(mintWithTransferFeeMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAta2022Mock });
      },
      getBalance: () => Promise.resolve(BigNumber(100).times(magnitude).toNumber()),
      getEpochInfo: () => Promise.resolve({ epoch: 300 } as any),
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [
        {
          ...mockedToken2022Acc,
          balance: BigNumber(100).times(magnitude),
          spendableBalance: BigNumber(100).times(magnitude),
        },
      ],
    };

    const tx: Transaction = {
      ...baseTx,
      amount: BigNumber(1).times(magnitude),
    };

    const preparedTx = await prepareTransaction(account, tx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);

    const expectedExtensions = {
      transferFee: calculateToken2022TransferFees({
        transferAmount: tx.amount.toNumber(),
        currentEpoch: 300,
        transferFeeConfigState: transferConfigExt.state,
      }),
    };
    const expectedTxStatus: TransactionStatus = {
      amount: tx.amount,
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(expectedExtensions.transferFee.transferAmountIncludingFee),
      errors: {},
      warnings: {},
    };

    expect(receivedTxStatus).toEqual(expectedTxStatus);
    expect(
      (preparedTx.model.commandDescriptor?.command as TokenTransferCommand).extensions,
    ).toEqual(expectedExtensions);
  });

  test("token2022.transfer :: transfer fee with useAllAmount", async () => {
    const mintWithTransferFeeMock = cloneDeep(baseToken2022MintMock);
    mintWithTransferFeeMock.data.program = PARSED_PROGRAMS.SPL_TOKEN_2022;

    const magnitude = BigNumber(10).pow(baseTokenMintMock.data.parsed.info.decimals);
    const maxFee = BigNumber(10).times(magnitude).toNumber();
    const bps = 100;
    const transferConfigExt: TransferFeeConfigExt = buildTransferFeeConfig(bps, maxFee);

    mintWithTransferFeeMock.data.parsed.info.extensions = [transferConfigExt];
    const balance = BigNumber(100).times(magnitude);
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(mintWithTransferFeeMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAta2022Mock });
      },
      getBalance: () => Promise.resolve(balance.toNumber()),
      getEpochInfo: () => Promise.resolve({ epoch: 300 } as any),
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [
        {
          ...mockedToken2022Acc,
          balance: balance,
          spendableBalance: balance,
          extensions: {
            transferFee: { feeBps: bps },
          },
        } as SolanaTokenAccount,
      ],
    };

    const tx: Transaction = {
      ...baseTx,
      useAllAmount: true,
      amount: BigNumber(0),
    };

    const preparedTx = await prepareTransaction(account, tx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);

    const maxSpendable = calculateToken2022TransferFees({
      transferAmount: balance.toNumber(),
      currentEpoch: 300,
      transferFeeConfigState: transferConfigExt.state,
    }).transferAmountExcludingFee;

    const transferFeeConfig = calculateToken2022TransferFees({
      transferAmount: maxSpendable,
      currentEpoch: 300,
      transferFeeConfigState: transferConfigExt.state,
    });

    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(maxSpendable),
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(transferFeeConfig.transferAmountIncludingFee),
      errors: {},
      warnings: {},
    };

    expect((preparedTx.model.commandDescriptor?.command as TokenTransferCommand).amount).toBe(
      maxSpendable,
    );
    expect(
      (preparedTx.model.commandDescriptor?.command as TokenTransferCommand).extensions?.transferFee,
    ).toEqual(transferFeeConfig);
    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  test("token2022.transfer :: transfer fee is zero :: send amount success", async () => {
    const mintWithTransferFeeMock = cloneDeep(baseToken2022MintMock);
    mintWithTransferFeeMock.data.program = PARSED_PROGRAMS.SPL_TOKEN_2022;

    const magnitude = BigNumber(10).pow(baseTokenMintMock.data.parsed.info.decimals);
    const maxFee = BigNumber(10).times(magnitude).toNumber();
    const bps = 0;
    const transferConfigExt: TransferFeeConfigExt = buildTransferFeeConfig(bps, maxFee);

    mintWithTransferFeeMock.data.parsed.info.extensions = [transferConfigExt];
    const balance = BigNumber(100).times(magnitude);
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(mintWithTransferFeeMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAta2022Mock });
      },
      getBalance: () => Promise.resolve(balance.toNumber()),
      getEpochInfo: () => Promise.resolve({ epoch: 300 } as any),
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [
        {
          ...mockedToken2022Acc,
          balance: balance,
          spendableBalance: balance,
          extensions: {
            transferFee: { feeBps: bps },
          },
        } as SolanaTokenAccount,
      ],
    };

    const preparedTx = await prepareTransaction(account, baseTx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);

    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testData.fees),
      totalSpent: new BigNumber(10),
      errors: {},
      warnings: {},
    };
    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  test("token2022.transfer :: NonTransferable token :: tx returns SolanaTokenNonTransferable error", async () => {
    const mintWithNonTransferableExtensionMock = cloneDeep(baseToken2022MintMock);
    mintWithNonTransferableExtensionMock.data.parsed.info.extensions = [
      { extension: "nonTransferable" } as NonTransferableExt,
    ];
    const api = {
      ...baseAPI,
      getAccountInfo: (address: string) => {
        if (address === wSolToken.contractAddress) {
          return Promise.resolve(mintWithNonTransferableExtensionMock as any);
        }
        if (address === testData.address2) {
          return Promise.resolve({ data: {} });
        }
        return Promise.resolve({ data: baseAta2022Mock } as any);
      },
    } as ChainAPI;

    const account: SolanaAccount = {
      ...baseSolanaAccount,
      subAccounts: [mockedToken2022Acc],
    };

    expect(prepareTransaction(account, baseTx, api)).rejects.toThrow(SolanaTokenNonTransferable);
  });
});
