import BigNumber from "bignumber.js";
import { PROGRAM_ID } from "../../constants";
import type { DelegatedProvingResponse } from "../../types";
import {
  AleoPrivateRecord,
  AleoPublicTransaction,
  AleoPublicTransactionDetailsResponse,
  AleoPublicTransactionsResponse,
  EnrichedPrivateRecord,
} from "../../types";

export const getMockedTransaction = (
  overrides?: Partial<AleoPublicTransaction>,
): AleoPublicTransaction => ({
  transaction_id: "at17l6zf5eykvvj45q9nwem2g06k2zujjtv929e2atff7j097lefuxqack93a",
  transition_id: "au1lz0t6x6nl45zryv9hhtmhuz9llkut2vxv2ajkellams68r2e9ygs5dhrhs",
  transaction_status: "Accepted",
  block_number: 100,
  block_hash: "ab1mockhash",
  block_timestamp: "1709079312",
  function_id: "transfer_public",
  amount: 10000000,
  fee: 1000,
  sender_address: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
  recipient_address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
  program_id: PROGRAM_ID.CREDITS,
  ...overrides,
});

export const getMockedTransactionDetails = (
  transactionId?: string,
  overrides?: Partial<AleoPublicTransactionDetailsResponse>,
): AleoPublicTransactionDetailsResponse => ({
  type: "execute",
  id: transactionId || "at1abc123def456",
  execution: {
    transitions: [
      {
        id: "au1xyz789",
        scm: "cm1abc",
        tcm: "cm1def",
        tpk: "tpk1ghi",
        inputs: [
          {
            id: "input1",
            type: "public",
            value: "100000000u64",
          },
        ],
        outputs: [
          {
            id: "output1",
            type: "future",
            value: "future_value",
          },
        ],
        program: "credits.aleo",
        function: "transfer_public",
      },
    ],
  },
  global_state_root: "sr1global123",
  proof: "proof1xyz",
  fee: {
    transition: {
      id: "au1fee789",
      scm: "cm1fee",
      tcm: "cm1fee2",
      tpk: "tpk1fee",
      inputs: [],
      outputs: [],
      program: "credits.aleo",
      function: "fee_public",
    },
  },
  fee_value: 5000000,
  block_height: 123456,
  block_hash: "ab1block123",
  block_timestamp: "1704110400",
  status: "Accepted",
  ...overrides,
});

export const getMockedSimpleTransactionDetails = (
  transactionId: string,
  overrides?: Partial<AleoPublicTransactionDetailsResponse>,
): AleoPublicTransactionDetailsResponse => ({
  type: "execute",
  id: transactionId,
  execution: { transitions: [] },
  global_state_root: "sr1",
  proof: "proof1",
  fee: {
    transition: {
      id: "au1fee",
      scm: "scm1",
      tcm: "tcm1",
      tpk: "tpk1",
      inputs: [
        {
          id: "input1",
          type: "public",
          value: "1000u64",
        },
      ],
      outputs: [],
      program: PROGRAM_ID.CREDITS,
      function: "fee_public",
    },
  },
  fee_value: 1000,
  block_height: 100,
  block_hash: "ab1mockhash",
  block_timestamp: "1709079312",
  status: "Accepted",
  ...overrides,
});

export const getMockedPublicTransaction = (
  overrides?: Partial<AleoPublicTransaction>,
): AleoPublicTransaction => ({
  transaction_id: "at1tx1",
  transition_id: "au1trans1",
  transaction_status: "Accepted",
  block_number: 123456,
  block_hash: "ab1block123",
  block_timestamp: "1704110400",
  function_id: "transfer_public",
  amount: 100000000,
  fee: 5000000,
  sender_address: "aleo1test123address456",
  recipient_address: "aleo1recipient123",
  program_id: "credits.aleo",
  ...overrides,
});

export const getMockedAccountPublicTransactions = (
  address: string,
  overrides?: Partial<AleoPublicTransactionsResponse>,
): AleoPublicTransactionsResponse => ({
  address,
  transactions: [
    {
      transaction_id: "at1tx1",
      transition_id: "au1trans1",
      transaction_status: "Accepted",
      block_number: 123456,
      block_hash: "ab1block123",
      block_timestamp: "1704110400",
      function_id: "transfer_public",
      amount: 100000000,
      fee: 5000000,
      sender_address: address,
      recipient_address: "aleo1recipient123",
      program_id: "credits.aleo",
    },
    {
      transaction_id: "at1tx2",
      transition_id: "au1trans2",
      transaction_status: "Accepted",
      block_number: 123457,
      block_hash: "ab1block124",
      block_timestamp: "1704114000",
      function_id: "transfer_public",
      amount: 50000000,
      fee: 5000000,
      sender_address: "aleo1sender456",
      recipient_address: address,
      program_id: "credits.aleo",
    },
  ],
  next_cursor: {
    block_number: 123457,
    transition_id: "au1trans2",
  },
  ...overrides,
});

