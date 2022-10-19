/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import { ChainAPI } from "../api";
import { Functions } from "../utils";

export const LATEST_BLOCKHASH_MOCK =
  "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

export const getMockedMethods = (): {
  method: Functions<ChainAPI>;
  params: any[];
  answer: any;
}[] => [
  // generated
  {
    method: "getBalanceAndContext",
    params: ["AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh"],
    answer: { context: { slot: 131414879 }, value: 83389840 },
  },
  {
    method: "getStakeAccountsByStakeAuth",
    params: ["AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh"],
    answer: [],
  },
  {
    method: "getStakeAccountsByWithdrawAuth",
    params: ["AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh"],
    answer: [],
  },
  {
    method: "getEpochInfo",
    params: [],
    answer: {
      absoluteSlot: 131414900,
      blockHeight: 119199863,
      epoch: 304,
      slotIndex: 86900,
      slotsInEpoch: 432000,
      transactionCount: 70907484287,
    },
  },
  {
    method: "getSignaturesForAddress",
    params: ["AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh", { limit: 100 }],
    answer: [
      {
        blockTime: 1637781134,
        confirmationStatus: "finalized",
        err: null,
        memo: null,
        signature:
          "A29zPnK1jPr2tGziTnaAvSnadYR2kLCv9sPywj9FJsaEFjtpwmUonspN3WJgz4u6XWmjtVpoFsDrygEnvW51cgk",
        slot: 108521109,
      },
      {
        blockTime: 1637780906,
        confirmationStatus: "finalized",
        err: null,
        memo: null,
        signature:
          "25KWBvKtVgKR3yoRmozTY6wmiW8atwrnzAnTXdsms8jqg5aR8GnCDxdJzWXtzMZPvbsE6SUuBkGFXudy2mrcTYna",
        slot: 108520722,
      },
    ],
  },
  {
    method: "getParsedTransactions",
    params: [
      [
        "A29zPnK1jPr2tGziTnaAvSnadYR2kLCv9sPywj9FJsaEFjtpwmUonspN3WJgz4u6XWmjtVpoFsDrygEnvW51cgk",
        "25KWBvKtVgKR3yoRmozTY6wmiW8atwrnzAnTXdsms8jqg5aR8GnCDxdJzWXtzMZPvbsE6SUuBkGFXudy2mrcTYna",
      ],
    ],
    answer: [
      {
        blockTime: 1637781134,
        meta: {
          err: null,
          fee: 5000,
          innerInstructions: [
            {
              index: 1,
              instructions: [
                {
                  parsed: {
                    info: {
                      account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                      space: 165,
                    },
                    type: "allocate",
                  },
                  program: "system",
                  programId: new PublicKey(Buffer.from("00", "hex")),
                },
                {
                  parsed: {
                    info: {
                      account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                      owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    },
                    type: "assign",
                  },
                  program: "system",
                  programId: new PublicKey(Buffer.from("00", "hex")),
                },
                {
                  parsed: {
                    info: {
                      account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                      mint: "So11111111111111111111111111111111111111112",
                      owner: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                      rentSysvar: "SysvarRent111111111111111111111111111111111",
                    },
                    type: "initializeAccount",
                  },
                  program: "spl-token",
                  programId: new PublicKey(
                    Buffer.from(
                      "06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9",
                      "hex"
                    )
                  ),
                },
              ],
            },
          ],
          logMessages: [
            "Program 11111111111111111111111111111111 invoke [1]",
            "Program 11111111111111111111111111111111 success",
            "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]",
            "Program log: Allocate space for the associated token account",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program log: Assign the associated token account to the SPL Token program",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program log: Initialize the associated token account",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: InitializeAccount",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3683 of 183452 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20880 of 200000 compute units",
            "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success",
          ],
          postBalances: [
            83389840, 10000000, 151314748907, 1, 1089991680, 1009200, 898174080,
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: "So11111111111111111111111111111111111111112",
              uiTokenAmount: {
                amount: "7960720",
                decimals: 9,
                uiAmount: 0.00796072,
                uiAmountString: "0.00796072",
              },
            },
          ],
          preBalances: [
            93394840, 0, 151314748907, 1, 1089991680, 1009200, 898174080,
          ],
          preTokenBalances: [],
          rewards: [],
          status: { Ok: null },
        },
        slot: 108521109,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "8bc4d3e507c0550e3d02ffb5f6daf0772240af8a09e32d236615b4a227243702",
                    "hex"
                  )
                ),
                signer: true,
                writable: true,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "6e6279fa638560ce9c178033f5b88eacfb5fba6d46ec5902769f1b09eaabc017",
                    "hex"
                  )
                ),
                signer: false,
                writable: true,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(Buffer.from("00", "hex")),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "06a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a00000000",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                parsed: {
                  info: {
                    destination: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                    lamports: 10000000,
                    source: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                  },
                  type: "transfer",
                },
                program: "system",
                programId: new PublicKey(Buffer.from("00", "hex")),
              },
              {
                parsed: {
                  info: {
                    account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                    mint: "So11111111111111111111111111111111111111112",
                    rentSysvar: "SysvarRent111111111111111111111111111111111",
                    source: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                    systemProgram: "11111111111111111111111111111111",
                    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    wallet: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                  },
                  type: "create",
                },
                program: "spl-associated-token-account",
                programId: new PublicKey(
                  Buffer.from(
                    "8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859",
                    "hex"
                  )
                ),
              },
            ],
            recentBlockhash: "9tPbgLaETEenufCt5SzXMuWijgFJj549W9j5cJLbaogn",
          },
          signatures: [
            "A29zPnK1jPr2tGziTnaAvSnadYR2kLCv9sPywj9FJsaEFjtpwmUonspN3WJgz4u6XWmjtVpoFsDrygEnvW51cgk",
          ],
        },
      },
      {
        blockTime: 1637780906,
        meta: {
          err: null,
          fee: 5000,
          innerInstructions: [],
          logMessages: [
            "Program 11111111111111111111111111111111 invoke [1]",
            "Program 11111111111111111111111111111111 success",
          ],
          postBalances: [0, 93394840, 1],
          postTokenBalances: [],
          preBalances: [93399840, 0, 1],
          preTokenBalances: [],
          rewards: [],
          status: { Ok: null },
        },
        slot: 108520722,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "5c1c77c3d1e8edad4cfb2b2f7e4497d0d83f19e176713876a1d01eeb30a9bf3f",
                    "hex"
                  )
                ),
                signer: true,
                writable: true,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "8bc4d3e507c0550e3d02ffb5f6daf0772240af8a09e32d236615b4a227243702",
                    "hex"
                  )
                ),
                signer: false,
                writable: true,
              },
              {
                pubkey: new PublicKey(Buffer.from("00", "hex")),
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                parsed: {
                  info: {
                    destination: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                    lamports: 93394840,
                    source: "7CZgkK494jMdoY8xpXY3ViLjpDGMbNikCzMtAT5cAjKk",
                  },
                  type: "transfer",
                },
                program: "system",
                programId: new PublicKey(Buffer.from("00", "hex")),
              },
            ],
            recentBlockhash: "4NSL4VrfWd2eUccMD95dLQsdy5UGz8yhokpfH1et1R2c",
          },
          signatures: [
            "25KWBvKtVgKR3yoRmozTY6wmiW8atwrnzAnTXdsms8jqg5aR8GnCDxdJzWXtzMZPvbsE6SUuBkGFXudy2mrcTYna",
          ],
        },
      },
    ],
  },
  {
    method: "getBalanceAndContext",
    params: ["6rEgdtB3sgjKJnRE172YEr9z6qUyr4nFW28vJokuD36A"],
    answer: { context: { slot: 131414902 }, value: 0 },
  },
  {
    method: "getStakeAccountsByStakeAuth",
    params: ["6rEgdtB3sgjKJnRE172YEr9z6qUyr4nFW28vJokuD36A"],
    answer: [],
  },
  {
    method: "getStakeAccountsByWithdrawAuth",
    params: ["6rEgdtB3sgjKJnRE172YEr9z6qUyr4nFW28vJokuD36A"],
    answer: [],
  },
  {
    method: "getSignaturesForAddress",
    params: ["6rEgdtB3sgjKJnRE172YEr9z6qUyr4nFW28vJokuD36A", { limit: 100 }],
    answer: [],
  },
  {
    method: "getSignaturesForAddress",
    params: [
      "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
      {
        until:
          "25KWBvKtVgKR3yoRmozTY6wmiW8atwrnzAnTXdsms8jqg5aR8GnCDxdJzWXtzMZPvbsE6SUuBkGFXudy2mrcTYna",
        limit: 100,
      },
    ],
    answer: [
      {
        blockTime: 1637781134,
        confirmationStatus: "finalized",
        err: null,
        memo: null,
        signature:
          "A29zPnK1jPr2tGziTnaAvSnadYR2kLCv9sPywj9FJsaEFjtpwmUonspN3WJgz4u6XWmjtVpoFsDrygEnvW51cgk",
        slot: 108521109,
      },
    ],
  },
  {
    method: "getParsedTransactions",
    params: [
      [
        "A29zPnK1jPr2tGziTnaAvSnadYR2kLCv9sPywj9FJsaEFjtpwmUonspN3WJgz4u6XWmjtVpoFsDrygEnvW51cgk",
      ],
    ],
    answer: [
      {
        blockTime: 1637781134,
        meta: {
          err: null,
          fee: 5000,
          innerInstructions: [
            {
              index: 1,
              instructions: [
                {
                  parsed: {
                    info: {
                      account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                      space: 165,
                    },
                    type: "allocate",
                  },
                  program: "system",
                  programId: new PublicKey(Buffer.from("00", "hex")),
                },
                {
                  parsed: {
                    info: {
                      account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                      owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    },
                    type: "assign",
                  },
                  program: "system",
                  programId: new PublicKey(Buffer.from("00", "hex")),
                },
                {
                  parsed: {
                    info: {
                      account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                      mint: "So11111111111111111111111111111111111111112",
                      owner: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                      rentSysvar: "SysvarRent111111111111111111111111111111111",
                    },
                    type: "initializeAccount",
                  },
                  program: "spl-token",
                  programId: new PublicKey(
                    Buffer.from(
                      "06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9",
                      "hex"
                    )
                  ),
                },
              ],
            },
          ],
          logMessages: [
            "Program 11111111111111111111111111111111 invoke [1]",
            "Program 11111111111111111111111111111111 success",
            "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]",
            "Program log: Allocate space for the associated token account",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program log: Assign the associated token account to the SPL Token program",
            "Program 11111111111111111111111111111111 invoke [2]",
            "Program 11111111111111111111111111111111 success",
            "Program log: Initialize the associated token account",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
            "Program log: Instruction: InitializeAccount",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3683 of 183452 compute units",
            "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
            "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20880 of 200000 compute units",
            "Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success",
          ],
          postBalances: [
            83389840, 10000000, 151314748907, 1, 1089991680, 1009200, 898174080,
          ],
          postTokenBalances: [
            {
              accountIndex: 1,
              mint: "So11111111111111111111111111111111111111112",
              uiTokenAmount: {
                amount: "7960720",
                decimals: 9,
                uiAmount: 0.00796072,
                uiAmountString: "0.00796072",
              },
            },
          ],
          preBalances: [
            93394840, 0, 151314748907, 1, 1089991680, 1009200, 898174080,
          ],
          preTokenBalances: [],
          rewards: [],
          status: { Ok: null },
        },
        slot: 108521109,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "8bc4d3e507c0550e3d02ffb5f6daf0772240af8a09e32d236615b4a227243702",
                    "hex"
                  )
                ),
                signer: true,
                writable: true,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "6e6279fa638560ce9c178033f5b88eacfb5fba6d46ec5902769f1b09eaabc017",
                    "hex"
                  )
                ),
                signer: false,
                writable: true,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(Buffer.from("00", "hex")),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "06a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a00000000",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
              {
                pubkey: new PublicKey(
                  Buffer.from(
                    "8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859",
                    "hex"
                  )
                ),
                signer: false,
                writable: false,
              },
            ],
            instructions: [
              {
                parsed: {
                  info: {
                    destination: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                    lamports: 10000000,
                    source: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                  },
                  type: "transfer",
                },
                program: "system",
                programId: new PublicKey(Buffer.from("00", "hex")),
              },
              {
                parsed: {
                  info: {
                    account: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
                    mint: "So11111111111111111111111111111111111111112",
                    rentSysvar: "SysvarRent111111111111111111111111111111111",
                    source: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                    systemProgram: "11111111111111111111111111111111",
                    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    wallet: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
                  },
                  type: "create",
                },
                program: "spl-associated-token-account",
                programId: new PublicKey(
                  Buffer.from(
                    "8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859",
                    "hex"
                  )
                ),
              },
            ],
            recentBlockhash: "9tPbgLaETEenufCt5SzXMuWijgFJj549W9j5cJLbaogn",
          },
          signatures: [
            "A29zPnK1jPr2tGziTnaAvSnadYR2kLCv9sPywj9FJsaEFjtpwmUonspN3WJgz4u6XWmjtVpoFsDrygEnvW51cgk",
          ],
        },
      },
    ],
  },
  {
    method: "getFeeForMessage",
    params: [
      "AQABAovE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADEo5CuDJaGJc0T3H9cHZMfm+dwqUYAVMIHcpPpz8+/EAEBAgAADAIAAAAAAAAAAAAAAA==",
    ],
    answer: 5000,
  },
  {
    method: "getBalance",
    params: ["ARRKL4FT4LMwpkhUw4xNbfiHqR7UdePtzGLvkszgydqZ"],
    answer: 1000000,
  },
  {
    method: "getBalance",
    params: ["7b6Q3ap8qRzfyvDw1Qce3fUV8C7WgFNzJQwYNTJm3KQo"],
    answer: 0,
  },
  {
    method: "getBalance",
    params: ["6D8GtWkKJgToM5UoiByHqjQCCC9Dq1Hh7iNmU4jKSs14"],
    answer: 0,
  },
  {
    method: "getFeeForMessage",
    params: [
      "AQAHCYvE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCkK27LLNY6eC4Oopo9T5pT6ilPbrKrCQzbBTnjc6Is6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPvfa23MtQtiianuC7I04dS2mXOSDF52Lml8O1EQGGoOBqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAGodgXpQIFC2gHkebObbiOHltxUPYfxnkKTrTRAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAABqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAAAGp9UXGTWE0P7tm7NDHRMga+VEKBtXuFZsxTdf9AAAAMSjkK4MloYlzRPcf1wdkx+b53CpRgBUwgdyk+nPz78QAwICAAFcAwAAAIvE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCAAAAAAAAAAAAAAAAAAAAAMgAAAAAAAAABqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAEAgEHdAAAAACLxNPlB8BVDj0C/7X22vB3IkCvignjLSNmFbSiJyQ3AovE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAYBAwYIBQAEAgAAAA==",
    ],
    answer: 5000,
  },
  {
    method: "getMinimumBalanceForRentExemption",
    params: [200],
    answer: 2282880,
  },
  {
    method: "getAccountInfo",
    params: ["9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF"],
    answer: {
      data: {
        parsed: {
          info: {
            authorizedVoters: [
              {
                authorizedVoter: "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4",
                epoch: 304,
              },
            ],
            authorizedWithdrawer:
              "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4",
            commission: 7,
            epochCredits: [
              { credits: "83658257", epoch: 241, previousCredits: "83257955" },
              { credits: "84043555", epoch: 242, previousCredits: "83658257" },
              { credits: "84430030", epoch: 243, previousCredits: "84043555" },
              { credits: "84826592", epoch: 244, previousCredits: "84430030" },
              { credits: "85206845", epoch: 245, previousCredits: "84826592" },
              { credits: "85584036", epoch: 246, previousCredits: "85206845" },
              { credits: "85969381", epoch: 247, previousCredits: "85584036" },
              { credits: "86337460", epoch: 248, previousCredits: "85969381" },
              { credits: "86726082", epoch: 249, previousCredits: "86337460" },
              { credits: "87095806", epoch: 250, previousCredits: "86726082" },
              { credits: "87466570", epoch: 251, previousCredits: "87095806" },
              { credits: "87843044", epoch: 252, previousCredits: "87466570" },
              { credits: "88204705", epoch: 253, previousCredits: "87843044" },
              { credits: "88556614", epoch: 254, previousCredits: "88204705" },
              { credits: "88926147", epoch: 255, previousCredits: "88556614" },
              { credits: "89293908", epoch: 256, previousCredits: "88926147" },
              { credits: "89643798", epoch: 257, previousCredits: "89293908" },
              { credits: "90019527", epoch: 258, previousCredits: "89643798" },
              { credits: "90405484", epoch: 259, previousCredits: "90019527" },
              { credits: "90779860", epoch: 260, previousCredits: "90405484" },
              { credits: "91169419", epoch: 261, previousCredits: "90779860" },
              { credits: "91566757", epoch: 262, previousCredits: "91169419" },
              { credits: "91931723", epoch: 263, previousCredits: "91566757" },
              { credits: "92312039", epoch: 264, previousCredits: "91931723" },
              { credits: "92675982", epoch: 265, previousCredits: "92312039" },
              { credits: "93003571", epoch: 266, previousCredits: "92675982" },
              { credits: "93348277", epoch: 267, previousCredits: "93003571" },
              { credits: "93719518", epoch: 268, previousCredits: "93348277" },
              { credits: "94087375", epoch: 269, previousCredits: "93719518" },
              { credits: "94426808", epoch: 270, previousCredits: "94087375" },
              { credits: "94664196", epoch: 271, previousCredits: "94426808" },
              { credits: "95046380", epoch: 272, previousCredits: "94664196" },
              { credits: "95425125", epoch: 273, previousCredits: "95046380" },
              { credits: "95808239", epoch: 274, previousCredits: "95425125" },
              { credits: "96179315", epoch: 275, previousCredits: "95808239" },
              { credits: "96560176", epoch: 276, previousCredits: "96179315" },
              { credits: "96927342", epoch: 277, previousCredits: "96560176" },
              { credits: "97293583", epoch: 278, previousCredits: "96927342" },
              { credits: "97663356", epoch: 279, previousCredits: "97293583" },
              { credits: "98027621", epoch: 280, previousCredits: "97663356" },
              { credits: "98381819", epoch: 281, previousCredits: "98027621" },
              { credits: "98728105", epoch: 282, previousCredits: "98381819" },
              { credits: "99072452", epoch: 283, previousCredits: "98728105" },
              { credits: "99420965", epoch: 284, previousCredits: "99072452" },
              { credits: "99765853", epoch: 285, previousCredits: "99420965" },
              { credits: "100119574", epoch: 286, previousCredits: "99765853" },
              {
                credits: "100458879",
                epoch: 287,
                previousCredits: "100119574",
              },
              {
                credits: "100821985",
                epoch: 288,
                previousCredits: "100458879",
              },
              {
                credits: "101173449",
                epoch: 289,
                previousCredits: "100821985",
              },
              {
                credits: "101565565",
                epoch: 290,
                previousCredits: "101173449",
              },
              {
                credits: "101955002",
                epoch: 291,
                previousCredits: "101565565",
              },
              {
                credits: "102354361",
                epoch: 292,
                previousCredits: "101955002",
              },
              {
                credits: "102749975",
                epoch: 293,
                previousCredits: "102354361",
              },
              {
                credits: "103152974",
                epoch: 294,
                previousCredits: "102749975",
              },
              {
                credits: "103521202",
                epoch: 295,
                previousCredits: "103152974",
              },
              {
                credits: "103869853",
                epoch: 296,
                previousCredits: "103521202",
              },
              {
                credits: "104187806",
                epoch: 297,
                previousCredits: "103869853",
              },
              {
                credits: "104459637",
                epoch: 298,
                previousCredits: "104187806",
              },
              {
                credits: "104783236",
                epoch: 299,
                previousCredits: "104459637",
              },
              {
                credits: "105150191",
                epoch: 300,
                previousCredits: "104783236",
              },
              {
                credits: "105504195",
                epoch: 301,
                previousCredits: "105150191",
              },
              {
                credits: "105879868",
                epoch: 302,
                previousCredits: "105504195",
              },
              {
                credits: "106239244",
                epoch: 303,
                previousCredits: "105879868",
              },
              {
                credits: "106308240",
                epoch: 304,
                previousCredits: "106239244",
              },
            ],
            lastTimestamp: { slot: 131414953, timestamp: 1650981109 },
            nodePubkey: "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4",
            priorVoters: [],
            rootSlot: 131414904,
            votes: [
              { confirmationCount: 31, slot: 131414905 },
              { confirmationCount: 30, slot: 131414906 },
              { confirmationCount: 29, slot: 131414907 },
              { confirmationCount: 28, slot: 131414926 },
              { confirmationCount: 27, slot: 131414927 },
              { confirmationCount: 26, slot: 131414928 },
              { confirmationCount: 25, slot: 131414929 },
              { confirmationCount: 24, slot: 131414930 },
              { confirmationCount: 23, slot: 131414931 },
              { confirmationCount: 22, slot: 131414932 },
              { confirmationCount: 21, slot: 131414933 },
              { confirmationCount: 20, slot: 131414934 },
              { confirmationCount: 19, slot: 131414935 },
              { confirmationCount: 18, slot: 131414936 },
              { confirmationCount: 17, slot: 131414937 },
              { confirmationCount: 16, slot: 131414938 },
              { confirmationCount: 15, slot: 131414939 },
              { confirmationCount: 14, slot: 131414940 },
              { confirmationCount: 13, slot: 131414941 },
              { confirmationCount: 12, slot: 131414942 },
              { confirmationCount: 11, slot: 131414943 },
              { confirmationCount: 10, slot: 131414944 },
              { confirmationCount: 9, slot: 131414945 },
              { confirmationCount: 8, slot: 131414946 },
              { confirmationCount: 7, slot: 131414947 },
              { confirmationCount: 6, slot: 131414948 },
              { confirmationCount: 5, slot: 131414949 },
              { confirmationCount: 4, slot: 131414950 },
              { confirmationCount: 3, slot: 131414951 },
              { confirmationCount: 2, slot: 131414952 },
              { confirmationCount: 1, slot: 131414953 },
            ],
          },
          type: "vote",
        },
        program: "vote",
        space: 3731,
      },
      executable: false,
      lamports: 4207299066554,
      owner: new PublicKey(
        Buffer.from(
          "0761481d357474bb7c4d7624ebd3bdb3d8355e73d11043fc0da3538000000000",
          "hex"
        )
      ),
      rentEpoch: 304,
    },
  },
  {
    method: "getFeeForMessage",
    params: [
      "AQAHCYvE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCkK27LLNY6eC4Oopo9T5pT6ilPbrKrCQzbBTnjc6Is6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPvfa23MtQtiianuC7I04dS2mXOSDF52Lml8O1EQGGoOBqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAGodgXpQIFC2gHkebObbiOHltxUPYfxnkKTrTRAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAABqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAAAGp9UXGTWE0P7tm7NDHRMga+VEKBtXuFZsxTdf9AAAAMSjkK4MloYlzRPcf1wdkx+b53CpRgBUwgdyk+nPz78QAwICAAFcAwAAAIvE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCAAAAAAAAAAAAAAAAAAAAAMgAAAAAAAAABqHYF5E3VCqYNDe9/ip6slV/U1yKeHIraKSdwAAAAAAEAgEHdAAAAACLxNPlB8BVDj0C/7X22vB3IkCvignjLSNmFbSiJyQ3AovE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAYBAwYIBQAEAgAAAA==",
    ],
    answer: 5000,
  },
  {
    method: "getAccountInfo",
    params: ["AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh"],
    answer: {
      data: { type: "Buffer", data: [] },
      executable: false,
      lamports: 83389840,
      owner: new PublicKey(Buffer.from("00", "hex")),
      rentEpoch: 303,
    },
  },
  {
    method: "getFeeForMessage",
    params: [
      "AQAFB4vE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcC+99rbcy1C2KJqe4LsjTh1LaZc5IMXnYuaXw7URAYag6Qrbsss1jp4Lg6imj1PmlPqKU9usqsJDNsFOeNzoizoAah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqHYF6UCBQtoB5Hmzm24jh5bcVD2H8Z5Ck600QAAAAAGp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAAan1RcZNYTQ/u2bs0MdEyBr5UQoG1e4VmzFN1/0AAAAxKOQrgyWhiXNE9x/XB2TH5vncKlGAFTCB3KT6c/PvxABAwYBAgUGBAAEAgAAAA==",
    ],
    answer: 5000,
  },
  {
    method: "getFeeForMessage",
    params: [
      "AQACBIvE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcC+99rbcy1C2KJqe4LsjTh1LaZc5IMXnYuaXw7URAYag4GodgXkTdUKpg0N73+KnqyVX9TXIp4citopJ3AAAAAAAan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAAxKOQrgyWhiXNE9x/XB2TH5vncKlGAFTCB3KT6c/PvxABAgMBAwAEBQAAAA==",
    ],
    answer: 5000,
  },
  {
    method: "getFeeForMessage",
    params: [
      "AQADBovE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCkK27LLNY6eC4Oopo9T5pT6ilPbrKrCQzbBTnjc6Is6D732ttzLULYomp7guyNOHUtplzkgxedi5pfDtREBhqDgah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAAGp9UXGTWE0P7tm7NDHRMga+VEKBtXuFZsxTdf9AAAAMSjkK4MloYlzRPcf1wdkx+b53CpRgBUwgdyk+nPz78QAQMFAgEEBQAMBAAAAAAAAAAAAAAA",
    ],
    answer: 5000,
  },
  {
    method: "getFeeForMessage",
    params: [
      "AQADBovE0+UHwFUOPQL/tfba8HciQK+KCeMtI2YVtKInJDcCkK27LLNY6eC4Oopo9T5pT6ilPbrKrCQzbBTnjc6Is6D732ttzLULYomp7guyNOHUtplzkgxedi5pfDtREBhqDgah2BeRN1QqmDQ3vf4qerJVf1NcinhyK2ikncAAAAAABqfVFxjHdMkoVmOYaR1etoteuKObS21cc1VbIQAAAAAGp9UXGTWE0P7tm7NDHRMga+VEKBtXuFZsxTdf9AAAAMSjkK4MloYlzRPcf1wdkx+b53CpRgBUwgdyk+nPz78QAQMFAgEEBQAMBAAAAAAAAAAAAAAA",
    ],
    answer: 5000,
  },
  // manual
  { method: "getLatestBlockhash", params: [], answer: LATEST_BLOCKHASH_MOCK },
];
