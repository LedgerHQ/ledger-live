import type { GrpcTypes } from "@mysten/sui/grpc";
import { getOperationRecipients, getUnifiedBalanceChanges } from "../sdk";
import { grpcTxToSuiTransaction } from "./transactions";
import fixtures from "./transactions.fixtures.json";

/**
 * `ExecutedTransaction` payloads captured verbatim from mainnet gRPC-web (checkpoint 309107352).
 * JSON cannot carry protobuf's `bigint` and `Uint8Array`, so the capture tagged them and this
 * revives them — the mapper reads both (`timestamp.seconds`, `checkpoint`, `Pure.bytes`), and a
 * plain `JSON.parse` would silently hand it strings and produce different output than the wire.
 */
const revive = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.__bigint === "string") return BigInt(o.__bigint);
    if (typeof o.__bytes === "string") return Uint8Array.from(Buffer.from(o.__bytes, "base64"));
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, revive(v)]));
  }
  return value;
};

const programmable = revive(fixtures.programmable) as GrpcTypes.ExecutedTransaction;
const system = revive(fixtures.system) as GrpcTypes.ExecutedTransaction;
const transfer = revive(fixtures.transfer) as GrpcTypes.ExecutedTransaction;

describe("grpcTxToSuiTransaction", () => {
  describe("a programmable transaction", () => {
    const mapped = grpcTxToSuiTransaction(programmable);

    it("preserves the digest and marks the kind programmable", () => {
      expect(mapped.digest).toBe("GYcdZWiSrpcgcY8k4ZyJSycW1ew9yqMfQt4bazHJcLjr");
      expect(mapped.transaction?.data.transaction.kind).toBe("ProgrammableTransaction");
    });

    it("reports a successful status and non-zero gas", () => {
      expect(mapped.effects?.status.status).toBe("success");
      expect(Number(mapped.effects?.gasUsed.computationCost)).toBeGreaterThan(0);
    });

    // The sender funds the gas, so `getFeesPayer` must find an owner on gasData.
    it("carries gasData with an owner", () => {
      expect(mapped.transaction?.data.gasData?.owner).toMatch(/^0x[0-9a-f]{64}$/);
      expect(mapped.transaction?.data.sender).toMatch(/^0x[0-9a-f]{64}$/);
    });

    // checkpoint and timestamp are read from the raw proto, not from Core, and both feed the
    // operation's block height and date.
    it("projects checkpoint and timestamp as decimal strings", () => {
      expect(mapped.checkpoint).toBe("309107352");
      expect(mapped.timestampMs).toBe("1786377212153");
    });

    it("shortens balance-change coin types and keeps the signed amount", () => {
      expect(mapped.balanceChanges).toEqual([
        {
          address: "0x0feb54a725aa357ff2f5bc6bb023c05b310285bd861275a30521f339a434ebb3",
          coinType: "0x2::sui::SUI",
          amount: "-32784",
        },
      ]);
    });

    // This fixture is a DeepBook order-cancel: no `TransferObjects`, and its only pure input is 17
    // bytes wide, so it yields no recipients at all. Asserting emptiness keeps that explicit — the
    // `transfer` fixture below is the one that exercises the recipient path.
    it("yields no recipients for a transaction that transfers nothing", () => {
      expect(getOperationRecipients(mapped.transaction?.data)).toEqual([]);
    });

    // With no accumulator write in effects, the unified view must be exactly the wire balance
    // changes — no synthesised entries.
    it("passes wire balance changes through when there is no accumulator write", () => {
      expect(mapped.effects?.accumulatorEvents).toEqual([]);
      expect(getUnifiedBalanceChanges(mapped)).toEqual(mapped.balanceChanges);
    });

    it("maps events to a shortened type and their parsed JSON", () => {
      const [event] = mapped.events;
      expect(Object.keys(event).sort()).toEqual(["parsedJson", "type"]);
      expect(event.type).not.toContain("0x0000000000000000");
    });
  });

  // Every checkpoint opens with a system transaction. `parseGrpcTransactionResponse` throws
  // "Only programmable transactions are supported" if a body is requested for one, so the mapper
  // must classify the kind from the raw proto before decoding.
  describe("a system transaction", () => {
    const mapped = grpcTxToSuiTransaction(system);

    it("keeps the kind name and omits the programmable body", () => {
      expect(mapped.transaction.data.transaction).toEqual({
        kind: "System",
        name: "ConsensusCommitPrologue",
      });
    });

    it("still yields a digest and a status", () => {
      expect(mapped.digest).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,64}$/);
      expect(mapped.effects?.status.status).toBe("success");
    });

    it("produces no recipients", () => {
      expect(getOperationRecipients(mapped.transaction?.data)).toEqual([]);
    });
  });

  // A real mainnet transfer (splitCoins + two transferObjects, with 32-byte address inputs). The
  // DeepBook fixture above cannot reach the recipient path at all, so without this the money path
  // from proto through `getOperationRecipients` would have no hermetic coverage.
  describe("a transfer transaction", () => {
    const mapped = grpcTxToSuiTransaction(transfer);

    it("extracts the transfer recipients as addresses", () => {
      const recipients = getOperationRecipients(mapped.transaction?.data);

      expect(recipients.length).toBeGreaterThan(0);
      // Never a decoded u64: an 8-byte pure input must not be mistaken for an address.
      for (const recipient of recipients) {
        expect(recipient).toMatch(/^0x[0-9a-f]{64}$/);
      }
    });

    it("keeps the kind name of the non-MoveCall commands and keeps its balance changes", () => {
      const block = mapped.transaction.data.transaction;
      const commands = block.kind === "ProgrammableTransaction" ? block.transactions : [];

      expect(commands).toContainEqual({ Other: "TransferObjects" });
      expect(commands).toContainEqual({ Other: "SplitCoins" });
      expect(mapped.balanceChanges?.length).toBeGreaterThan(0);
      for (const change of mapped.balanceChanges ?? []) {
        expect(change.coinType).not.toContain("0x0000000000000000");
        expect(change.amount).toMatch(/^-?\d+$/);
      }
    });

    // SIP-58 deposits arrive as accumulator writes rather than balance changes, and mainnet does not
    // reliably serve one to capture. Injecting the wire shape onto a real transaction covers proto →
    // `getUnifiedBalanceChanges` end to end, which unit tests for `toAccumulatorEvents` cannot.
    it("synthesises a balance change from an accumulator write", () => {
      const recipient = `0x${"7".repeat(64)}`;
      const withWrite = {
        ...transfer,
        effects: {
          ...transfer.effects,
          changedObjects: [
            ...(transfer.effects?.changedObjects ?? []),
            {
              accumulatorWrite: {
                address: recipient,
                accumulatorType: `0x${"0".repeat(63)}2::sui::SUI`,
                // proto AccumulatorOperation MERGE = 1: an incoming deposit.
                operation: 1,
                integerValue: 4200n,
              },
            },
          ],
        },
      } as unknown as GrpcTypes.ExecutedTransaction;

      const unified = grpcTxToSuiTransaction(withWrite);
      const changes = getUnifiedBalanceChanges(unified);
      const deposit = changes.find(c => c.address === recipient);

      expect(deposit?.amount).toBe("4200");
      expect(deposit?.coinType).toBe("0x2::sui::SUI");
      expect(changes.length).toBe((unified.balanceChanges?.length ?? 0) + 1);
    });
  });
});