type EnrichedPrivateRecordOverrides = Omit<
  Partial<EnrichedPrivateRecord>,
  "rawRecord" | "details"
> & {
  rawRecord?: Partial<AleoPrivateRecord>;
  details?: Partial<AleoPublicTransactionDetailsResponse>;
};

export function getMockedEnrichedPrivateRecord(
  overrides?: EnrichedPrivateRecordOverrides,
): EnrichedPrivateRecord {
  const { rawRecord, details, ...rest } = overrides ?? {};
  return {
    rawRecord: getMockedRecord(rawRecord),
    details: getMockedTransactionDetails(undefined, details),
    sender: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
    recipient: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
    value: new BigNumber(1000000),
    ...rest,
  };
}

export const testnetViewKey = "AViewKey1tTb4WYnMFnDWjSgTSA5VkiyLKNZH1szDcMyEuzSu1zbk";

// this record has `microcredits: "800000u64.private"` in the decrypted data
export const testnetPrivateRecord: AleoPrivateRecord = {
  block_height: 14192647,
  block_timestamp: 1770127220,
  commitment: "5577911026701224136131721605774668283349812508334064746703596134075753528694field",
  function_name: "transfer_public_to_private",
  output_index: 0,
  owner: "4061324383530370528773115724536366126386700749943799382889243452721616108297field",
  program_name: "credits.aleo",
  record_ciphertext:
    "record1qvqsps6wqrka73247spvsvdlgwr8qhmn5f4uze4t8zutp4k8mwm3zdgtqyxx66trwfhkxun9v35hguerqqpqzqrpdge64jwzyz32aknuxc800uugfwv52pqse4dk4p32datlzpd8z95td5t0dhdm4dfhtq9w285uj2arltzky4u6hmdv2xpdnkv365l3qg9hn0g",
  record_name: "credits",
  sender: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
  spent: false,
  tag: "4138557248634429596246575371443174357174703200753459213664031563822892655489field",
  transaction_id: "at144lgzzq73r38hx4jvtecxteg8v32creg2pxpazs9n4xcduu5jsfqv43lx9    ",
  transition_id: "au1mxddgfe8yl0yadjrm6qaz6wqljtlqth885muwxvrzvpd9852cyqqxhxr76    ",
  transaction_index: 0,
  transition_index: 0,
};

export const getMockedRecord = (overrides?: Partial<AleoPrivateRecord>): AleoPrivateRecord => ({
  transaction_id: "tx123",
  block_height: 100,
  transition_index: 0,
  function_name: "transfer_public_to_private",
  sender: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
  record_ciphertext: "record123",
  program_name: "credits.aleo",
  block_timestamp: 1704067200,
  commitment: "commitment123",
  output_index: 0,
  owner: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
  record_name: "record123",
  spent: false,
  tag: "tag123",
  transition_id: "transition123",
  transaction_index: 0,
  ...overrides,
});

export const getMockedAuthorization = (): Record<string, unknown> => ({
  authorization: {
    requests: [
      {
        signer: "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu",
        network: "1u16",
        program: "credits.aleo",
        function: "transfer_public",
        input_ids: [
          {
            type: "public",
            id: "4098992725749596564869311934968029096245262928677933129566487280083063273332field",
          },
          {
            type: "public",
            id: "1385198103466594101826154196289910735359400274223250555632416163314621190574field",
          },
        ],
        inputs: ["aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f", "10u64"],
        signature:
          "sign1rgt7klk40x06gqasyydf5jqulrauwgcvu9ttwex5qu8lrh7amvqdkf293t04kh5vq7xsnasgj2yp0k8a68q36fppkyxdqjk0l0d2wqk5er09f55fg4wjz6dayxwszm264t4mz9tdjec4pu5ucvgq4n5eppt40cd6lm35nhpf8luq6c4vgys7wr3t3caqa4uzgc2e867kcvhs5fpcses",
        sk_tag: "8115160536351008355141124506005930927967131632795198886526988339593498438837field",
        tvk: "1672173480612229538462541871567330128831945647015968646854121048305530532378field",
        tcm: "6823486252954433799460942415535496967644349169874297995951666919780741765222field",
        scm: "1776749354715494334310457559624744551235213946578457504740998023509329434634field",
      },
    ],
    transitions: [
      {
        id: "au1qrgg7vx9whhu2cq7ud7wsnaqnhq8jr89emmt0yk8qay0ydpjscpqsn3e02",
        program: "credits.aleo",
        function: "transfer_public",
        inputs: [
          {
            type: "public",
            id: "4098992725749596564869311934968029096245262928677933129566487280083063273332field",
            value: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
          },
          {
            type: "public",
            id: "1385198103466594101826154196289910735359400274223250555632416163314621190574field",
            value: "10u64",
          },
        ],
        outputs: [
          {
            type: "future",
            id: "3123006019915761195785555145709899823572693828940162537260329549227153324254field",
            value:
              "{\n  program_id: credits.aleo,\n  function_name: transfer_public,\n  arguments: [\n    aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu,\n    aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f,\n    10u64\n  ]\n}",
          },
        ],
        tpk: "7764125850448886273040234156875443919416887587140612382486271379906312044780group",
        tcm: "6823486252954433799460942415535496967644349169874297995951666919780741765222field",
        scm: "1776749354715494334310457559624744551235213946578457504740998023509329434634field",
      },
    ],
  },
  execution_id: "7287422539927885800585937944314327552710698933416219800491628782750554575326field",
});

