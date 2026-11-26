// Recorded from Tron mainnet through Ledger's TronGrid proxy, for transaction
// 6e1426575e325d6c7d57c10dbf73b35ac5dc88bdb68eaa303f2e45e4aa21aaf3 (block 88336767): account
// TGuurnaiF1dAtiGvgGUbpxzajSUAkpT93H calls SunSwap V2's router TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax
// (`swapExactETHForTokens`) with 9 500 TRX attached as `call_value`. The router wraps it as WTRX
// (an internal transaction to TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR) and the pool pays the account
// 2 881.673945 USDT (a `Transfer` log). The block keeps this transaction only; signatures and
// `raw_data_hex` are trimmed.

export const account = "TGuurnaiF1dAtiGvgGUbpxzajSUAkpT93H";
export const router = "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax";
export const txID = "6e1426575e325d6c7d57c10dbf73b35ac5dc88bdb68eaa303f2e45e4aa21aaf3";

/** `POST /wallet/getblock` `{ id_or_num: "88336767", detail: true }`. */
export const block = {
  blockID: "000000000543e97f6eebaab2ddb953bdd30684736d8ba431e52a50b6cb7fc118",
  block_header: {
    raw_data: {
      timestamp: 1795684557000,
      txTrieRoot: "587cfa854c5217e5be740ea4c6e2030ef70d625617fcf4fc193a65ddbd0e369b",
      parentHash: "000000000543e97ec477702fae69094a3f9e54fe38e9a38442d57927582ab6ff",
      number: 88336767,
      witness_address: "411c8163d2a981b90481dcc8ca34c0f837b3305bc6",
      version: 39,
    },
    witness_signature:
      "1b5910dcdfbc49ee3b93032b93d704dd590b609368f796e392689db446c7b0c234ba7c7cd44ef3af854b4abccef84e7a14f3752ad84fd3672716b1335612864b01",
  },
  transactions: [
    {
      raw_data: {
        ref_block_bytes: "e96c",
        ref_block_hash: "f549c0fdb9bbd23c",
        expiration: 1795684614000,
        contract: [
          {
            parameter: {
              value: {
                owner_address: "414c295299b130ca80b6f405dfca472f78a71f1cff",
                contract_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
                call_value: 9500000000,
                data: "7ff36ab500000000000000000000000000000000000000000000000000000000aae7002700000000000000000000000000000000000000000000000000000000000000800000000000000000000000004c295299b130ca80b6f405dfca472f78a71f1cff000000000000000000000000000000000000000000000000000000006b07fb220000000000000000000000000000000000000000000000000000000000000002000000000000000000000000891cdb91d149f23b1a45d9c5ca78a88d0cb44c18000000000000000000000000a614f803b6fd780986a42c78ec9c7f77e6ded13c",
              },
              type_url: "type.googleapis.com/protocol.TriggerSmartContract",
            },
            type: "TriggerSmartContract",
          },
        ],
        timestamp: 1795684554453,
        fee_limit: 100000000,
      },
      ret: [
        {
          contractRet: "SUCCESS",
        },
      ],
      txID: "6e1426575e325d6c7d57c10dbf73b35ac5dc88bdb68eaa303f2e45e4aa21aaf3",
    },
  ],
};

