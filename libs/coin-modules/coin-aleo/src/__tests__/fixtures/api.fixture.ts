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

export const MOCK_ALEO_ADDRESS = "aleo1test123address456";

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
  sender_address: MOCK_ALEO_ADDRESS,
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

export const testnetViewKey = "AViewKey1jyaKC65RhaGN3b6h79hLdwTBk3YAMbRL1MMeCArLDJ6E";

// Integration tests fixtures
//
// testnetAddress/testnetViewKey point at the team's dedicated Aleo testnet seed account
// (small, controlled tx history — keeps `pnpm coin:aleo test-integ` fast and deterministic).
// All values below (tx ids, amounts, fees, block heights/hashes, decrypted recipients) are
// real chain data pulled from that account, not fabricated.
//
// Record scanner responses pad transaction_id/transition_id to a fixed width, so those fields
// keep their trailing spaces here verbatim — call sites .trim() them.

export const testnetAddress = "aleo1uhf67fhy46jvv5hadf586pkdarax6ppuzq8xtpk7jdk9hhujku8sfa39ml";
export const testnetLedgerAccountId = `js:2:aleo_testnet:${testnetAddress}:`;

// Inbound native transfer_public from a third party.
export const referenceTransferPublicTx = {
  id: "at1tywkrphxmm47ry8zrr30h27ae9st4lnza295mkgu0tgals2qlqpsy797ng",
  blockHash: "ab1t7s68spdt4qzrh2lrcv87za9ga8hhckxwrgnrhaxd025hmznr5rqdkn0f4",
  blockHeight: 18140205,
  sender: "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs",
  recipient: testnetAddress,
  value: 1000000,
  fee: 2725,
};

// Rejected self-transfer (sender === recipient === testnetAddress on credits.aleo, so it
// classifies as type "IN" — this account's only 2 Rejected txs are both self-transfers).
export const referenceFailedTransferPublicTx = {
  id: "at1v6ltk8nl59xygf47jkfzkky20jqcune2a8e9e7juw5ge4ksegg9sl92e4n",
  blockHash: "ab1ylkge4yau4n7apn3qn4cfnuxssc4um77tx60np8p37van80whcpsed6tny",
  blockHeight: 18140530,
  sender: testnetAddress,
  recipient: testnetAddress,
  value: 100977275,
  fee: 2725,
};

// Incoming private transfer_private (USAD token) from a third party.
export const testnetIncomingPrivateRecord1: AleoPrivateRecord = {
  block_height: 18140237,
  block_timestamp: 1784723374,
  commitment: "617000749956434394410612068854231617966302744000835069812024420526288185879field",
  function_name: "transfer_private",
  output_index: 2,
  owner: "4376890048891554766371961235062563625708746456629390535882860164705933280131field",
  program_name: "test_usad_stablecoin.aleo",
  record_ciphertext:
    "record1qvqspsaa5lnv4hzngdp3j9nupr99edtedhehexl9877dunqs4773t0cqqyrxzmt0w4h8ggcqqgqsq7u2z5zn49wg7dsfcmzrxgmyt9n7t28d89rzwr26v4n82vrk0vs8p53rnus9z2x0pdur4nqx933cwcg0laj72p0ycxvg4knd2hxldq9s03hs97",
  record_name: "Token",
  sender: "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs",
  spent: true,
  tag: "6536029625204622934622029539749775399091767334234898271579078276003642217007field",
  transaction_id: "at1tpm2ara52q2udq9adaga348wxsrvf8tukgg4mpk7hwm4rnm8l5yql3w8z9    ",
  transition_id: "au1p559t583kffcactwhpqzpsvur7x7fuh6eysvfft9jy5xcu4cpurqqcfu73    ",
  transaction_index: 0,
  transition_index: 0,
};

// Incoming private transfer_private (credits) from a third party.
export const testnetIncomingPrivateRecord2: AleoPrivateRecord = {
  block_height: 18140198,
  block_timestamp: 1784723235,
  commitment: "5393587348407548654408434195241212354951323226624605903120980321138262732639field",
  function_name: "transfer_private",
  output_index: 0,
  owner: "4376890048891554766371961235062563625708746456629390535882860164705933280131field",
  program_name: "credits.aleo",
  record_ciphertext:
    "record1qvqspfx56gdd3xpypzyjjy0cq3e6z6qsl567vnnvlfxasumdc2sdmsssqyxx66trwfhkxun9v35hguerqqpqzq93cul35wv4jdns30ge9kffdj4m8m7ns7wt3vkmd8dq65t6lapnp8psy84n4uzs5l9p3ljquqn2mxx58tcd4l6w7xducgkj33m00nkqsedw0n8",
  record_name: "credits",
  sender: "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs",
  spent: true,
  tag: "887468612124957275709993390220003380630741693066953074610446212632873805452field",
  transaction_id: "at14zv9mxgvv78w5r7v9mm9hpyjvj6hczq8g44fxvfmjhdvg5sp2q8s6ry6n9    ",
  transition_id: "au1kdmrtwa99w8fj94d23f8yhusezmwusjk83420pxpc63y5cvcusrsa3dsv9    ",
  transaction_index: 0,
  transition_index: 0,
};

