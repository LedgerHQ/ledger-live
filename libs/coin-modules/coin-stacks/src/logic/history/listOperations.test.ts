import {
  bufferCV,
  listCV,
  serializeCV,
  someCV,
  standardPrincipalCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { fetchAllTransactions } from "../../network/api";
import type { TransactionResponse } from "../../types/api";
import { listOperations } from "./listOperations";

jest.mock("../../network/api");

const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";

function hex(cv: Parameters<typeof serializeCV>[0]): string {
  return `0x${serializeCV(cv)}`;
}

function baseTx(overrides: Partial<TransactionResponse["tx"]>): TransactionResponse {
  return {
    tx: {
      tx_id: "0xtx1",
      nonce: 1,
      fee_rate: "1000",
      sender_address: SENDER,
      sponsored: false,
      post_condition_mode: "deny",
      post_conditions: [],
      anchor_mode: "any",
      is_unanchored: false,
      block_hash: "0xblock1",
      parent_block_hash: "0xparent",
      block_height: 100,
      block_time: 1700000000,
      block_time_iso: "",
      burn_block_time: 1700000000,
      burn_block_time_iso: "",
      parent_burn_block_time: 0,
      parent_burn_block_time_iso: "",
      canonical: true,
      tx_index: 0,
      tx_status: "success",
      tx_result: { hex: "0x0703", repr: "(ok true)" },
      microblock_hash: "0x",
      microblock_sequence: 0,
      microblock_canonical: true,
      event_count: 0,
      execution_cost_read_count: 0,
      execution_cost_read_length: 0,
      execution_cost_runtime: 0,
      execution_cost_write_count: 0,
      execution_cost_write_length: 0,
      events: [],
      tx_type: "token_transfer",
      ...overrides,
    },
    stx_sent: "0",
    stx_received: "0",
    events: {
      stx: { transfer: 0, mint: 0, burn: 0 },
      ft: { transfer: 0, mint: 0, burn: 0 },
      nft: { transfer: 0, mint: 0, burn: 0 },
    },
  };
}

describe("listOperations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a limit above the Stacks page-size cap", async () => {
    await expect(listOperations(SENDER, { minHeight: 0, limit: 51 })).rejects.toThrow(
      "limit must be <= 50 for Stacks",
    );
    expect(fetchAllTransactions).not.toHaveBeenCalled();
  });

  it("filters out operations below minHeight instead of rejecting it", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_id: "0xtx-old",
        block_height: 100,
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
      baseTx({
        tx_id: "0xtx-new",
        block_height: 200,
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 150 });

    expect(items).toHaveLength(1);
    expect(items[0].tx.hash).toBe("0xtx-new");
  });

  it("rejects a cursor", async () => {
    await expect(listOperations(SENDER, { minHeight: 0, cursor: "abc" })).rejects.toThrow(
      "cursor is not supported for Stacks",
    );
  });

  it("caps the returned page at limit, after sorting", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_id: "0xtx-1",
        burn_block_time: 1700000100,
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
      baseTx({
        tx_id: "0xtx-2",
        burn_block_time: 1700000200,
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
      baseTx({
        tx_id: "0xtx-3",
        burn_block_time: 1700000300,
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0, limit: 2 });

    expect(items).toHaveLength(2);
    expect(items.map(op => op.tx.hash)).toEqual(["0xtx-3", "0xtx-2"]);
  });

  it("maps a native STX transfer to an OUT operation from the sender's perspective", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "OUT",
      senders: [SENDER],
      recipients: [RECIPIENT],
      asset: { type: "native" },
    });
  });

  it("maps a native STX transfer to an IN operation from the recipient's perspective", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
    ]);

    const { items } = await listOperations(RECIPIENT, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "IN",
      senders: [SENDER],
      recipients: [RECIPIENT],
      asset: { type: "native" },
    });
  });

  it("sorts operations ascending when order is 'asc'", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_id: "0xtx-later",
        burn_block_time: 1700000200,
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
      baseTx({
        tx_id: "0xtx-earlier",
        burn_block_time: 1700000100,
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0, order: "asc" });

    expect(items.map(op => op.tx.hash)).toEqual(["0xtx-earlier", "0xtx-later"]);
  });

  it("ignores transaction kinds it doesn't recognize (e.g. a contract deploy)", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      // "smart_contract" is a real Stacks tx_type not modeled by TransactionResponse's narrower union.
      baseTx({ tx_type: "smart_contract" as TransactionResponse["tx"]["tx_type"] }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0 });

    expect(items).toHaveLength(0);
  });

  it("maps a send-many contract call to per-recipient operations", async () => {
    const functionArgsHex = hex(
      listCV([
        tupleCV({
          memo: bufferCV(Buffer.from("hi")),
          to: standardPrincipalCV(RECIPIENT),
          ustx: uintCV(5000),
        }),
      ]),
    );

    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo",
          function_name: "send-many",
          function_signature: "",
          function_args: [{ hex: functionArgsHex, repr: "", name: "", type: "" }],
        },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "OUT",
      senders: [SENDER],
      recipients: [RECIPIENT],
      value: 5000n,
      asset: { type: "native" },
    });
  });

  it("does not mis-parse a same-named `send-many` function on an unrelated contract", async () => {
    const functionArgsHex = hex(
      listCV([
        tupleCV({
          amount: uintCV(6900000000),
          memo: bufferCV(Buffer.from("hi")),
          to: standardPrincipalCV(RECIPIENT),
        }),
      ]),
    );

    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.b-faktory",
          function_name: "send-many",
          function_signature: "",
          function_args: [{ hex: functionArgsHex, repr: "", name: "", type: "" }],
        },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("send-many");
    expect(items[0].value).toBe(0n);
  });

  it("maps a send-many contract call to an IN operation from the recipient's perspective", async () => {
    const functionArgsHex = hex(
      listCV([
        tupleCV({
          memo: bufferCV(Buffer.from("hi")),
          to: standardPrincipalCV(RECIPIENT),
          ustx: uintCV(5000),
        }),
      ]),
    );

    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo",
          function_name: "send-many",
          function_signature: "",
          function_args: [{ hex: functionArgsHex, repr: "", name: "", type: "" }],
        },
      }),
    ]);

    const { items } = await listOperations(RECIPIENT, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "IN",
      senders: [SENDER],
      recipients: [RECIPIENT],
      value: 5000n,
      asset: { type: "native" },
    });
  });

  it("maps a SIP-010 transfer to a token operation", async () => {
    const functionArgs = [
      { hex: hex(uintCV(2500)), repr: "", name: "", type: "" },
      { hex: hex(standardPrincipalCV(SENDER)), repr: "", name: "", type: "" },
      { hex: hex(standardPrincipalCV(RECIPIENT)), repr: "", name: "", type: "" },
      { hex: hex(someCV(bufferCV(Buffer.from("memo")))), repr: "", name: "", type: "" },
    ];

    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_type: "contract_call",
        post_conditions: [
          {
            type: "fungible",
            condition_code: "eq",
            amount: "2500",
            principal: { type_id: "principal_standard", address: SENDER },
            asset: {
              asset_name: "token-x",
              contract_address: "SP_CONTRACT",
              contract_name: "token-x",
            },
          },
        ],
        contract_call: {
          contract_id: "SP_CONTRACT.token-x",
          function_name: "transfer",
          function_signature: "",
          function_args: functionArgs,
        },
      }),
    ]);

    const { items } = await listOperations(RECIPIENT, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "IN",
      senders: [SENDER],
      recipients: [RECIPIENT],
      value: 2500n,
      asset: { type: "token", assetReference: "sp_contract.token-x::token-x" },
    });
  });

  it("drops a SIP-010 transfer with no Fungible post-condition (asset name unresolvable)", async () => {
    const functionArgs = [
      { hex: hex(uintCV(2500)), repr: "", name: "", type: "" },
      { hex: hex(standardPrincipalCV(SENDER)), repr: "", name: "", type: "" },
      { hex: hex(standardPrincipalCV(RECIPIENT)), repr: "", name: "", type: "" },
      { hex: hex(someCV(bufferCV(Buffer.from("memo")))), repr: "", name: "", type: "" },
    ];

    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP_CONTRACT.token-x",
          function_name: "transfer",
          function_signature: "",
          function_args: functionArgs,
        },
      }),
    ]);

    const { items } = await listOperations(RECIPIENT, { minHeight: 0 });

    expect(items).toHaveLength(0);
  });

  it("maps any other contract call (e.g. pox-5 stake) to a generic operation", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP000000000000000000002Q6VF78.pox-5",
          function_name: "stake",
          function_signature: "",
          function_args: [],
        },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("stake");
    expect(items[0].senders).toEqual([SENDER]);
  });

  it("marks a failed transaction accordingly", async () => {
    (fetchAllTransactions as jest.Mock).mockResolvedValue([
      baseTx({
        tx_status: "abort_by_response",
        token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
      }),
    ]);

    const { items } = await listOperations(SENDER, { minHeight: 0 });

    expect(items[0].tx.failed).toBe(true);
  });
});
