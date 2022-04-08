/* eslint-disable */
import { PublicKey } from "@solana/web3.js";

export const getMockedMethods = () => [
  // generated
  {
    method: "getBalanceAndContext",
    params: ["AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh"],
    answer: { context: { slot: 109865128 }, value: 83389840 },
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
    method: "getParsedConfirmedTransactions",
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
    answer: { context: { slot: 109865129 }, value: 0 },
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
    method: "getParsedConfirmedTransactions",
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
    method: "getRecentBlockhash",
    params: [],
    answer: {
      blockhash: "CfCUxX9U6hibcKxHV9Sy1CyG3Z2uTTitxAbina1ZXygF",
      feeCalculator: { lamportsPerSignature: 5000 },
    },
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

  // manual
  {
    method: "getTxFeeCalculator",
    params: [],
    answer: { lamportsPerSignature: 5000 },
  },
];