/** `POST /wallet/gettransactioninfobyblocknum` `{ num: 88336767 }`. */
export const txInfos = [
  {
    id: "6e1426575e325d6c7d57c10dbf73b35ac5dc88bdb68eaa303f2e45e4aa21aaf3",
    fee: 513000,
    blockNumber: 88336767,
    blockTimeStamp: 1795684557000,
    contractResult: [
      "0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000002363e7f0000000000000000000000000000000000000000000000000000000000abc2dad9",
    ],
    contract_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
    receipt: {
      energy_usage: 157354,
      energy_usage_total: 157354,
      net_fee: 513000,
      result: "SUCCESS",
      energy_penalty_total: 52762,
    },
    log: [
      {
        address: "891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
        topics: [
          "e1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
          "0000000000000000000000006e0617948fe030a7e4970f8389d4ad295f249b7e",
        ],
        data: "00000000000000000000000000000000000000000000000000000002363e7f00",
      },
      {
        address: "891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
        topics: [
          "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0000000000000000000000006e0617948fe030a7e4970f8389d4ad295f249b7e",
          "0000000000000000000000003a10321a4e97a64d9376af42ec07d5fa50294b35",
        ],
        data: "00000000000000000000000000000000000000000000000000000002363e7f00",
      },
      {
        address: "a614f803b6fd780986a42c78ec9c7f77e6ded13c",
        topics: [
          "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0000000000000000000000003a10321a4e97a64d9376af42ec07d5fa50294b35",
          "0000000000000000000000004c295299b130ca80b6f405dfca472f78a71f1cff",
        ],
        data: "00000000000000000000000000000000000000000000000000000000abc2dad9",
      },
      {
        address: "3a10321a4e97a64d9376af42ec07d5fa50294b35",
        topics: ["1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1"],
        data: "0000000000000000000000000000000000000000000000000000861bc7f6a7d7000000000000000000000000000000000000000000000000000028cca9b77796",
      },
      {
        address: "3a10321a4e97a64d9376af42ec07d5fa50294b35",
        topics: [
          "d78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
          "0000000000000000000000006e0617948fe030a7e4970f8389d4ad295f249b7e",
          "0000000000000000000000004c295299b130ca80b6f405dfca472f78a71f1cff",
        ],
        data: "00000000000000000000000000000000000000000000000000000002363e7f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000abc2dad9",
      },
    ],
    internal_transactions: [
      {
        hash: "43b8b9ad8bf440103d25e3006b3c578eb014112aa07f30a4b5e5e1d2654389fa",
        caller_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        transferTo_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        callValueInfo: [{}],
        note: "63616c6c",
      },
      {
        hash: "36bddd0b0e7e9711e13b3609b07d551accfb0c6ec5a45839bfb8582c1696ad83",
        caller_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        transferTo_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
        callValueInfo: [
          {
            callValue: 9500000000,
          },
        ],
        note: "63616c6c",
      },
      {
        hash: "983427849dd9dd50667c7ad2b4dd38027c5374ad7e0955d5028a62cdcea9eda5",
        caller_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        transferTo_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
        callValueInfo: [{}],
        note: "63616c6c",
      },
      {
        hash: "a950d40f1797c44d9efcfe28d0fb53a6a5482e9c28c2ae62c311cd2de5bc9955",
        caller_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        transferTo_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        callValueInfo: [{}],
        note: "63616c6c",
      },
      {
        hash: "8d3e0def0598f59eb64c0fec8b5e8ef535d4b052fd166c5540247e49c5f344f8",
        caller_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        transferTo_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
        callValueInfo: [{}],
        note: "63616c6c",
      },
      {
        hash: "f9d70fc07e7c40529780ecbdffda7d05cc7e56b3c7e399e6358c9d6e4b18f1ab",
        caller_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        transferTo_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
        callValueInfo: [{}],
        note: "63616c6c",
      },
      {
        hash: "ccd8589a1f482a5a8b54d7700587cb2fbdcd253006e1b9c9b0b9e233efe4879c",
        caller_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        transferTo_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
        callValueInfo: [{}],
        note: "63616c6c",
      },
    ],
  },
];

/** `GET /v1/accounts/{account}/transactions` at the swap's timestamp. */
export const nativePage = {
  data: [
    {
      ret: [
        {
          contractRet: "SUCCESS",
          fee: 513000,
        },
      ],
      txID: "6e1426575e325d6c7d57c10dbf73b35ac5dc88bdb68eaa303f2e45e4aa21aaf3",
      net_usage: 0,
      net_fee: 513000,
      energy_usage: 157354,
      blockNumber: 88336767,
      block_timestamp: 1795684557000,
      energy_fee: 0,
      energy_usage_total: 157354,
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                data: "7ff36ab500000000000000000000000000000000000000000000000000000000aae7002700000000000000000000000000000000000000000000000000000000000000800000000000000000000000004c295299b130ca80b6f405dfca472f78a71f1cff000000000000000000000000000000000000000000000000000000006b07fb220000000000000000000000000000000000000000000000000000000000000002000000000000000000000000891cdb91d149f23b1a45d9c5ca78a88d0cb44c18000000000000000000000000a614f803b6fd780986a42c78ec9c7f77e6ded13c",
                owner_address: "414c295299b130ca80b6f405dfca472f78a71f1cff",
                contract_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
                call_value: 9500000000,
              },
              type_url: "type.googleapis.com/protocol.TriggerSmartContract",
            },
            type: "TriggerSmartContract",
          },
        ],
        ref_block_bytes: "e96c",
        ref_block_hash: "f549c0fdb9bbd23c",
        expiration: 1795684614000,
        fee_limit: 100000000,
        timestamp: 1795684554453,
      },
      internal_transactions: [
        {
          internal_tx_id: "43b8b9ad8bf440103d25e3006b3c578eb014112aa07f30a4b5e5e1d2654389fa",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
          from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        },
        {
          internal_tx_id: "36bddd0b0e7e9711e13b3609b07d551accfb0c6ec5a45839bfb8582c1696ad83",
          data: {
            note: "call",
            rejected: false,
            call_value: {
              _: 9500000000,
            },
          },
          to_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
          from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        },
        {
          internal_tx_id: "983427849dd9dd50667c7ad2b4dd38027c5374ad7e0955d5028a62cdcea9eda5",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
          from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        },
        {
          internal_tx_id: "a950d40f1797c44d9efcfe28d0fb53a6a5482e9c28c2ae62c311cd2de5bc9955",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
          from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
        },
        {
          internal_tx_id: "8d3e0def0598f59eb64c0fec8b5e8ef535d4b052fd166c5540247e49c5f344f8",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
          from_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        },
        {
          internal_tx_id: "f9d70fc07e7c40529780ecbdffda7d05cc7e56b3c7e399e6358c9d6e4b18f1ab",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
          from_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        },
        {
          internal_tx_id: "ccd8589a1f482a5a8b54d7700587cb2fbdcd253006e1b9c9b0b9e233efe4879c",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
          from_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
        },
      ],
    },
  ],
  success: true,
  meta: {
    at: 0,
    page_size: 1,
  },
};