// Change record from an outgoing transfer_private (credits) — testnetAddress sent 1
// microcredit out, kept 69999 back. Real decrypted recipient is a third party.
export const testnetOutgoingChangeRecord: AleoPrivateRecord = {
  block_height: 18140913,
  block_timestamp: 1784725777,
  commitment: "972283894715646643445412145796667731505755537305166732912653860904895591858field",
  function_name: "transfer_private",
  output_index: 1,
  owner: "4376890048891554766371961235062563625708746456629390535882860164705933280131field",
  program_name: "credits.aleo",
  record_ciphertext:
    "record1qvqsq58cqccdcscegwr0uwyztmfvd8x9c66wqzakly9dskmr2hes5wgwqyxx66trwfhkxun9v35hguerqqpqzq9ylrsar0xkdyz6hu5c6hnlwet8lkm2uqf88may3pv2qvz78fd3zqalyqrrtr27j5kgz6h3xxatpn20x3z8zcp9kkhxjwhh6e2a5pkpq9y6weg",
  record_name: "credits",
  sender: testnetAddress,
  spent: false,
  tag: "7049880475565599900269739447529902813115071775806317707080891849101393223250field",
  transaction_id: "at19p0dlt05nv06dnvk2wymd2denkke8kgzc7k5w8x6tzjk9rsamvysglmznk    ",
  transition_id: "au12wnhyuhhncshtsrdfw2nf0q0r3acx4hdtqsr0svsqzqn4hs54qzsdm9av3    ",
  transaction_index: 0,
  transition_index: 0,
};

// tag of the record consumed as the input to testnetOutgoingChangeRecord's transaction
export const testnetConsumedRecordTag =
  "2804102848750158300015081071011994354147556116878781998669735218310444038662field";

export const testnetPrivateRecord: AleoPrivateRecord = testnetOutgoingChangeRecord;

export const testnetSelfConversionTx: AleoPublicTransaction = {
  transaction_id: "at195ql6qgnjez6cmshd08axspr4wze8w3k93pydpml2qeqtrtf3ursn7aest",
  transition_id: "au1yty0yhkepee4h5vwunlrq34nxftw9m3q6kgyk822q79avh3ntqqs2zh6ay",
  transaction_status: "Accepted",
  block_number: 18140241,
  block_timestamp: "1784723386",
  function_id: "transfer_public_to_private",
  amount: 40000,
  sender_address: testnetAddress,
  recipient_address: "",
  program_id: "credits.aleo",
  fee: 2304,
  block_hash: "ab1rwtek42atm8f684w4rthcwhsvxen967gh0y9n49g3aqjcjfhyc9q047m2w",
};

export const testnetMatchingPrivateRecord: AleoPrivateRecord = {
  transaction_id: testnetSelfConversionTx.transaction_id,
  block_height: testnetSelfConversionTx.block_number,
  transition_index: 0,
  function_name: "transfer_public_to_private",
  sender: testnetAddress,
  record_ciphertext:
    "record1qvqsps7vj52rzarp5086axl2s9fd8aegt5xk9lzzc6hleul0j87a42s9qyxx66trwfhkxun9v35hguerqqpqzqql2ndz7nz7dph04pj2mzpecf6fnqlthzc02ds9kf4f4a4pq6q4pr78a7g8gvkwmm8h3kk0n77un9yll7xkluhdfvhtr24chwh0yg4pq3qfntn",
  program_name: "credits.aleo",
  block_timestamp: 1784723386,
  commitment: "5149004594992751980906412565011737332363200190257547267783655949005464254071field",
  output_index: 0,
  owner: testnetAddress,
  record_name: "credits",
  spent: true,
  tag: "7476707562559171997214599869656425013100816241248032462223077391492620471705field",
  transition_id: "au1yty0yhkepee4h5vwunlrq34nxftw9m3q6kgyk822q79avh3ntqqs2zh6ay",
  transaction_index: 0,
};

// sender_address is blank on-chain here (private input, not omitted data)
export const testnetInboundPrivateToPublicTx: AleoPublicTransaction = {
  transaction_id: "at1ru0pnp4djgdd4cxpmjsaqkzke9gcmx20ensxfk4pev6gylz4xs8spszpn6",
  transition_id: "au1h42kmls4srk6xdm4ze6dk7gmjca5z6ws4y0h9v48z2gs5h8zlypq27lyn2",
  transaction_status: "Accepted",
  block_number: 18140248,
  block_timestamp: "1784723415",
  function_id: "transfer_private_to_public",
  amount: 20000,
  sender_address: "",
  recipient_address: testnetAddress,
  program_id: "credits.aleo",
  fee: 2826,
  block_hash: "ab1mq5uh3m55asxehmp0p4w2d6tpjgckau0ne5rwercdkj2dzemrvzq4ezk0x",
};

