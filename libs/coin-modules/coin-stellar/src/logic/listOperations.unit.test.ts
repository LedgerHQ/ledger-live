import { listOperations } from "./listOperations";
import coinConfig from "../config";
import { OperationCallBuilder } from "@stellar/stellar-sdk/lib/horizon/operation_call_builder";
import { HorizonApi } from "@stellar/stellar-sdk/lib/horizon";

describe("listOperations", () => {
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    explorer: { url: "https://stellar.coin.ledger.com" },
  }));
  it("lists operations associated with an address", async () => {
    jest.spyOn(OperationCallBuilder.prototype, "call").mockResolvedValue({
      records: [
        {
          id: "operation_id1",
          transaction_hash: "transaction_hash1",
          paging_token: "token1",
          source_account: "address",
          from: "address",
          to: "receiver1",
          amount: "46.0600000",
          type: HorizonApi.OperationResponseType.payment,
          transaction_successful: true,
          created_at: "2025-01-01",
          transaction: () => ({
            fee_charged: "111900",
            ledger_attr: 42,
            ledger: () => ({
              hash: "block_hash1",
              closed_at: "2025-01-01",
            }),
          }),
        },
        {
          id: "operation_id2",
          transaction_hash: "transaction_hash1",
          paging_token: "token2",
          source_account: "address",
          from: "address",
          to: "receiver2",
          amount: "666.0000000",
          type: HorizonApi.OperationResponseType.payment,
          transaction_successful: false,
          created_at: "2025-01-01",
          transaction: () => ({
            fee_charged: "11100",
            ledger_attr: 42,
            ledger: () => ({
              hash: "block_hash1",
              closed_at: "2025-01-01",
            }),
          }),
        },
        {
          id: "operation_id3",
          transaction_hash: "transaction_hash2",
          paging_token: "token3",
          source_account: "sender",
          from: "sender",
          to: "address",
          amount: "50.5000000",
          type: HorizonApi.OperationResponseType.payment,
          transaction_successful: true,
          created_at: "2025-01-01",
          transaction: () => ({
            fee_charged: "111",
            ledger_attr: 42,
            ledger: () => ({
              hash: "block_hash1",
              closed_at: "2025-01-01",
            }),
          }),
        },
      ],
    } as any);

    expect(await listOperations("address", { order: "asc" })).toEqual([
      [
        {
          id: "transaction_hash1-operation_id1",
          asset: { type: "native" },
          senders: ["address"],
          recipients: ["receiver1"],
          tx: {
            block: { hash: "block_hash1", height: 42, time: new Date("2025-01-01") },
            date: new Date("2025-01-01"),
            fees: 111900n,
            hash: "transaction_hash1",
          },
          type: "OUT",
          value: 460600000n,
        },
        {
          id: "transaction_hash1-operation_id2",
          asset: { type: "native" },
          senders: ["address"],
          recipients: ["receiver2"],
          tx: {
            block: { hash: "block_hash1", height: 42, time: new Date("2025-01-01") },
            date: new Date("2025-01-01"),
            fees: 11100n,
            hash: "transaction_hash1",
          },
          type: "OUT",
          value: 11100n,
        },
        {
          id: "transaction_hash2-operation_id3",
          asset: { type: "native" },
          senders: ["sender"],
          recipients: ["address"],
          tx: {
            block: { hash: "block_hash1", height: 42, time: new Date("2025-01-01") },
            date: new Date("2025-01-01"),
            fees: 111n,
            hash: "transaction_hash2",
          },
          type: "IN",
          value: 505000000n,
        },
      ],
      "token3",
    ]);
  });
});
