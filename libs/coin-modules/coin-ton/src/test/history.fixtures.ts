// Trimmed mainnet responses for UQCOvQ…fLfV4 (the bridge dataset account): a NOT jetton sent with
// its TON leg, the excess refund, and a NOT jetton received with its notification.

export const OWNER = "UQCOvQLYvTcbi5tL9MaDNzuVl3-J3vATimNm9yO5XPafLfV4";
export const OWNER_PUBLIC_KEY = "86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a060";
export const OWNER_RAW = "0:8EBD02D8BD371B8B9B4BF4C683373B95977F89DEF0138A6366F723B95CF69F2D";
export const OWNER_JETTON_WALLET_RAW =
  "0:E80F7EE57FAD53DAF48BD4BA45F70B374826DCBD3E77FF99EE55DEDD18721DC6";
export const PEER_RAW = "0:7463A06D9D14BDAC8257A6C4C717384417CDD76B87B9C810CEACF10E6A1EBAAC";
export const PEER_JETTON_WALLET_RAW =
  "0:862F4D6E395D40C5F13FFA95EA203DB04FF755AD971D1B1B14CBA19750B47BDE";
export const NOT_MASTER_RAW = "0:2F956143C461769579BAEF2E32CC2D7BC18283F40D20BB03E432CD603AC33FFC";
export const NOT_MASTER = "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT";

const compute = { skipped: false, success: true, exit_code: 0 };

export const excessRefundTx = {
  account: OWNER_RAW,
  hash: "t9vXEYLHjR3b40v4hPJQJCZRJDXhdhWiWuhzeKIIY9Y=",
  lt: "48954552000001",
  now: 1725542870,
  mc_block_seqno: 40170325,
  total_fees: "396410",
  description: { aborted: false, compute_ph: compute },
  in_msg: {
    hash: "OJbEyEj9+B9yyqkALjMDPHMj2TActki/I5nXxyb0DW4=",
    source: PEER_JETTON_WALLET_RAW,
    destination: OWNER_RAW,
    value: "89965561",
    message_content: { decoded: { "@type": "excess", query_id: "0" } },
  },
  out_msgs: [],
};

export const jettonSendTx = {
  account: OWNER_RAW,
  hash: "xPDVakqj5a0mcix8dsTNyr4oKD0HWhk0nglfOULUFmQ=",
  lt: "48954541000001",
  now: 1725542832,
  mc_block_seqno: 40170315,
  total_fees: "2600565",
  description: { aborted: false, compute_ph: compute },
  in_msg: {
    hash: "0J2ClZ4ywxSMQRevw1X0edMaUB874he0oVVmTsN4I7Y=",
    source: null,
    destination: OWNER_RAW,
    value: null,
    message_content: {
      body: "te6cckEBBAEA8gABnBVugAsi9Urn4pbyFWZkPHU5xuISeJLKZfApk/T8Ji7FHzoPH7BmSj0KStRqJz9O0nQlbnl2Qg03lgFAz/jPsgIpqaMXZtmx0wAAAAIAAwEBaGIAdAe/cr/Wqe16RepdIvuFm6QTbl6fO//M9yrvbow5DuMgL68IAAAAAAAAAAAAAAAAAAECAawPin6lAAAAAAAAAABQEqBfIAgA6MdA2zope1kEr02Jji5wiC+brtcPc5AhnVniHNQ9dVkAI69Ati9NxuLm0v0xoM3O5WXf4ne8BOKY2b3I7lc9p8tCAwMAHgAAAABTZW5kaW5nIE5PVI5t/VU=",
      decoded: { "@type": "wallet_signed_v4" },
    },
  },
  out_msgs: [
    {
      hash: "8XFt8ApfGhsr/1B6YxFZLpVmWsTttIR4rvtkBusmQvQ=",
      source: OWNER_RAW,
      destination: OWNER_JETTON_WALLET_RAW,
      value: "100000000",
      message_content: { decoded: { "@type": "jetton_transfer" } },
    },
  ],
};

export const jettonNotifyTx = {
  account: OWNER_RAW,
  hash: "l1j2L+JrLu9MCpAJorHUbp8UtA9aMyQKrQ4zLKO7o8A=",
  lt: "48954505000001",
  now: 1725542692,
  mc_block_seqno: 40170280,
  total_fees: "2617007",
  description: { aborted: true, compute_ph: { skipped: true, reason: "no_gas" } },
  in_msg: {
    hash: "a5ldjLyYtquGurSNnSF9Zmp3dEN4vnlermBnmvCxgd4=",
    source: OWNER_JETTON_WALLET_RAW,
    destination: OWNER_RAW,
    value: "1",
    message_content: { decoded: { "@type": "jetton_notify" } },
  },
  out_msgs: [],
};