export const TEST_TOKEN_PROGRAM_ID = "test_usad_stablecoin.aleo";

// Outgoing transfer_private_to_public (credits) — testnetAddress converts a private record to
// a THIRD PARTY's public balance (not itself). Exercises getTokenOutDetails's PRIVATE_TO_PUBLIC
// branch, which is program-agnostic (reads plaintext public inputs, no token-argument offset).
export const testnetOutgoingPrivateToPublicRecord: AleoPrivateRecord = {
  block_height: 18140930,
  block_timestamp: 1784725835,
  commitment: "3370831306241866899435465229889427783819801082442994275880252318917098679540field",
  function_name: "transfer_private_to_public",
  output_index: 0,
  owner: "4376890048891554766371961235062563625708746456629390535882860164705933280131field",
  program_name: "credits.aleo",
  record_ciphertext:
    "record1qvqsqhljy6pthjdz59jvvtaylhfe7gwqx8s58r5ezj9erxax3259grg0qyxx66trwfhkxun9v35hguerqqpqzqzh820wtusnaq579x4j2dt8ylcsr4vxd68xxq9ekaczmeg27yxkqj2f92ze7jr9pueenmuw046mrku0kp8rdntpq6ccqvk6pvkyzj2s7wzdzlt",
  record_name: "credits",
  sender: testnetAddress,
  spent: false,
  tag: "5193253143771075521166756894688973688732317086718207582571507084795422235795field",
  transaction_id: "at10jt4v3glr9pkrpndqclgasqa8ed4hu0gj7r3qujmqhmaekrv05qq5a6tsx    ",
  transition_id: "au1w9sl4j5g3fkajdz0s4c23qpl4tj055l9j47cxemuzlhfu588nsxstgafae    ",
  transaction_index: 0,
  transition_index: 0,
};

// Outgoing transfer_public_to_private (credits) where testnetAddress is the PUBLIC SENDER but
// the resulting private record is owned by a THIRD PARTY (no matching record in our own private
// history — decrypted via the sender's own view key). Exercises patchPublicOperations's
// "private record not found" branch.
export const testnetThirdPartyConversionTx: AleoPublicTransaction = {
  transaction_id: "at1jxfrgfn094jsj7qsqnn7acnzss0kj8avqa49uxwtkaexvj44cqxsnzrtfh",
  transition_id: "au16tnzsz3u5xtzxd0zmwdvx0j9mqw6vc3k93hg6gl9aqsyc8ges5xqfh4qn9",
  transaction_status: "Accepted",
  block_number: 18142836,
  block_timestamp: "1784732700",
  function_id: "transfer_public_to_private",
  amount: 1,
  sender_address: testnetAddress,
  recipient_address: "",
  program_id: "credits.aleo",
  fee: 2304,
  block_hash: "ab16ddsrma8tkgrhy070mr07ll2wx48tg5v6kj8vaqhgjftpkf7ev9sknjn0c",
};
// Real decrypted recipient (via testnetViewKey as the sender's own view key).
export const testnetThirdPartyRealRecipient =
  "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs";

// Change record from an outgoing fully-private (transfer_private, not private-to-public) TOKEN
// transfer — testnetAddress sends its whole 1u128 test_usad balance to a third party, keeping 0
// back. Exercises getTokenOutDetails's fully-private branch, which reads token-program argument
// offsets — a credits.aleo record cannot substitute here.
export const testnetOutgoingPrivateTokenRecord: AleoPrivateRecord = {
  block_height: 18142903,
  block_timestamp: 1784732952,
  commitment: "7697418092607833431542672676731397551535700112850932363436936462037048292936field",
  function_name: "transfer_private",
  output_index: 1,
  owner: "4376890048891554766371961235062563625708746456629390535882860164705933280131field",
  program_name: "test_usad_stablecoin.aleo",
  record_ciphertext:
    "record1qvqsqdn9cdhqrd2e742s59zyxyqljzj90yylsq82hlexw7n789dejqcxqyrxzmt0w4h8ggcqqgqspll4m395r8arplc3u8tfe27f74zyxfjaads7cf98apzwymrxnuc2066smls02l8csutd00mxayg95e2h5hstkk3k9r50jkh8jmqh7ygsgxksk0",
  record_name: "Token",
  sender: testnetAddress,
  spent: false,
  tag: "4392512920219901218231725864729520973094519988822818816129624829367585023809field",
  transaction_id: "at1dj2hj6pufrcrqfzuuetg26h2sntpecn7jfc3lddqkkr8n5w9nqfqpwj874    ",
  transition_id: "au1l7gtqkk8knrwhfml5zq9pql3w9ajgcns8hjkh7merq8tuh9xqcxq8c4906    ",
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
    },
  },
  broadcast_result: {
    status: "Accepted",
    status_code: 200,
  },
});
