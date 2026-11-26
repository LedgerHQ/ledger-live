// Recorded from Tron mainnet through TronGrid's API, for transaction
// 65c351b2a787dd278b4d9425a67cefa41199b9110bfa82450d925fd29348148a (block 82524820): account
// TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a calls contract TTtiUacDYFYVuWp57DnvJPsUsfiQV73Hxi (selector
// 224ee04f), which pays it 6 471.728420 TRX back through an internal transaction. TronGrid's
// transactions endpoint lists the call alone; its internal-transactions endpoint lists the payout,
// and the receipt holds its position. Signatures and `raw_data_hex` are trimmed.

/** `GET /v1/accounts/TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a/transactions` at the call's timestamp. */
export const nativePage = {
  data: [
    {
      ret: [
        {
          contractRet: "SUCCESS",
          fee: 990300,
        },
      ],
      txID: "65c351b2a787dd278b4d9425a67cefa41199b9110bfa82450d925fd29348148a",
      net_usage: 279,
      net_fee: 0,
      energy_usage: 0,
      blockNumber: 82524820,
      block_timestamp: 1778242722000,
      energy_fee: 990300,
      energy_usage_total: 9903,
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                data: "224ee04f",
                owner_address: "419f6ba6d6084d49a7ff9bdbc5a2eaf9760a59f0d6",
                contract_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
              },
              type_url: "type.googleapis.com/protocol.TriggerSmartContract",
            },
            type: "TriggerSmartContract",
          },
        ],
        ref_block_bytes: "3a7e",
        ref_block_hash: "cdd952f054ceaf9b",
        expiration: 1778242770000,
        fee_limit: 200000000,
        timestamp: 1778242711267,
      },
      internal_transactions: [
        {
          internal_tx_id: "0487f56c04d23512bd864ecfef782ea64d79d12e5af9d58b4026670e6974f501",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "41b4090d337ef8fbf880c1c287412cfb72324d711e",
          from_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
        },
        {
          internal_tx_id: "fa7dcc7bc902c3a577abbf287ff9e825484a428c875351b32840a2c87cac2b58",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "41b4090d337ef8fbf880c1c287412cfb72324d711e",
          from_address: "41b4090d337ef8fbf880c1c287412cfb72324d711e",
        },
        {
          internal_tx_id: "4ec8093934269b27bbda14944a05fd739b057c4e6ca08c771d1b0a7b0df1d44b",
          data: {
            note: "call",
            rejected: false,
          },
          to_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
          from_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
        },
        {
          internal_tx_id: "93cbd435a1375b3d3400e32068223f69ebae189998ef839a6849d838877ad5af",
          data: {
            note: "call",
            rejected: false,
            call_value: {
              _: 6471728420,
            },
          },
          to_address: "419f6ba6d6084d49a7ff9bdbc5a2eaf9760a59f0d6",
          from_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
        },
      ],
    },
  ],
  success: true,
  meta: {
    at: 1795606476305,
    page_size: 1,
  },
};

/** `GET /v1/accounts/TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a/transactions/trc20` at the call's timestamp. */
export const trc20Page = {
  data: [],
  success: true,
  meta: {
    at: 1795606482123,
    page_size: 0,
  },
};

/** `POST /wallet/gettransactioninfobyid` of the call. */
export const receipt = {
  id: "65c351b2a787dd278b4d9425a67cefa41199b9110bfa82450d925fd29348148a",
  fee: 990300,
  blockNumber: 82524820,
  blockTimeStamp: 1778242722000,
  contractResult: [""],
  contract_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
  receipt: {
    energy_fee: 990300,
    energy_usage_total: 9903,
    net_usage: 279,
    result: "SUCCESS",
  },
  log: [
    {
      address: "c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
      topics: [
        "90deca1c2ea555b852cac26c61d722640e109b0dda9b4a9a0886a0dd065f5a2d",
        "0000000000000000000000009f6ba6d6084d49a7ff9bdbc5a2eaf9760a59f0d6",
      ],
      data: "0000000000000000000000000000000000000000000000000000000181bebd24",
    },
  ],
  internal_transactions: [
    {
      hash: "0487f56c04d23512bd864ecfef782ea64d79d12e5af9d58b4026670e6974f501",
      caller_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
      transferTo_address: "41b4090d337ef8fbf880c1c287412cfb72324d711e",
      callValueInfo: [{}],
      note: "63616c6c",
    },
    {
      hash: "fa7dcc7bc902c3a577abbf287ff9e825484a428c875351b32840a2c87cac2b58",
      caller_address: "41b4090d337ef8fbf880c1c287412cfb72324d711e",
      transferTo_address: "41b4090d337ef8fbf880c1c287412cfb72324d711e",
      callValueInfo: [{}],
      note: "63616c6c",
    },
    {
      hash: "4ec8093934269b27bbda14944a05fd739b057c4e6ca08c771d1b0a7b0df1d44b",
      caller_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
      transferTo_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
      callValueInfo: [{}],
      note: "63616c6c",
    },
    {
      hash: "93cbd435a1375b3d3400e32068223f69ebae189998ef839a6849d838877ad5af",
      caller_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
      transferTo_address: "419f6ba6d6084d49a7ff9bdbc5a2eaf9760a59f0d6",
      callValueInfo: [
        {
          callValue: 6471728420,
        },
      ],
      note: "63616c6c",
    },
  ],
};

/** `POST /wallet/getblock` of block 82524820, without its transactions. */
export const block = {
  blockID: "0000000004eb3a94b9d43366b4e503efc57507513362357c9a96566184ea7059",
  block_header: {
    raw_data: {
      timestamp: 1778242722000,
      txTrieRoot: "c336659fa84bbb794a3cf6c4a08da8a176789c5eb61304bc5e813e1bc1a6032c",
      parentHash: "0000000004eb3a9312c7b33c54bcedea01fb59be01a852ff689af48ef2c17a3c",
      number: 82524820,
      witness_address: "41a4ce68cfcdd27884bde52cec653354048e0aa989",
      version: 34,
    },
  },
};

/** `GET /v1/accounts/TQW9QLBUPF2pYvhxSjMeTwBCrhm3s1sn2a/internal-transactions` at the call's timestamp. */
export const internalPage = {
  data: [
    {
      internal_tx_id: "93cbd435a1375b3d3400e32068223f69ebae189998ef839a6849d838877ad5af",
      data: {
        note: "call",
        rejected: false,
        call_value: {
          _: 6471728420,
        },
      },
      block_timestamp: 1778242722000,
      to_address: "419f6ba6d6084d49a7ff9bdbc5a2eaf9760a59f0d6",
      tx_id: "65c351b2a787dd278b4d9425a67cefa41199b9110bfa82450d925fd29348148a",
      from_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
    },
  ],
  success: true,
  meta: {
    at: 0,
    page_size: 1,
  },
};

/** `POST /wallet/gettransactionbyid` of the call. */
export const transaction = {
  txID: "65c351b2a787dd278b4d9425a67cefa41199b9110bfa82450d925fd29348148a",
  ret: [
    {
      contractRet: "SUCCESS",
    },
  ],
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            data: "224ee04f",
            owner_address: "419f6ba6d6084d49a7ff9bdbc5a2eaf9760a59f0d6",
            contract_address: "41c498c9d3060e7ee29629f4d6f4ce01e92d09125b",
          },
        },
        type: "TriggerSmartContract",
      },
    ],
  },
};