export const jettonOut = {
  query_id: "0",
  source: OWNER_RAW,
  destination: PEER_RAW,
  amount: "5000000000",
  source_wallet: OWNER_JETTON_WALLET_RAW,
  jetton_master: NOT_MASTER_RAW,
  transaction_hash: "I3buHLzERZd6whX8lFxllLqTzMWC3WMgFJHrWHffKfI=",
  transaction_lt: "48954545000001",
  transaction_now: 1725542848,
  transaction_aborted: false,
  response_destination: OWNER_RAW,
  custom_payload: null,
  forward_ton_amount: "1",
  forward_payload: "te6cckEBAQEAEQAAHgAAAABTZW5kaW5nIE5PVCs8d98=",
  trace_id: "xPDVakqj5a0mcix8dsTNyr4oKD0HWhk0nglfOULUFmQ=",
};

export const jettonIn = {
  query_id: "2910909431182194933",
  source: PEER_RAW,
  destination: OWNER_RAW,
  amount: "40000000000",
  source_wallet: PEER_JETTON_WALLET_RAW,
  jetton_master: NOT_MASTER_RAW,
  transaction_hash: "XgQwQjYWAOd2o+4chBrfLnjlAf4wVjnnTPcDrmBKAaM=",
  transaction_lt: "48954497000001",
  transaction_now: 1725542663,
  transaction_aborted: false,
  response_destination: PEER_RAW,
  custom_payload: null,
  forward_ton_amount: "1",
  forward_payload: null,
  trace_id: "wXhHx7ut8dzwtMQlZRka1krvUghK8V6Vj78NtweFAgk=",
};

export const jettonOutTrace = {
  trace_id: jettonOut.trace_id,
  trace: {
    tx_hash: jettonSendTx.hash,
    in_msg_hash: jettonSendTx.in_msg.hash,
    children: [
      {
        tx_hash: jettonOut.transaction_hash,
        in_msg_hash: "8XFt8ApfGhsr/1B6YxFZLpVmWsTttIR4rvtkBusmQvQ=",
        children: [
          {
            tx_hash: "Ko+RkyaPKbCIRT0GRYaMj/vErnZO5dFliDRIR+5om+M=",
            in_msg_hash: "PILXENElDU3qeII7lcZhgLwoXh7tYW0J4a1nM4LODu8=",
            children: [{ tx_hash: excessRefundTx.hash, in_msg_hash: excessRefundTx.in_msg.hash }],
          },
        ],
      },
    ],
  },
  transactions: {
    [jettonSendTx.hash]: { account: OWNER_RAW, hash: jettonSendTx.hash, mc_block_seqno: 40170315 },
    [jettonOut.transaction_hash]: {
      account: OWNER_JETTON_WALLET_RAW,
      hash: jettonOut.transaction_hash,
      mc_block_seqno: 40170319,
    },
    "Ko+RkyaPKbCIRT0GRYaMj/vErnZO5dFliDRIR+5om+M=": {
      account: PEER_JETTON_WALLET_RAW,
      hash: "Ko+RkyaPKbCIRT0GRYaMj/vErnZO5dFliDRIR+5om+M=",
      mc_block_seqno: 40170323,
    },
    [excessRefundTx.hash]: {
      account: OWNER_RAW,
      hash: excessRefundTx.hash,
      mc_block_seqno: 40170325,
    },
  },
};

export const jettonInTrace = {
  trace_id: jettonIn.trace_id,
  trace: {
    tx_hash: jettonIn.trace_id,
    in_msg_hash: "4rn19825AhbJUkHmXnrjOBsp1+60RxhNXgkbBEsCN5o=",
    children: [
      {
        tx_hash: jettonIn.transaction_hash,
        in_msg_hash: "967vrGbMANkqO72SpltAI3InPvp2lUhGM3860TW4XGM=",
        children: [
          {
            tx_hash: "RacwkOQTm7aftPgHwjANGZuHl39NBAKmAAT/qKZgjzY=",
            in_msg_hash: "JtiPAK/7xOwvamXCTUkofb6s7RKaAUTNP3k7LaowaI8=",
            children: [{ tx_hash: jettonNotifyTx.hash, in_msg_hash: jettonNotifyTx.in_msg.hash }],
          },
        ],
      },
    ],
  },
  transactions: {
    [jettonIn.trace_id]: { account: PEER_RAW, hash: jettonIn.trace_id, mc_block_seqno: 40170267 },
    [jettonIn.transaction_hash]: {
      account: PEER_JETTON_WALLET_RAW,
      hash: jettonIn.transaction_hash,
      mc_block_seqno: 40170273,
    },
    "RacwkOQTm7aftPgHwjANGZuHl39NBAKmAAT/qKZgjzY=": {
      account: OWNER_JETTON_WALLET_RAW,
      hash: "RacwkOQTm7aftPgHwjANGZuHl39NBAKmAAT/qKZgjzY=",
      mc_block_seqno: 40170276,
    },
    [jettonNotifyTx.hash]: {
      account: OWNER_RAW,
      hash: jettonNotifyTx.hash,
      mc_block_seqno: 40170280,
    },
  },
};