/** `GET /v1/accounts/{account}/transactions/trc20` at the swap's timestamp. */
export const trc20Page = {
  data: [
    {
      transaction_id: "6e1426575e325d6c7d57c10dbf73b35ac5dc88bdb68eaa303f2e45e4aa21aaf3",
      token_info: {
        symbol: "USDT",
        address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        decimals: 6,
        name: "Tether USD",
      },
      block_timestamp: 1795684557000,
      from: "TFGDbUyP8xez44C76fin3bn3Ss6jugoUwJ",
      to: "TGuurnaiF1dAtiGvgGUbpxzajSUAkpT93H",
      detail: {
        ret: [
          {
            contractRet: "SUCCESS",
            fee: 513000,
          },
        ],
        txID: "6e1426575e325d6c7d57c10dbf73b35ac5dc88bdb68eaa303f2e45e4aa21aaf3",
        net_usage: 0,
        net_fee: 513000,
        energy_usage: 157354,
        blockNumber: 88336767,
        block_timestamp: 1795684557000,
        energy_fee: 0,
        energy_usage_total: 157354,
        raw_data: {
          contract: [
            {
              parameter: {
                value: {
                  data: "7ff36ab500000000000000000000000000000000000000000000000000000000aae7002700000000000000000000000000000000000000000000000000000000000000800000000000000000000000004c295299b130ca80b6f405dfca472f78a71f1cff000000000000000000000000000000000000000000000000000000006b07fb220000000000000000000000000000000000000000000000000000000000000002000000000000000000000000891cdb91d149f23b1a45d9c5ca78a88d0cb44c18000000000000000000000000a614f803b6fd780986a42c78ec9c7f77e6ded13c",
                  owner_address: "414c295299b130ca80b6f405dfca472f78a71f1cff",
                  contract_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
                  call_value: 9500000000,
                },
                type_url: "type.googleapis.com/protocol.TriggerSmartContract",
              },
              type: "TriggerSmartContract",
            },
          ],
          ref_block_bytes: "e96c",
          ref_block_hash: "f549c0fdb9bbd23c",
          expiration: 1795684614000,
          fee_limit: 100000000,
          timestamp: 1795684554453,
        },
        internal_transactions: [
          {
            internal_tx_id: "43b8b9ad8bf440103d25e3006b3c578eb014112aa07f30a4b5e5e1d2654389fa",
            data: {
              note: "call",
              rejected: false,
            },
            to_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
            from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
          },
          {
            internal_tx_id: "36bddd0b0e7e9711e13b3609b07d551accfb0c6ec5a45839bfb8582c1696ad83",
            data: {
              note: "call",
              rejected: false,
              call_value: {
                _: 9500000000,
              },
            },
            to_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
            from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
          },
          {
            internal_tx_id: "983427849dd9dd50667c7ad2b4dd38027c5374ad7e0955d5028a62cdcea9eda5",
            data: {
              note: "call",
              rejected: false,
            },
            to_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
            from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
          },
          {
            internal_tx_id: "a950d40f1797c44d9efcfe28d0fb53a6a5482e9c28c2ae62c311cd2de5bc9955",
            data: {
              note: "call",
              rejected: false,
            },
            to_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
            from_address: "416e0617948fe030a7e4970f8389d4ad295f249b7e",
          },
          {
            internal_tx_id: "8d3e0def0598f59eb64c0fec8b5e8ef535d4b052fd166c5540247e49c5f344f8",
            data: {
              note: "call",
              rejected: false,
            },
            to_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
            from_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
          },
          {
            internal_tx_id: "f9d70fc07e7c40529780ecbdffda7d05cc7e56b3c7e399e6358c9d6e4b18f1ab",
            data: {
              note: "call",
              rejected: false,
            },
            to_address: "41891cdb91d149f23b1a45d9c5ca78a88d0cb44c18",
            from_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
          },
          {
            internal_tx_id: "ccd8589a1f482a5a8b54d7700587cb2fbdcd253006e1b9c9b0b9e233efe4879c",
            data: {
              note: "call",
              rejected: false,
            },
            to_address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
            from_address: "413a10321a4e97a64d9376af42ec07d5fa50294b35",
          },
        ],
      },
      type: "Transfer",
      value: "2881673945",
    },
  ],
  success: true,
  meta: {
    at: 0,
    page_size: 1,
  },
};

/** `POST /wallet/getblock` `{ id_or_num: "88336767", detail: false }`, header fields read. */
export const blockHeader = {
  blockID: "000000000543e97f6eebaab2ddb953bdd30684736d8ba431e52a50b6cb7fc118",
  block_header: {
    raw_data: {
      number: 88336767,
      timestamp: 1795684557000,
    },
  },
};
