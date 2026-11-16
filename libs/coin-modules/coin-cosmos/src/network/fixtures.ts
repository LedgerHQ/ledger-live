import { GetBlockByHeightSDK, GetBlockWithTxsSDK } from "./types";

export const GET_BLOCK_BY_HEIGHT_SDK_EXAMPLE: GetBlockByHeightSDK = {
  block_id: {
    hash: "cJCA+pewy8UShmChqh12/HjpTMjpdQP6it5FwlJSn9E=",
    part_set_header: {
      total: 1,
      hash: "1afLLfotW/2qLIybTtj8+KhfS7bKuRAZ3/aKWn29QLg=",
    },
  },
  block: {
    header: {
      version: { block: "11", app: "0" },
      chain_id: "cosmoshub-4",
      height: "33721700",
      time: "2026-11-04T10:24:57.711662460Z",
      last_block_id: {
        hash: "o6Z6uYytJ8wlUAus8uoiBqFqCbCfZZ/jVcG7wdZYT3w=",
        part_set_header: {
          total: 1,
          hash: "5NSLLcHiSjDVApc1Q5kieDI7rik59CkNw+vEwfWkCWQ=",
        },
      },
      last_commit_hash: "DKpI/KvyBY4D/Ftt7+Rdaewg5w7EPFyxNhA3p40cs5U=",
      data_hash: "p0cJKIDscLev2dzEXJYV1ONoxHRxauR6sweXO/6ou6Q=",
      validators_hash: "dIUTWlo9BkaV9M1jBVkngR4/UD6BgZVsIt2vYg4GsyY=",
      next_validators_hash: "SZ2Z/9Z1dfGI6RkshbRIuNVqFO/xnqhw+lWt4w1sSKY=",
      consensus_hash: "IMpeP0Lgegzbe9mG7/GUeiP8J/9HIEMD4IK8RLs0jgs=",
      app_hash: "thMYopC6Zm+e+C5ASKhMAbgJJ7KfAGZqKC/Htg5iOCs=",
      last_results_hash: "3pIbeq46LCRmhPW2KgGEVRHkWkPnnwWf9pjfuFUAo9g=",
      evidence_hash: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
      proposer_address: "BLQtpZpDR9k4U2UY4iOCCMql5LM=",
    },
    data: { txs: [] },
    evidence: { evidence: [] },
    last_commit: {
      height: "33721699",
      round: 0,
      block_id: {
        hash: "o6Z6uYytJ8wlUAus8uoiBqFqCbCfZZ/jVcG7wdZYT3w=",
        part_set_header: {
          total: 1,
          hash: "5NSLLcHiSjDVApc1Q5kieDI7rik59CkNw+vEwfWkCWQ=",
        },
      },
      signatures: [],
    },
  },
  sdk_block: {
    header: {
      version: { block: "11", app: "0" },
      chain_id: "cosmoshub-4",
      height: "33721700",
      time: "2026-11-04T10:24:57.711662460Z",
      last_block_id: {
        hash: "o6Z6uYytJ8wlUAus8uoiBqFqCbCfZZ/jVcG7wdZYT3w=",
        part_set_header: {
          total: 1,
          hash: "5NSLLcHiSjDVApc1Q5kieDI7rik59CkNw+vEwfWkCWQ=",
        },
      },
      last_commit_hash: "DKpI/KvyBY4D/Ftt7+Rdaewg5w7EPFyxNhA3p40cs5U=",
      data_hash: "p0cJKIDscLev2dzEXJYV1ONoxHRxauR6sweXO/6ou6Q=",
      validators_hash: "dIUTWlo9BkaV9M1jBVkngR4/UD6BgZVsIt2vYg4GsyY=",
      next_validators_hash: "SZ2Z/9Z1dfGI6RkshbRIuNVqFO/xnqhw+lWt4w1sSKY=",
      consensus_hash: "IMpeP0Lgegzbe9mG7/GUeiP8J/9HIEMD4IK8RLs0jgs=",
      app_hash: "thMYopC6Zm+e+C5ASKhMAbgJJ7KfAGZqKC/Htg5iOCs=",
      last_results_hash: "3pIbeq46LCRmhPW2KgGEVRHkWkPnnwWf9pjfuFUAo9g=",
      evidence_hash: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
      proposer_address: "cosmosvalcons1qj6zmfv6gdrajwznv5vwyguzpr92te9nc93dvx",
    },
    data: { txs: [] },
    evidence: { evidence: [] },
    last_commit: {
      height: "33721699",
      round: 0,
      block_id: {
        hash: "o6Z6uYytJ8wlUAus8uoiBqFqCbCfZZ/jVcG7wdZYT3w=",
        part_set_header: {
          total: 1,
          hash: "5NSLLcHiSjDVApc1Q5kieDI7rik59CkNw+vEwfWkCWQ=",
        },
      },
      signatures: [],
    },
  },
};