export const getMockedFeeAuthorization = (): Record<string, unknown> => ({
  authorization: {
    requests: [
      {
        signer: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
        network: "1u16",
        program: "credits.aleo",
        function: "fee_public",
        input_ids: [
          {
            type: "public",
            id: "1431609535209309183030404533811811053747398593618844528144112561712812595447field",
          },
          {
            type: "public",
            id: "6014666578909833176004176041999901746972347055628838656758636702867768169472field",
          },
          {
            type: "public",
            id: "5961537024686402708074915534315148578305031571344928353928227780815745773741field",
          },
        ],
        inputs: [
          "500u64",
          "100u64",
          "7266375125414209082394925781071362722506946030314916664133746682226945366259field",
        ],
        signature:
          "sign1sjhh7qpt6ljldfx5pkqwkgtwxzar4jvt64yh7glqml3zrkp3jgpx9kepvhej0j987l3ql427zlkgfr00dj5u4tqa8errxd9c5sekkqa7xt9kx5sn0mrvrfwgt9n3jg9kemh77xfxlpj7v6kc72xae5kuq5cwlntzgc58lnj62tkgl68l2w6j3tu7hredjlw4qxmcpfj2n02q2ahjr9n",
        sk_tag: "7321693526939462750711914416056227149654156156320135336073058379082853202293field",
        tvk: "2040971550353843492256486630558564284502438990724136890292826124076602136955field",
        tcm: "1157849948078107775076315163259675511616617723638484129064242541999007243643field",
        scm: "761976293445430473830235139876967653559772718589481133493830138538449649579field",
      },
    ],
    transitions: [
      {
        id: "au1unqx5gh6638cpjsegf66dqgzurn909tmwq4j4a5x5n0qeayauyrsjdkuew",
        program: "credits.aleo",
        function: "fee_public",
        inputs: [
          {
            type: "public",
            id: "1431609535209309183030404533811811053747398593618844528144112561712812595447field",
            value: "500u64",
          },
          {
            type: "public",
            id: "6014666578909833176004176041999901746972347055628838656758636702867768169472field",
            value: "100u64",
          },
          {
            type: "public",
            id: "5961537024686402708074915534315148578305031571344928353928227780815745773741field",
            value:
              "7266375125414209082394925781071362722506946030314916664133746682226945366259field",
          },
        ],
        outputs: [
          {
            type: "future",
            id: "4320287993563049223738662647582433447401361996997712836733210769566270119675field",
            value:
              "{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f,\n    600u64\n  ]\n}",
          },
        ],
        tpk: "1935808257410140816406423492333141795975092948627492741537603678327659117164group",
        tcm: "1157849948078107775076315163259675511616617723638484129064242541999007243643field",
        scm: "761976293445430473830235139876967653559772718589481133493830138538449649579field",
      },
    ],
  },
  execution_id: "7287422539927885800585937944314327552710698933416219800491628782750554575326field",
});

export const getMockedDelegatedProvingResponse = (): DelegatedProvingResponse => ({
  transaction: {
    type: "execute",
    id: "at1tx_delegated_hash_123",
    execution: {
      transitions: [],
      global_state_root: "sr1root123",
      proof: "proof123",
      fee: {
        transition: {
          id: "au1fee123",
          program: "credits.aleo",
          function: "fee_public",
          inputs: [],
          outputs: [],
          tpk: "tpk1fee123",
          tcm: "tcm1fee123",
          scm: "scm1fee123",
        },
      },
      broadcast_result: "Accepted",
    },
  },
});
