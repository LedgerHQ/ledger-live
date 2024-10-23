import { mapPendingTxToOps, mapTxToOps } from "./misc";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { TransactionResponse } from "./api.types";
import { fetchFullTxs } from "./api";
import { Operation } from "@ledgerhq/types-live";

const Address = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

const mempoolTransfer = {
  tx_id: "0x628369d2c9b49f0ec95531fe1e6a39141573117f3dd047fca65ff5e4058fbc55",
  nonce: 32,
  fee_rate: "487",
  sender_address: "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA",
  sponsored: false,
  post_condition_mode: "deny",
  post_conditions: [],
  anchor_mode: "any",
  tx_status: "pending",
  receipt_time: 1714554733,
  receipt_time_iso: "2024-05-01T09:12:13.000Z",
  tx_type: "token_transfer",
  token_transfer: {
    recipient_address: "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J",
    amount: "9523",
    memo: "0x00000000000000000000000000000000000000000000000000000000000000000000",
  },
};

const sendManyTransfer = {
  tx: {
    tx_id: "0x68bdba90cdbd4e2e112fd008c8c396bd4ca365e482dc68fe25c7aeb5d8eb4c3f",
    nonce: 18,
    fee_rate: "500000",
    sender_address: "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J",
    sponsored: false,
    post_condition_mode: "deny",
    post_conditions: [
      {
        type: "stx",
        condition_code: "sent_equal_to",
        amount: "345000",
        principal: {
          type_id: "principal_standard",
          address: "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J",
        },
      },
    ],
    anchor_mode: "any",
    is_unanchored: false,
    block_hash: "0xc8dd294972d86b09d4226fe99f8bfcdf2c55a7280ca87b7dc8b0fd119a7059f1",
    parent_block_hash: "0xc8f2c105e37544ce27a3a470651d950c6e8fe5f6c072aef653e7ea1fbd97a429",
    block_height: 137791,
    block_time: 1706802438,
    block_time_iso: "2024-02-01T15:47:18.000Z",
    burn_block_time: 1706802438,
    burn_block_time_iso: "2024-02-01T15:47:18.000Z",
    parent_burn_block_time: 1706801557,
    parent_burn_block_time_iso: "2024-02-01T15:32:37.000Z",
    canonical: true,
    tx_index: 121,
    tx_status: "success",
    tx_result: {
      hex: "0x0703",
      repr: "(ok true)",
    },
    microblock_hash: "0x",
    microblock_sequence: 2147483647,
    microblock_canonical: true,
    event_count: 6,
    events: [],
    execution_cost_read_count: 6,
    execution_cost_read_length: 737,
    execution_cost_runtime: 151010,
    execution_cost_write_count: 3,
    execution_cost_write_length: 3,
    tx_type: "contract_call",
    contract_call: {
      contract_id: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo",
      function_name: "send-many",
      function_signature: "",
      function_args: [
        {
          hex: "0x0b000000030c00000003046d656d6f020000000333333302746f05162bd4fbc3d1218275b9ae37c58a8dbed9a952c35c047573747801000000000000000000000000000027100c00000003046d656d6f020000000334343402746f051601a0369ffa2faa8fe74faada53e2e3d215b4d42a047573747801000000000000000000000000000088b80c00000003046d656d6f020000000335353502746f051660cc6b74d6d317918d0a7717069da56d775d817e047573747801000000000000000000000000000493e0",
          repr: "(list (tuple (memo 0x333333) (to 'SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA) (ustx u10000)) (tuple (memo 0x343434) (to 'SPT0DMZZ8QTN3Z79YNDMMZ2WF91BD6M59S9Z10Y) (ustx u35000)) (tuple (memo 0x353535) (to 'SP1GCRTVMTV9HF4CD19VHE1MXMNPQEQC1FT6YWF5Y) (ustx u300000)))",
          name: "",
          type: "(list 3 (tuple (memo (buff 3)) (to principal) (ustx uint)))",
        },
      ],
    },
  },
  stx_sent: "845000",
  stx_received: "0",
  events: {
    stx: {
      transfer: 3,
      mint: 0,
      burn: 0,
    },
    ft: {
      transfer: 0,
      mint: 0,
      burn: 0,
    },
    nft: {
      transfer: 0,
      mint: 0,
      burn: 0,
    },
  },
};

