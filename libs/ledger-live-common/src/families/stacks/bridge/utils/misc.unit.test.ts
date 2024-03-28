import flatMap from "lodash/flatMap";
import { mapTxToOps } from "./misc";
import { encodeAccountId } from "../../../../account";
import { StacksOperation } from "../../types";
import { TransactionResponse } from "./api.types";

const sendManyTransfer = {
  tx: {
    tx_id: "0x6a0a4b48b7f25954d4fa99a71da697c064e45064dd45d99ba341734d7fb9bf47",
    nonce: 0,
    fee_rate: "19031",
    sender_address: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
    sponsored: false,
    post_condition_mode: "deny",
    post_conditions: [
      {
        type: "stx",
        condition_code: "sent_equal_to",
        amount: "6000",
        principal: {
          type_id: "principal_standard",
          address: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
        },
      },
    ],
    anchor_mode: "any",
    is_unanchored: false,
    block_hash: "0xb4f8f8f7de729a05bd4704cedf27d673aa29438b85eeea5dff0ff7122ed93836",
    parent_block_hash: "0x41ea38da09d7f5b04eb00609a65436b0df13fa5e486b9d725162e160ef2c78b9",
    block_height: 143263,
    burn_block_time: 1710791858,
    burn_block_time_iso: "2024-03-18T19:57:38.000Z",
    parent_burn_block_time: 1710791468,
    parent_burn_block_time_iso: "2024-03-18T19:51:08.000Z",
    canonical: true,
    tx_index: 295,
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
      function_signature:
        "(define-public (send-many (recipients (list 200 (tuple (memo (buff 34)) (to principal) (ustx uint))))))",
      function_args: [
        {
          hex: "0x0b000000030c00000003046d656d6f020000000331323302746f05169bb1637fb05464dcdb540b68bae6fc6f1fd99b41047573747801000000000000000000000000000003e80c00000003046d656d6f020000000334353602746f05162bfab183609b8d5b92922b9a469ce340f62b5e52047573747801000000000000000000000000000007d00c00000003046d656d6f020000000337383902746f0516774075cfe2ee4fe90843f4324060841e5137c9f504757374780100000000000000000000000000000bb8",
          repr: "(list (tuple (memo 0x313233) (to 'SP2DV2RVZP1A69Q6VAG5PHEQ6ZHQHZPCV84TMYNGN) (ustx u1000)) (tuple (memo 0x343536) (to 'SPNZNCC3C2DRTPWJJ8NSMHMWWD0FCATYA8CVZ84E) (ustx u2000)) (tuple (memo 0x373839) (to 'SP1VM0XEFWBQ4ZT888FT34G30GGF52DY9YQWZCAQ0) (ustx u3000)))",
          name: "recipients",
          type: "(list 200 (tuple (memo (buff 34)) (to principal) (ustx uint)))",
        },
      ],
    },
  },
  stx_sent: "25031",
  stx_received: "0",
  stx_transfers: [
    {
      amount: "3000",
      sender: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
      recipient: "SP1VM0XEFWBQ4ZT888FT34G30GGF52DY9YQWZCAQ0",
    },
    {
      amount: "2000",
      sender: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
      recipient: "SPNZNCC3C2DRTPWJJ8NSMHMWWD0FCATYA8CVZ84E",
    },
    {
      amount: "1000",
      sender: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
      recipient: "SP2DV2RVZP1A69Q6VAG5PHEQ6ZHQHZPCV84TMYNGN",
    },
  ],
  ft_transfers: [],
  nft_transfers: [],
};

const basicTransfer = {
  tx: {
    tx_id: "0x445e42f706602f2f10a956894a61d7f558cd6e5bc88cb4b708ea72e00419d7b0",
    nonce: 346,
    fee_rate: "72000",
    sender_address: "SP17YZQB1228EK9MPHQXA8GC4G3HVWZ66X7VRPMAX",
    sponsored: false,
    post_condition_mode: "deny",
    post_conditions: [],
    anchor_mode: "any",
    is_unanchored: false,
    block_hash: "0x9586c2caf110f6c6a0ac298eb4d4b058f61805e3908a3388ceccfe265e1da046",
    parent_block_hash: "0x19792b9920861006874e598b0d456f580d2f6153db97be09e801a90ab9aa3f70",
    block_height: 76538,
    burn_block_time: 1663698475,
    burn_block_time_iso: "2022-09-20T18:27:55.000Z",
    parent_burn_block_time: 1663697222,
    parent_burn_block_time_iso: "2022-09-20T18:07:02.000Z",
    canonical: true,
    tx_index: 59,
    tx_status: "success",
    tx_result: {
      hex: "0x0703",
      repr: "(ok true)",
    },
    microblock_hash: "0x753f258af0a5e09785079d5b976a52556a2c53e2f16b150b46bfdcf6d347bf17",
    microblock_sequence: 3,
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
      recipient_address: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
      amount: "2000000",
      memo: "0x7a6f6e6461782d746573740000000000000000000000000000000000000000000000",
    },
  },
  stx_sent: "0",
  stx_received: "2000000",
  stx_transfers: [
    {
      amount: "2000000",
      sender: "SP17YZQB1228EK9MPHQXA8GC4G3HVWZ66X7VRPMAX",
      recipient: "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9",
    },
  ],
  ft_transfers: [],
  nft_transfers: [],
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
    const operations = flatMap<TransactionResponse, StacksOperation>(
      [sendManyTransfer, basicTransfer],
      mapTxToOps(accountId),
    );

    expect(operations.length).toBe(2);

    const opSenMany = operations[0];
    const opBasic = operations[1];

    expect(opSenMany.type).toBe("OUT");
    expect(opSenMany.internalOperations).toHaveLength(3);
    expect(opSenMany.senders).toHaveLength(1);
    expect(opSenMany.recipients).toHaveLength(0);

    expect(opBasic.type).toBe("IN");
    expect(opBasic.internalOperations).toBeUndefined();
    expect(opBasic.senders).toHaveLength(1);
    expect(opBasic.recipients).toHaveLength(1);
  });
});
