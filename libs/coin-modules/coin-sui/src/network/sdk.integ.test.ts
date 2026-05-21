import { getEnv } from "@ledgerhq/live-env";
import type { Operation } from "@ledgerhq/types-live";
import { getJsonRpcFullnodeUrl, type SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { FIGMENT_SUI_VALIDATOR_ADDRESS } from "../constants";
import { normalizeSuiAddressForComparison } from "../utils";
import {
  transactionToCoinFrameworkOperation,
  createTransaction,
  DEFAULT_COIN_TYPE,
  getAccountBalances,
  getListOperations,
  getOperations,
  getOperationAmount,
  getOperationFee,
  getUnifiedBalanceChanges,
  isSettlementTransaction,
  paymentInfo,
  getBlock,
  getBlockInfo,
  getStakes,
  transactionToOperation,
  withApi,
} from "./sdk";

describe("SUI SDK Integration tests", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: getEnv("API_SUI_NODE_PROXY"),
        graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
      },
      features: { graphql: false },
    }));
  });

  describe("getOperations", () => {
    describe("Account 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164", () => {
      // https://suiscan.xyz/mainnet/account/0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164/activity
      const IN_OPERATIONS_COUNT = 2;
      const OUT_OPERATIONS_COUNT = 3;
      const TOTAL_OPERATIONS_COUNT = IN_OPERATIONS_COUNT + OUT_OPERATIONS_COUNT;

      let operations: Operation[];

      const testingAccount = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

      beforeAll(async () => {
        operations = await getOperations("mockAccoundId", testingAccount);
      });

      describe("List", () => {
        it("should fetch operations successfully", async () => {
          expect(operations).toBeInstanceOf(Array);
        });

        it("should fetch all operations", async () => {
          expect(operations.length).toBeGreaterThanOrEqual(TOTAL_OPERATIONS_COUNT);
        });

        it("should return the first operation at index 0 and the last at the end", async () => {
          const oldestTxHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
          const newestTxHash = "2GjCnxe8wRqzG4Nr1pad6QAZzCxP8qJY4ioAaVaHvhF7";
          expect(operations[operations.length - TOTAL_OPERATIONS_COUNT].hash).toEqual(newestTxHash);
          expect(operations[operations.length - 1].hash).toEqual(oldestTxHash);
        });
      });

      describe("Transaction types", () => {
        it("should return correct IN/OUT operations numbers", async () => {
          const inOps = operations.filter(op => op.type === "IN");
          const outOps = operations.filter(op => op.type === "OUT");
          expect(inOps.length).toBeGreaterThanOrEqual(IN_OPERATIONS_COUNT);
          expect(outOps.length).toBeGreaterThanOrEqual(OUT_OPERATIONS_COUNT);
        });

        describe("SUI operations", () => {
          it("should return SUI IN operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg
            // Send 0.15 SUI to 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "IN",
              value: BigNumber("150000000"),
              senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              recipients: [testingAccount],
              extra: { coinType: "0x2::sui::SUI" },
            });
          });
          it("should return SUI OUT operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/CnVCqFLDv9iJc3DPU2WGpJdZUjqFPhyEVJ5BAigEj9VW
            // Get 0.052 SUI from 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "CnVCqFLDv9iJc3DPU2WGpJdZUjqFPhyEVJ5BAigEj9VW";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "OUT",
              value: BigNumber("51747880"),
              recipients: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              senders: [testingAccount],
              extra: { coinType: "0x2::sui::SUI" },
            });
          });

          it("live RPC: balance change amounts are strings; unprefixed address needs normalized match for getOperationAmount", async () => {
            const txHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
            const tx = await withApi(async api =>
              api.getTransactionBlock({
                digest: txHash,
                options: {
                  showBalanceChanges: true,
                  showInput: true,
                  showEffects: true,
                },
              }),
            );

            const changes = tx.balanceChanges ?? [];
            expect(changes.length).toBeGreaterThan(0);

            const unprefixed = testingAccount.replace(/^0x/i, "");
            expect(
              changes.some(
                c =>
                  typeof c.owner !== "string" &&
                  "AddressOwner" in c.owner &&
                  c.owner.AddressOwner === unprefixed,
              ),
            ).toBe(false);

            const normalizedTarget = normalizeSuiAddressForComparison(unprefixed);
            const accountRows = changes.filter(
              c =>
                typeof c.owner !== "string" &&
                "AddressOwner" in c.owner &&
                normalizeSuiAddressForComparison(c.owner.AddressOwner) === normalizedTarget &&
                c.coinType === DEFAULT_COIN_TYPE,
            );
            expect(accountRows.length).toBeGreaterThanOrEqual(1);
            for (const row of accountRows) {
              expect(typeof row.amount).toBe("string");
            }

            expect(getOperationAmount(unprefixed, tx, DEFAULT_COIN_TYPE).toString()).toBe(
              "150000000",
            );
          });
        });

        describe("SUI tokens operations", () => {
          it("should return SUI tokens IN operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/B7x8pACzpoFSQ5rmA5T3Q91Q48CroFuerXf62KLaY5TY
            // Send 0.59 USDT to 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "B7x8pACzpoFSQ5rmA5T3Q91Q48CroFuerXf62KLaY5TY";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "IN",
              value: BigNumber("592557"),
              senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              recipients: [testingAccount],
              extra: {
                coinType:
                  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
              },
            });
          });
          it("should return SUI tokens OUT operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/2GjCnxe8wRqzG4Nr1pad6QAZzCxP8qJY4ioAaVaHvhF7
            // Get 0.59 USDT from 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "2GjCnxe8wRqzG4Nr1pad6QAZzCxP8qJY4ioAaVaHvhF7";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "OUT",
              value: BigNumber("592557"),
              recipients: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              senders: [testingAccount],
              extra: {
                coinType:
                  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
              },
            });
          });
        });
      });
    });
  });

  describe("Settlement transaction filtering (SIP-58)", () => {
    const testingAccount = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

    it("getOperations returns no settlement transactions", async () => {
      const ops = await getOperations("test-account", testingAccount);
      expect(ops.length).toBeGreaterThan(0);

      const opsToCheck = ops.slice(0, 10);
      await Promise.all(
        opsToCheck.map(async op => {
          const raw = await withApi(async (api: SuiJsonRpcClient) =>
            api.getTransactionBlock({ digest: op.hash, options: { showInput: true } }),
          );
          expect(isSettlementTransaction(raw)).toBe(false);
        }),
      );
    });

    it("getListOperations returns no settlement transactions", async () => {
      const page = await getListOperations(testingAccount, "desc");
      expect(page.items.length).toBeGreaterThan(0);

      const itemsToCheck = page.items.slice(0, 10);
      await Promise.all(
        itemsToCheck.map(async op => {
          const raw = await withApi(async (api: SuiJsonRpcClient) =>
            api.getTransactionBlock({ digest: op.tx.hash, options: { showInput: true } }),
          );
          expect(isSettlementTransaction(raw)).toBe(false);
        }),
      );
    });
  });

  describe("getBalance", () => {
    test("getAccountBalances should return account balance with SIP-58 fields", async () => {
      const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      const balances = await getAccountBalances(address);
      expect(balances.length).toBeGreaterThan(0);
      expect(balances[0]).toHaveProperty("blockHeight");
      expect(balances[0]).toHaveProperty("balance");
      expect(balances[0]).toHaveProperty("fundsInAddressBalance");
      expect(balances[0].fundsInAddressBalance.isFinite()).toBe(true);
    });

    test("fundsInAddressBalance is valid for all coin types", async () => {
      const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      const balances = await getAccountBalances(address);

      for (const b of balances) {
        expect(b.balance.isFinite()).toBe(true);
        expect(b.fundsInAddressBalance.isFinite()).toBe(true);
        expect(b.fundsInAddressBalance.isGreaterThanOrEqualTo(0)).toBe(true);
        expect(b.fundsInAddressBalance.isLessThanOrEqualTo(b.balance)).toBe(true);
      }
    });
  });

  describe("createTransaction", () => {
    test("createTransaction should build a transaction", async () => {
      const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
      const transaction = {
        mode: "send" as const,
        family: "sui" as const,
        coinType: DEFAULT_COIN_TYPE,
        amount: new BigNumber(100),
        recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
        errors: {},
      };
      const { unsigned: tx } = await createTransaction(address, transaction);
      expect(tx).toBeInstanceOf(Uint8Array);
    });

    test("createTransaction returns BCS objects when withObjects=true", async () => {
      const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      const result = await createTransaction(
        address,
        {
          mode: "send",
          coinType: DEFAULT_COIN_TYPE,
          amount: new BigNumber(100),
          recipient: address,
        },
        true,
      );

      expect(result.unsigned).toBeInstanceOf(Uint8Array);
      expect(result.objects).not.toBeUndefined();
      expect(result.objects!.length).toBeGreaterThan(0);
      for (const obj of result.objects!) {
        expect(obj).toBeInstanceOf(Uint8Array);
      }
    });

    test("createTransaction omits objects when withObjects=false", async () => {
      const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      const result = await createTransaction(address, {
        mode: "send",
        coinType: DEFAULT_COIN_TYPE,
        amount: new BigNumber(100),
        recipient: address,
      });

      expect(result.unsigned).toBeInstanceOf(Uint8Array);
      expect(result.objects).toBeUndefined();
    });

    test("createTransaction builds a delegate transaction", async () => {
      const validatorAddress = "0xcb7530490045f19514eed2f7efa4bca56854e54470fa23e8c91c46eb8a78d72f";

      const result = await createTransaction(
        FIGMENT_SUI_VALIDATOR_ADDRESS,
        {
          mode: "delegate",
          coinType: DEFAULT_COIN_TYPE,
          amount: new BigNumber(1_000_000_000),
          recipient: validatorAddress,
        },
        true,
      );

      expect(result.unsigned).toBeInstanceOf(Uint8Array);
      expect(result.unsigned.length).toBeGreaterThan(0);
    });
  });

  describe("paymentInfo", () => {
    test("paymentInfo should return gas budget and fees", async () => {
      const sender = "0xad79719ac7edb44f6e253f1f771e8291e281a6aaf1e4789b52bf85336f525e8e";
      const fakeTransaction = {
        mode: "send" as const,
        family: "sui" as const,
        coinType: DEFAULT_COIN_TYPE,
        amount: new BigNumber(100),
        recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
        errors: {},
      };
      const info = await paymentInfo(sender, fakeTransaction);
      expect(info).toHaveProperty("gasBudget");
      expect(info).toHaveProperty("totalGasUsed");
      expect(info).toHaveProperty("fees");
      expect(BigInt(info.gasBudget)).toBeGreaterThan(0n);
      expect(info.totalGasUsed).toBeGreaterThan(0n);
      expect(info.fees).toBeGreaterThan(0n);
    });

    test("paymentInfo returns valid gas budget for delegate", async () => {
      const validatorAddress = "0xcb7530490045f19514eed2f7efa4bca56854e54470fa23e8c91c46eb8a78d72f";

      const info = await paymentInfo(FIGMENT_SUI_VALIDATOR_ADDRESS, {
        mode: "delegate" as const,
        family: "sui" as const,
        coinType: DEFAULT_COIN_TYPE,
        amount: new BigNumber(1_000_000_000),
        recipient: validatorAddress,
        errors: {},
      });

      expect(BigInt(info.gasBudget)).toBeGreaterThan(0n);
      expect(info.fees).toBeGreaterThan(0n);
    });
  });

  describe("getCheckpoint", () => {
    test("getCheckpoint", async () => {
      // This test asserts on the wider JSON-RPC `Checkpoint` shape
      // (epoch, previousDigest, transactions) — fields the public
      // `getCheckpoint` export intentionally drops to keep the dual-path
      // contract honest. Talk to the JSON-RPC client directly here.
      const checkpointById = await withApi(api =>
        api.getCheckpoint({ id: "3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS" }),
      );
      const checkpointBySequenceNumber = await withApi(api =>
        api.getCheckpoint({ id: "164167623" }),
      );
      expect(checkpointById.epoch).toEqual("814");
      expect(checkpointById.sequenceNumber).toEqual("164167623");
      expect(checkpointById.timestampMs).toEqual("1751696298663");
      expect(checkpointById.digest).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(checkpointById.previousDigest).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
      expect(checkpointById.transactions.length).toEqual(19);
      expect(checkpointById.digest).toEqual(checkpointBySequenceNumber.digest);
    });
  });

  describe("getBlockInfo", () => {
    test("getBlockInfo should get block info by id or sequence number", async () => {
      const blockById = await getBlockInfo("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      const blockBySequenceNumber = await getBlockInfo("164167623");
      expect(blockById.height).toEqual(164167623);
      expect(blockById.hash).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(blockById.time).toEqual(new Date(1751696298663));
      expect(blockById.parent?.height).toEqual(164167622);
      expect(blockById.parent?.hash).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
      expect(blockById).toEqual(blockBySequenceNumber);
    });
  });

  describe("getBlock", () => {
    test("getBlock should get block by id or sequence number", async () => {
      const blockById = await getBlock("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      const blockBySequenceNumber = await getBlock("164167623");
      expect(blockById.info.height).toEqual(164167623);
      expect(blockById.info.hash).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(blockById.info.time).toEqual(new Date(1751696298663));
      expect(blockById.info.parent?.height).toEqual(164167622);
      expect(blockById.info.parent?.hash).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
      expect(blockById.transactions.length).toEqual(19);
      expect(blockById).toEqual(blockBySequenceNumber);
    });
  });

  describe("getStakes", () => {
    test("Account 0x4d701858924b5aebce9e82e9aeca92266acfd5610896bfc1b042e7f87ba23c73", async () => {
      const stakes = await getStakes(
        "0x4d701858924b5aebce9e82e9aeca92266acfd5610896bfc1b042e7f87ba23c73",
      );
      expect(stakes.length).toBeGreaterThan(0);
      stakes.forEach(stake => {
        expect(stake.uid).toMatch(/0x[0-9a-z]+/);
        expect(stake.address).toMatch(/0x[0-9a-z]+/);
        expect(stake.delegate).toMatch(/0x[0-9a-z]+/);
        expect(stake.state).toMatch(/(activating|active|inactive)/);
        expect(stake.asset).toEqual({ type: "native" });
        expect(stake.amount).toBeGreaterThan(0);
        expect(stake.amountDeposited).toBeGreaterThan(0);
        expect(stake.amountRewarded).toBeGreaterThanOrEqual(0);
        // @ts-expect-error properties are defined
        expect(stake.amount).toEqual(stake.amountDeposited + stake.amountRewarded);
        expect(stake.details).toMatchObject({
          activeEpoch: expect.any(Number),
          requestEpoch: expect.any(Number),
        });
      });
    });
  });

  describe("getListOperations (SIP-58 / coin-framework path)", () => {
    const account = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

    let descPage: Awaited<ReturnType<typeof getListOperations>>;
    let ascPage: Awaited<ReturnType<typeof getListOperations>>;

    beforeAll(async () => {
      [descPage, ascPage] = await Promise.all([
        getListOperations(account, "desc"),
        getListOperations(account, "asc"),
      ]);
    });

    it("returns operations in desc order", () => {
      expect(descPage.items.length).toBeGreaterThan(0);

      for (let i = 1; i < descPage.items.length; i++) {
        expect(descPage.items[i - 1].tx.date.getTime()).toBeGreaterThanOrEqual(
          descPage.items[i].tx.date.getTime(),
        );
      }
    });

    it("returns operations in asc order", () => {
      expect(ascPage.items.length).toBeGreaterThan(0);

      for (let i = 1; i < ascPage.items.length; i++) {
        expect(ascPage.items[i - 1].tx.date.getTime()).toBeLessThanOrEqual(
          ascPage.items[i].tx.date.getTime(),
        );
      }
    });

    it("contains no settlement transactions", async () => {
      expect(descPage.items.length).toBeGreaterThan(0);

      const itemsToCheck = descPage.items.slice(0, 10);
      await Promise.all(
        itemsToCheck.map(async op => {
          const raw = await withApi(async (api: SuiJsonRpcClient) =>
            api.getTransactionBlock({ digest: op.tx.hash, options: { showInput: true } }),
          );
          expect(isSettlementTransaction(raw)).toBe(false);
        }),
      );
    });

    it("each operation has valid fields", () => {
      for (const op of descPage.items) {
        expect(op.id).not.toBe("");
        expect(op.tx.hash).not.toBe("");
        expect(op.tx.date).toBeInstanceOf(Date);
        expect(op.tx.block.height).toBeGreaterThan(0);
        expect(op.senders.length).toBeGreaterThan(0);
        expect(typeof op.type).toBe("string");
        expect(op.value).toBeGreaterThanOrEqual(0n);
      }
    });

    it("includes both IN and OUT operations", () => {
      const types = new Set(descPage.items.map(op => op.type));
      expect(types.has("IN")).toBe(true);
      expect(types.has("OUT")).toBe(true);
    });

    it("operations have correct senders/recipients relative to account", () => {
      for (const op of descPage.items) {
        if (op.type === "IN") {
          expect(op.recipients).toContain(account);
        } else if (op.type === "OUT") {
          expect(op.senders).toContain(account);
        }
      }
    });
  });

  // Regression guard for BACK-10134: STAKING_REQUEST_EVENT had the wrong
  // module name (staking_pool instead of validator), causing validatorAddress
  // and stakedObjectId to be silently dropped from DELEGATE operation details.
  // UNSTAKING_REQUEST_EVENT was already correct. These tests fetch real
  // on-chain transactions with showEvents:true and assert the detail fields
  // survive the full pipeline, catching any future constant drift that unit
  // tests cannot.
  describe("staking operation details (BACK-10134 regression)", () => {
    // https://suiscan.xyz/mainnet/account/0x13d73cab19d2cf14e39289b122ed93fb0f9edd00e4c829e0cefb1f0611c54a8f
    const STAKING_ADDRESS = "0x13d73cab19d2cf14e39289b122ed93fb0f9edd00e4c829e0cefb1f0611c54a8f";
    // https://suiscan.xyz/mainnet/tx/4UtCqCH3oNEdaprZR9UjaMGg6HgLn3V3q3FEcvs5vieM
    const UNDELEGATE_TX_DIGEST = "4UtCqCH3oNEdaprZR9UjaMGg6HgLn3V3q3FEcvs5vieM";
    // https://suiscan.xyz/mainnet/tx/EkJbwk9R2pmJhxfAVpRqbfDYQN1yiNap1qMPVrKedwZf
    const DELEGATE_TX_DIGEST = "EkJbwk9R2pmJhxfAVpRqbfDYQN1yiNap1qMPVrKedwZf";

    it("UNDELEGATE: validatorAddress, rewardAmount and withdrawnAmount are populated from live events", async () => {
      const raw = await withApi(api =>
        api.getTransactionBlock({
          digest: UNDELEGATE_TX_DIGEST,
          options: { showInput: true, showBalanceChanges: true, showEffects: true, showEvents: true },
        }),
      );
      const op = transactionToCoinFrameworkOperation(STAKING_ADDRESS, raw, undefined);
      expect(op.type).toBe("UNDELEGATE");
      expect(op.details).toMatchObject({
        validatorAddress: expect.stringMatching(/^0x[0-9a-f]+$/i),
      });
      expect(typeof op.details!.rewardAmount).toBe("bigint");
      expect(typeof op.details!.withdrawnAmount).toBe("bigint");
    });

    it("DELEGATE: validatorAddress is populated from live events", async () => {
      const raw = await withApi(api =>
        api.getTransactionBlock({
          digest: DELEGATE_TX_DIGEST,
          options: { showInput: true, showBalanceChanges: true, showEffects: true, showEvents: true },
        }),
      );
      const op = transactionToCoinFrameworkOperation(STAKING_ADDRESS, raw, undefined);
      expect(op.type).toBe("DELEGATE");
      // validatorAddress is the field that was silently dropped by the bug.
      // stakedObjectId is not asserted as it is absent from real on-chain events.
      expect(op.details).toMatchObject({
        validatorAddress: expect.stringMatching(/^0x[0-9a-f]+$/i),
      });
    });
  });

  // Pin both transfer flows to immutable on-chain testnet transactions and
  // verify the SDK maps each correctly. Asserts flow-specific on-chain shape
  // (gasData.payment, accumulatorEvents) AND the resulting Operation values,
  // so both code paths in sdk.ts are exercised end-to-end against live RPC.
  //
  // Legacy flow pins to mainnet (long retention); SIP-58 stays on testnet
  // since the accumulator-event shape is testnet-only at the moment. Each
  // inner block sets its own RPC URL; afterAll restores the suite default.
  describe("Transfer flow comparison: legacy coin vs SIP-58 address balance", () => {
    afterAll(() => {
      coinConfig.setCoinConfig(() => ({
        status: { type: "active" },
        node: {
          url: getEnv("API_SUI_NODE_PROXY"),
          graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
        },
        features: { graphql: false },
      }));
    });

    describe("legacy flow (coin-object-funded)", () => {
      // https://suiscan.xyz/mainnet/tx/rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg
      // Plain SUI transfer of 0.15 SUI; gas paid from a real coin object.
      const SENDER = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
      const RECIPIENT = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      const TX_DIGEST = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
      const TRANSFER_AMOUNT = "150000000";
      const FEE_AMOUNT = "1747880"; // 750_000 + 1_976_000 - 978_120
      const SENDER_TOTAL_OUT = "151747880";

      beforeAll(() => {
        coinConfig.setCoinConfig(() => ({
          status: { type: "active" },
          node: {
            url: getJsonRpcFullnodeUrl("mainnet"),
            graphqlUrl: "https://graphql.mainnet.sui.io/graphql",
          },
          features: { graphql: false },
        }));
      });

      const fetchTx = () =>
        withApi(api =>
          api.getTransactionBlock({
            digest: TX_DIGEST,
            options: { showInput: true, showBalanceChanges: true, showEffects: true },
          }),
        );

      test("on-chain shape: gasData.payment is a real coin object", async () => {
        const raw = await fetchTx();
        const payment = raw.transaction?.data?.gasData?.payment ?? [];
        expect(payment.length).toBeGreaterThan(0);
        expect(payment[0]).toMatchObject({
          objectId: expect.stringMatching(/^0x[0-9a-f]+$/),
        });
      });

      test("on-chain shape: no accumulator events", async () => {
        const raw = await fetchTx();
        expect(raw.effects?.accumulatorEvents ?? []).toEqual([]);
      });

      test("isSettlementTransaction returns false", async () => {
        const raw = await fetchTx();
        expect(isSettlementTransaction(raw)).toBe(false);
      });

      test("getUnifiedBalanceChanges yields 2 entries with bare 0x2::sui::SUI coinType", async () => {
        const raw = await fetchTx();
        const merged = getUnifiedBalanceChanges(raw);
        expect(merged.length).toBe(2);
        for (const c of merged) {
          expect(c.coinType).toBe(DEFAULT_COIN_TYPE);
        }
      });

      test("getOperationFee equals computationCost + storageCost - storageRebate", async () => {
        const raw = await fetchTx();
        expect(getOperationFee(raw).toString()).toBe(FEE_AMOUNT);
      });

      test("transactionToOperation maps OUT side for sender (transfer + fee)", async () => {
        const raw = await fetchTx();
        const op = transactionToOperation("acc-sender", SENDER, raw);
        expect(op).toMatchObject({
          type: "OUT",
          hasFailed: false,
          hash: TX_DIGEST,
          senders: [SENDER],
          recipients: [RECIPIENT],
          extra: { coinType: DEFAULT_COIN_TYPE },
        });
        expect(op.value.toString()).toBe(SENDER_TOTAL_OUT);
        expect(op.fee.toString()).toBe(FEE_AMOUNT);
      });

      test("transactionToOperation maps IN side for recipient (transfer only)", async () => {
        const raw = await fetchTx();
        const op = transactionToOperation("acc-recipient", RECIPIENT, raw);
        expect(op).toMatchObject({
          type: "IN",
          hasFailed: false,
          hash: TX_DIGEST,
          senders: [SENDER],
          recipients: [RECIPIENT],
          extra: { coinType: DEFAULT_COIN_TYPE },
        });
        expect(op.value.toString()).toBe(TRANSFER_AMOUNT);
      });
    });

    describe("SIP-58 flow (address-balance-funded)", () => {
      // https://suiscan.xyz/testnet/tx/6DaVcYeArKBv6eez7SKwHT1gFG7wxvFE8oYw9ri6pCDX
      // Transfer of 0.01 SUI broadcast via coin-sui's own pipeline. Both gas
      // and transfer amount sourced from the SIP-58 address balance.
      const SENDER = "0xb11999dc44f51bd380ac285a3e85196f7156900c469023235a84900544db1edb";
      const RECIPIENT = "0x48e76327eeb7232abc5e9cb870334a2abe8a2e00140eba2b59b2b4af735ec732";
      const TX_DIGEST = "6DaVcYeArKBv6eez7SKwHT1gFG7wxvFE8oYw9ri6pCDX";
      const TRANSFER_AMOUNT = "10000000";
      const FEE_AMOUNT = "1988000"; // 1_000_000 + 988_000 - 0
      const SENDER_TOTAL_OUT = "11988000";

      beforeAll(() => {
        coinConfig.setCoinConfig(() => ({
          status: { type: "active" },
          node: {
            url: getJsonRpcFullnodeUrl("testnet"),
            graphqlUrl: "https://graphql.testnet.sui.io/graphql",
          },
          features: { graphql: false },
        }));
      });

      const fetchTx = () =>
        withApi(api =>
          api.getTransactionBlock({
            digest: TX_DIGEST,
            options: { showInput: true, showBalanceChanges: true, showEffects: true },
          }),
        );

      test("on-chain shape: gasData.payment is empty (gas from address balance)", async () => {
        const raw = await fetchTx();
        expect(raw.transaction?.data?.gasData?.payment).toEqual([]);
      });

      test("on-chain shape: accumulator split event for sender of Balance<SUI>", async () => {
        const raw = await fetchTx();
        const events = raw.effects?.accumulatorEvents ?? [];
        expect(events.length).toBeGreaterThan(0);
        const split = events.find(e => e.address === SENDER && e.operation === "split");
        expect(split).not.toBeUndefined();
        expect(split!.ty).toBe("0x2::balance::Balance<0x2::sui::SUI>");
        if ("integer" in split!.value) {
          expect(String(split!.value.integer)).toBe(SENDER_TOTAL_OUT);
        } else {
          throw new Error("expected integer value on accumulator event");
        }
      });

      test("isSettlementTransaction returns false (no 0xacc input)", async () => {
        const raw = await fetchTx();
        expect(isSettlementTransaction(raw)).toBe(false);
      });

      test("getUnifiedBalanceChanges yields 2 entries with bare 0x2::sui::SUI coinType (no Balance<> wrapper leak)", async () => {
        const raw = await fetchTx();
        const merged = getUnifiedBalanceChanges(raw);
        expect(merged.length).toBe(2);
        for (const c of merged) {
          // The accumulator event uses `0x2::balance::Balance<0x2::sui::SUI>`,
          // which sdk.ts must strip to `0x2::sui::SUI` before merging.
          expect(c.coinType).toBe(DEFAULT_COIN_TYPE);
        }
      });

      test("getOperationFee equals computationCost + storageCost - storageRebate", async () => {
        const raw = await fetchTx();
        expect(getOperationFee(raw).toString()).toBe(FEE_AMOUNT);
      });

      test("transactionToOperation maps OUT side for sender (transfer + fee)", async () => {
        const raw = await fetchTx();
        const op = transactionToOperation("acc-sender", SENDER, raw);
        expect(op).toMatchObject({
          type: "OUT",
          hasFailed: false,
          hash: TX_DIGEST,
          senders: [SENDER],
          recipients: [RECIPIENT],
          extra: { coinType: DEFAULT_COIN_TYPE },
        });
        expect(op.value.toString()).toBe(SENDER_TOTAL_OUT);
        expect(op.fee.toString()).toBe(FEE_AMOUNT);
      });

      test("transactionToOperation maps IN side for recipient (transfer only)", async () => {
        const raw = await fetchTx();
        const op = transactionToOperation("acc-recipient", RECIPIENT, raw);
        expect(op).toMatchObject({
          type: "IN",
          hasFailed: false,
          hash: TX_DIGEST,
          senders: [SENDER],
          recipients: [RECIPIENT],
          extra: { coinType: DEFAULT_COIN_TYPE },
        });
        expect(op.value.toString()).toBe(TRANSFER_AMOUNT);
      });

      test("getAccountBalances reports a non-zero fundsInAddressBalance for the sender", async () => {
        const balances = await getAccountBalances(SENDER);
        const sui = balances.find(b => b.coinType === DEFAULT_COIN_TYPE);
        expect(sui).not.toBeUndefined();
        expect(sui!.fundsInAddressBalance.isGreaterThan(0)).toBe(true);
        expect(sui!.fundsInAddressBalance.isLessThanOrEqualTo(sui!.balance)).toBe(true);
      });
    });
  });
});