const basicTransfer = {
  tx: {
    tx_id: "0x84254bb1e50b9e4f1dd48161ba5e87dff4ba8718117e8c364769067614dfb99a",
    nonce: 22,
    fee_rate: "125250",
    sender_address: "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J",
    sponsored: false,
    post_condition_mode: "deny",
    post_conditions: [],
    anchor_mode: "any",
    is_unanchored: false,
    block_hash: "0xd3272fbbc264eec8f8b7857541d7a5e6c043b54dd799274544a72d185dc34f1d",
    parent_block_hash: "0x7bc3a3adae166f4a876697ad4c4f924d29dcea2c84607fc7765c0ed0855c3e90",
    block_height: 151738,
    block_time: 1716831904,
    block_time_iso: "2024-05-27T17:45:04.000Z",
    burn_block_time: 1716831849,
    burn_block_time_iso: "2024-05-27T17:44:09.000Z",
    parent_burn_block_time: 1716831377,
    parent_burn_block_time_iso: "2024-05-27T17:36:17.000Z",
    canonical: true,
    tx_index: 29,
    tx_status: "success",
    tx_result: {
      hex: "0x0703",
      repr: "(ok true)",
    },
    microblock_hash: "0x",
    microblock_sequence: 2147483647,
    microblock_canonical: true,
    event_count: 1,
    events: [],
    execution_cost_read_count: 0,
    execution_cost_read_length: 0,
    execution_cost_runtime: 0,
    execution_cost_write_count: 0,
    execution_cost_write_length: 0,
    tx_type: "token_transfer",
    token_transfer: {
      recipient_address: "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA",
      amount: "827695",
      memo: "0x31323333333334000000000000000000000000000000000000000000000000000000",
    },
  },
  stx_sent: "952945",
  stx_received: "0",
  events: {
    stx: {
      transfer: 1,
      mint: 0,
      burn: 0,
    },
    ft: {
      transfer: 0,
      mint: 0,
      burn: 0,
    },
    nft: {
      transfer: 0,
      mint: 0,
      burn: 0,
    },
  },
};

describe("operation building from raw", () => {
  test("map raw transaction to op", async () => {
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: "stacks",
      xpubOrAddress: "",
      derivationMode: "stacks_wallet",
    });

    // Contains operations for txn of type token_transfer
    const operations = ([sendManyTransfer, basicTransfer] as any).flatMap(
      mapTxToOps(accountId, Address),
    );

    expect(operations.length).toBe(2);

    const opSenMany = operations[0];
    const opBasic = operations[1];

    expect(opSenMany.type).toBe("OUT");
    expect(opSenMany.internalOperations).toHaveLength(3);
    expect(opSenMany.senders).toHaveLength(1);
    expect(opSenMany.recipients).toHaveLength(0);

    expect(opBasic.type).toBe("OUT");
    expect(opBasic.internalOperations).toBeUndefined();
    expect(opBasic.senders).toHaveLength(1);
    expect(opBasic.recipients).toHaveLength(1);
  });
});

test("convert raw transactions to live operations", async () => {
  const rawTxs: TransactionResponse[] = await fetchFullTxs(Address);
  const operations: Operation[] = rawTxs.flatMap(mapTxToOps("dummyAccountID", Address));

  expect(operations).toBeDefined();
  expect(operations.length).toBeGreaterThan(0);
});

describe("operation building from mempool raw", () => {
  test("map raw mempool transaction to op", async () => {
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: "stacks",
      xpubOrAddress: "",
      derivationMode: "stacks_wallet",
    });

    const address = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";

    // Contains operations for txn of type token_transfer
    const operations = [mempoolTransfer].map(mapPendingTxToOps(accountId, address)).flat();

    expect(operations.length).toBe(1);
    expect(operations[0].type).toBe("OUT");
    expect(operations[0].internalOperations).toBeUndefined();
    expect(operations[0].senders).toHaveLength(1);
    expect(operations[0].recipients).toHaveLength(1);
  });
});