export const GET_BLOCK_WITH_TXS_SDK_EXAMPLE: GetBlockWithTxsSDK = {
  txs: [
    {
      body: {
        messages: [
          {
            "@type": "/cosmos.bank.v1beta1.MsgSend",
            from_address: "cosmos16exhyvwyy82fnavqgupf67lku4jvvd82h7p20u",
            to_address: "cosmos16na4yg4rtt4n8j72n54uy5mvxn7f08l7t4h3xv",
            amount: [{ denom: "uatom", amount: "202952273" }],
          },
        ],
        memo: "87DC4762D93D5B0BE770",
        timeout_height: "33723361",
        unordered: false,
        timeout_timestamp: null,
        extension_options: [],
        non_critical_extension_options: [],
      },
      auth_info: {
        signer_infos: [
          {
            public_key: {
              "@type": "/cosmos.crypto.secp256k1.PubKey",
              key: "A96axeOkeDIFUXlJTXjDis58g6C87N0lRw5dM+kCLE0Y", // gitleaks:allow
            },
            mode_info: { single: { mode: "SIGN_MODE_DIRECT" } },
            sequence: "417",
          },
        ],
        fee: {
          amount: [{ denom: "uatom", amount: "3629" }],
          gas_limit: "151216",
          payer: "",
          granter: "",
        },
        tip: null,
      },
      signatures: [
        "JFfCqQLEcihMrL+HG8ZNPOUagqJLx0o/WG4cSwcmZx9NwqlDlAabholTiVuBuCydFZNFRAZYKzO+CBV6J+Rz5g==",
      ],
    },
  ],
  block_id: {
    hash: "Ze5/0SKKqzMwkTViLiFXoYfkjfXMGw9RXF8/Ajxt+pc=",
    part_set_header: {
      total: 1,
      hash: "jzPyHeLMqiM59pC8WSoXQMBcg/KTX7xYd0US/GxbTNQ=",
    },
  },
  block: {
    header: {
      version: { block: "11", app: "0" },
      chain_id: "cosmoshub-4",
      height: "33721701",
      time: "2026-11-04T10:25:03.669957328Z",
      last_block_id: {
        hash: "cJCA+pewy8UShmChqh12/HjpTMjpdQP6it5FwlJSn9E=",
        part_set_header: {
          total: 1,
          hash: "1afLLfotW/2qLIybTtj8+KhfS7bKuRAZ3/aKWn29QLg=",
        },
      },
      last_commit_hash: "92tsmgJYLhz+V0P5uHblmchC9x+OoSs51CKomrX+7/Y=",
      data_hash: "CWZgyBrXKy7+Azm1xxBGU1dn3rShw1dwZqr8Zc9FIbw=",
      validators_hash: "SZ2Z/9Z1dfGI6RkshbRIuNVqFO/xnqhw+lWt4w1sSKY=",
      next_validators_hash: "SZ2Z/9Z1dfGI6RkshbRIuNVqFO/xnqhw+lWt4w1sSKY=",
      consensus_hash: "IMpeP0Lgegzbe9mG7/GUeiP8J/9HIEMD4IK8RLs0jgs=",
      app_hash: "RK+cdIQ3cuXd9t6siTy33LxlGUU7D5+GyWi/I8WwJAA=",
      last_results_hash: "AUsoLnUJnpq98JTUwDHx9nsWgM7VqJ6nBzajtuaEVog=",
      evidence_hash: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
      proposer_address: "JURdDrNT6QUKsR7GGX1dy2EZhts=",
    },
    data: {
      txs: [
        "CrABCpIBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnIKLWNvc21vczE2ZXhoeXZ3eXk4MmZuYXZxZ3VwZjY3bGt1NGp2dmQ4Mmg3cDIwdRItY29zbW9zMTZuYTR5ZzRydHQ0bjhqNzJuNTR1eTVtdnhuN2YwOGw3dDRoM3h2GhIKBXVhdG9tEgkyMDI5NTIyNzMSFDg3REM0NzYyRDkzRDVCMEJFNzcwGOGnihASaApRCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohA96axeOkeDIFUXlJTXjDis58g6C87N0lRw5dM+kCLE0YEgQKAggBGKEDEhMKDQoFdWF0b20SBDM2MjkQsJ0JGkAkV8KpAsRyKEysv4cbxk085RqCokvHSj9YbhxLByZnH03CqUOUBpuGiVOJW4G4LJ0Vk0VEBlgrM74IFXon5HPm",
      ],
    },
    evidence: { evidence: [] },
    last_commit: {
      height: "33721700",
      round: 0,
      block_id: {
        hash: "cJCA+pewy8UShmChqh12/HjpTMjpdQP6it5FwlJSn9E=",
        part_set_header: {
          total: 1,
          hash: "1afLLfotW/2qLIybTtj8+KhfS7bKuRAZ3/aKWn29QLg=",
        },
      },
      signatures: [],
    },
  },
  pagination: { next_key: null, total: "1" },
};
