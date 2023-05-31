import { AccountId } from "@hashgraph/sdk";
import network from "@ledgerhq/live-network/network";
import { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import { encodeOperationId } from "../../../operation";
import { base64ToUrlSafeBase64 } from "../utils";
import type { AccountInfo, Node } from "./types";

const getMirrorApiUrl = (): string => getEnv("API_HEDERA_MIRROR");

const fetch = (path) => {
  return network({
    method: "GET",
    url: `${getMirrorApiUrl()}${path}`,
  });
};

export interface Account {
  accountId: AccountId;
  balance: BigNumber;
}

export async function getAccountsForPublicKey(
  publicKey: string
): Promise<Account[]> {
  let r;
  try {
    r = await fetch(
      `/api/v1/accounts?account.publicKey=${publicKey}&balance=false`
    );
  } catch (e: any) {
    if (e.name === "LedgerAPI4xx") return [];
    throw e;
  }
  const rawAccounts = r.data.accounts;
  const accounts: Account[] = [];

  for (const raw of rawAccounts) {
    const accountBalance = await getAccountBalance(raw.account);

    accounts.push({
      accountId: AccountId.fromString(raw.account),
      balance: accountBalance.balance,
    });
  }

  return accounts;
}

interface HederaMirrorTransaction {
  transfers: HederaMirrorTransfer[];
  charged_tx_fee: string;
  transaction_hash: string;
  consensus_timestamp: string;
}

interface HederaMirrorTransfer {
  account: string;
  amount: number;
}

export async function getOperationsForAccount(
  ledgerAccountId: string,
  address: string,
  latestOperationTimestamp: string
): Promise<Operation[]> {
  const operations: Operation[] = [];
  let r = await fetch(
    `/api/v1/transactions?account.id=${address}&timestamp=gt:${latestOperationTimestamp}`
  );
  const rawOperations = r.data.transactions as HederaMirrorTransaction[];

  while (r.data.links.next) {
    r = await fetch(r.data.links.next);
    const newOperations = r.data.transactions as HederaMirrorTransaction[];
    rawOperations.push(...newOperations);
  }

  for (const raw of rawOperations) {
    const { consensus_timestamp } = raw;
    const timestamp = new Date(
      parseInt(consensus_timestamp.split(".")[0], 10) * 1000
    );
    const senders: string[] = [];
    const recipients: string[] = [];
    const fee = new BigNumber(raw.charged_tx_fee);
    let value = new BigNumber(0);
    let type: OperationType = "NONE";

    for (let i = raw.transfers.length - 1; i >= 0; i--) {
      const transfer = raw.transfers[i];
      const amount = new BigNumber(transfer.amount);
      const account = AccountId.fromString(transfer.account);

      if (transfer.account === address) {
        if (amount.isNegative()) {
          value = amount.abs();
          type = "OUT";
        } else {
          value = amount;
          type = "IN";
        }
      }

      if (amount.isNegative()) {
        senders.push(transfer.account);
      } else {
        if (account.shard.eq(0) && account.realm.eq(0)) {
          if (account.num.lt(100)) {
            // account is a node, only add to list if we have none
            if (recipients.length === 0) {
              recipients.push(transfer.account);
            }
          } else if (account.num.lt(1000)) {
            // account is a system account that is not a node
            // do NOT add
          } else {
            recipients.push(transfer.account);
          }
        } else {
          recipients.push(transfer.account);
        }
      }
    }

    // NOTE: earlier addresses are the "fee" addresses
    recipients.reverse();
    senders.reverse();

    const hash = base64ToUrlSafeBase64(raw.transaction_hash);

    operations.push({
      value,
      date: timestamp,
      // NOTE: there are no "blocks" in hedera
      // Set a value just so that it's considered confirmed according to isConfirmedOperation
      blockHeight: 5,
      blockHash: null,
      extra: {},
      fee,
      hash,
      recipients,
      senders,
      accountId: ledgerAccountId,
      id: encodeOperationId(ledgerAccountId, hash, type),
      type,
    });
  }

  return operations;
}

/**
 * Fetch account information for @param accountId
 * https://testnet.mirrornode.hedera.com/api/v1/docs/#/accounts/getAccountByIdOrAliasOrEvmAddress
 */
export async function getAccountInfo(accountId: string): Promise<AccountInfo> {
  const { data } = await fetch(`/api/v1/accounts/${accountId}`);

  return data;
}

/**
 * Fetch list of stake-able nodes.
 * https://testnet.mirrornode.hedera.com/api/v1/docs/#/network/getNetworkNodes
 */
export async function getNodeList(): Promise<Node[]> {
  // const nodeList: Node[] = [];
  // let r = await fetch("/api/v1/network/nodes");
  // nodeList.push(...r.data.nodes);

  // while (r.data.links.next) {
  //   r = await fetch(r.data.links.next);
  //   nodeList.push(...r.data.nodes);
  // }

  const nodeList = [
    {
      description: "Hosted by LG | Seoul, South Korea",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 0,
      node_account_id: "0.0.3",
      node_cert_hash:
        "0x34244d50a8ed4d4cbadf25620d1ab88a32081977d2f8d70ba82ba52b3305a4560824cf6b0106d635ed5c39272fffabe8",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181009098865def2f2ab376c7f0f738c1d87a27ac01afd008620c35cb6ebfcbb0c33003193a388c346d30231727012193bb76fd3004b864312c689ef5213cbb901101509deab94f26a732e637929da4c4cb32517e3adbb3811d50ac4c77c1fce8b651606215f34707f3e7265545e58c894609e28376bdb7775fe30439e0e1592fdcb0c3ee1c305773d072a6b8957eafce1a11be965edaff3843366cb6a44ec25a890106e6247567f76b550fda482baec6307d698ec88841fd66f23f210e47b8a9dcba6ba4e1fa716db33c80e30819496dcb5e5609fb6e7c615379bdded427e9231b9254c2baf943608a86d698ae9a3c8639df887d6f6b5a71385d24338d911a212bf71f1e2acc8b186b96ec8e69c86b6d058217776a09c9c68953edb5916578b5a263b2f469e3b0c07eada71a447eea7f8fc1bb8074255567b7f0bd1e6afb0358718c98b429e24b2298596fc76cf6af396ca9434d7926ec7d37d4b92af56d45feff8196095224a916c1ffe6b667e255fc3ac8cccef920dc044b25003132b87806742f0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "13.124.142.126",
          port: 50211,
        },
        {
          ip_address_v4: "13.124.142.126",
          port: 50212,
        },
        {
          ip_address_v4: "15.164.44.66",
          port: 50211,
        },
        {
          ip_address_v4: "15.164.44.66",
          port: 50212,
        },
        {
          ip_address_v4: "15.165.118.251",
          port: 50211,
        },
        {
          ip_address_v4: "15.165.118.251",
          port: 50212,
        },
        {
          ip_address_v4: "34.239.82.6",
          port: 50211,
        },
        {
          ip_address_v4: "34.239.82.6",
          port: 50212,
        },
        {
          ip_address_v4: "35.237.200.180",
          port: 50211,
        },
        {
          ip_address_v4: "35.237.200.180",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 51407806100000000,
      stake_rewarded: 61558650700000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Swirlds | North Carolina, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 1,
      node_account_id: "0.0.4",
      node_cert_hash:
        "0x01d173753810c0aae794ba72d5443c292e9ff962b01046220dd99f5816422696e0569c977e2f169e1e5688afc8f4aa16",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181009131aa368f9345229f97b6259cccaffea23e00cd5ead02e3f696c1e714ee3939dad860e38bf95a2974f9eb48e9343f8aac405ea955d05323e117b3b1c94813a3af42fe8082c3d43baf1bd4d8367e93db00ad696e627a1036ae534f011ead5e56f37a6ffe44b6b9e099401192ad560a0346b41a810095f5f2d7fd32d6eeb655ba758c6b526c129386af7197c7a53ae603d622832254961f16d0efa8079a768561888be733492217956bbcafaebb6135c5fbb2484d5b4a5fdf0336ac02e26c1652c1bd8eaf30dae1d6d3eb00f7b4fab8d6478fe8d95eb911df966a0dea4e522db76b8966570ecc5af09516424f0af5f8ee66e386d5650713997169ac37573bf52fd058de95ab2ff68e68111ab23405ea964b2bb88d02c0f1caed71ecdd4e4e408594876fdb8500bc55c7ba02066e05ab98d9f7e0466d9702eb57ee3722f8fcc85a75505ff3262170288b788723adb97e4de5620cc90ead1382fcd7571889fefb11e6771bc3f6f3feb19c7ac542878d03a90270526c3eed2494eff54e153ca9f6890203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "3.130.52.236",
          port: 50211,
        },
        {
          ip_address_v4: "3.130.52.236",
          port: 50212,
        },
        {
          ip_address_v4: "35.186.191.247",
          port: 50211,
        },
        {
          ip_address_v4: "35.186.191.247",
          port: 50212,
        },
      ],
      stake: 178571428571428580,
      stake_not_rewarded: 71994113400000000,
      stake_rewarded: 110513486600000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by FIS | Florida, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 2,
      node_account_id: "0.0.5",
      node_cert_hash:
        "0xe55c559975c1c9285c5262d6c94262287e5d501c66a0c770f0c9a88f7234e0435c5643e03664eb9c8ce2d9f94de717ec",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100b2ccac65ad0fc7645a817bfabc487ad7e41311e7a3198b37fb842d84c395b3f67d6bd848f10c6f03c290e8f7daa8d001a8441dc352a19160a3193e68b82edf19ae67693a9a33d4cb87e789a1070715515ea772caa8b86a569b91c5450835d9c354f0dacec97fe77091b45b147698b7f8601422dcd2261e928de4dac9c42dcbafdf96c07233ba3027076f37c969e8ed30b6b5d8f5034be7d92c596f8be861e51fcc3a242bf9d8be9e2a9e8e0f155ebcff23effa7cd57c10542811d80776c9585526fdb0eaa34ee1955d51119390fe873e4c04dedd29165884b98b46308788ae7fc4d4aa4a8fc9bc2674ba321493b624455ad410c1de71bc95d1d91fa0f201418a795e309eaf297b699bf27c9fa2763cd59ceb021e16b8200c1060f2817fd83cfc767183489461e3599291b380d6e939baa4b19232a6a272dde651f8046fdc34db276a777d6fb2bec3255b2cc244b4af566b105f30c6506ddae0eb3deddcf947bcb9c60e000984f3b4a8c6c4ed4bf90bc1932b7f94dc3ae6b360008eb902040f9b0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "107.155.64.98",
          port: 50211,
        },
        {
          ip_address_v4: "107.155.64.98",
          port: 50212,
        },
        {
          ip_address_v4: "23.111.186.250",
          port: 50211,
        },
        {
          ip_address_v4: "23.111.186.250",
          port: 50212,
        },
        {
          ip_address_v4: "3.18.18.254",
          port: 50211,
        },
        {
          ip_address_v4: "3.18.18.254",
          port: 50212,
        },
        {
          ip_address_v4: "35.192.2.25",
          port: 50211,
        },
        {
          ip_address_v4: "35.192.2.25",
          port: 50212,
        },
        {
          ip_address_v4: "74.50.117.35",
          port: 50211,
        },
        {
          ip_address_v4: "74.50.117.35",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 64664434700000000,
      stake_rewarded: 47169259700000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Wipro | Mumbai, India",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 3,
      node_account_id: "0.0.6",
      node_cert_hash:
        "0xb8707dd891621b10fce02bd6ea28773456f008b06b9da985ae2da1ad66be8237cf831fc5b8b4fea54595179e9735d5d2",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100a3e37b76c6cd5f6622d6924444d12c677c395f2b5902f3bb98b8a8b5055a707706ca028cd75060a2d8702d2d8b04947bdcfe0a8c141aa2844b1e06e66190012e8b6326ab0fa317973bc7cb4d2949f2108aa04c4b0c91baa5728f5b5622ec75abf578a1f7b41ede2a67ebd69c18e581fdf9c6020ac0de9ca2c31f0c6469003311fbb5ce7db49c787e1a7d27aa425ee7b84da7e66939f9c80d0e82fce55e02dfc8b5c78418a26aa43650698719bafcecf0bd49000addcfa405708bdbefbb19749d22dab007e44d45ea23b106f8834c152e25062d4cf24ff25356c7eb3729105393fb49bab904a02f0f0bb417cd919d352890128e6bbff4fac9f90de118a974f2a6dd01e032a79b178f60fa1fcbbd02b5704fb46295c15190816373edd6635c856978f1b9503f1f73b4b0be8aba2ed1feead59953bf82efde93a3471abd55cda3ba8a673fbb3799749fb006d003f0e63f665c3461d2a7b29dc8b204ba59a65668a46ae2878f00d1f9490df9e280febf4315ea04eaa568a3a9fd48c62c63b6ecda690203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "104.211.205.124",
          port: 50211,
        },
        {
          ip_address_v4: "104.211.205.124",
          port: 50212,
        },
        {
          ip_address_v4: "13.52.108.243",
          port: 50211,
        },
        {
          ip_address_v4: "13.52.108.243",
          port: 50212,
        },
        {
          ip_address_v4: "13.71.90.154",
          port: 50211,
        },
        {
          ip_address_v4: "13.71.90.154",
          port: 50212,
        },
        {
          ip_address_v4: "35.199.161.108",
          port: 50211,
        },
        {
          ip_address_v4: "35.199.161.108",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 106332830500000000,
      stake_rewarded: 2836583000000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Nomura | Tokyo, Japan",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 4,
      node_account_id: "0.0.7",
      node_cert_hash:
        "0xb8c3c9a1a6403aa556c4b96c89643925c981d5e83d29cafed79082e310e1eb4f15b569c79fdbc24160b891ec721fca37",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100c4561e3c278cd650e80c413ca44423c1c3c13cf1475f6f6976d597ae432b49ab42086b79b841326054b8b3dcf57d8fcd79bfc058183ca24cd4c1cbc574ed1117e2f5b7b3c63ce7b06d9b4efcf7375637b41fe6f53c811b9de6143f3a52957cdf956775120b33703ff57621407ab9575bc2d35c0d44f0983fc1ef63a4ff5209f070c92af106295601c96bced064ec190197019c6811c4c8dd80cb4f4ac71f9ad76e7ac89456fbf4f011f90abd2d90536e8234651f6bef927e3d5d8b7bf459050983beca3abef2a9d97af345772a7740e9699275b018ea0df286add6ce923ef908fbe762a75f21116862db44d3dca1d44b4d2e8dc1066c5006bb5a7d954ad255d4b603273475e511aeb485d069a067c0ab5c24538c933c06b5a6aefa94005c2915213e4ccdae6c942f6272f9dd5282d6b890f1f20efd2399cd674924fa57046ac6da32e73951a73113e91fc2b7ff29e4851b83ff39f83ba9ec6f08cefdbb6cbbbffabfdfaa91d930f7200da48137c394cbd13e701ecdc2616fd21bad681aa4f0010203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "3.114.54.4",
          port: 50211,
        },
        {
          ip_address_v4: "3.114.54.4",
          port: 50212,
        },
        {
          ip_address_v4: "35.203.82.240",
          port: 50211,
        },
        {
          ip_address_v4: "35.203.82.240",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 104842053400000000,
      stake_rewarded: 4140381300000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Google | Helsinki, Finland",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 5,
      node_account_id: "0.0.8",
      node_cert_hash:
        "0x4a44dbafd50dce9e19ae6595efcf27badfe79db88f0e291c32b03c0ffc96830b391c143114611255f5a76e4a33ba0319",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100a1c4077154303cc72c4fb7692c3f94251bdec1239a1f7a8972abe91a35323fbeca625a7ffae6406c855dc2af2110900b0df0e6e6db76364dfa1ffe85eda567936e2985b85634a32aa52a6599dd6c30be1f7a6c5b8f5eecaf2621d8a459682fcd2dbaad1561d11f33fccb7f5500ac568d165dbeaace3286d2894f64129d781d6c72fd7d599c9e1d3af4aa433c23b910fae4c4841641f61526ad787ebea539874167e9d3a73cc0fb156429d15ec763a6d0f06115a79b9af783d77b98d83096aa4743f97408d9e14bcf4ddffe4591768847b40cb8da7ca375256d2b935d095fe252fae81ff6e37f84d7a90d7e570a4f8ef3c7d766eeda472f0920199015a8908259a873c5454fcbbdcad2e528de85455b4083c7dc4adc5a988e0cddfdc159d5d712abd544aa73ec029089814c98a44f26fc0644659c183e3184aa272f8d1dc0bfa3e0a560484cb055ba4dbb5cc339ec80bd11d642dc3a702e8c703ab2193084d9bd63f0dfe12a433c2576eaf781cfad867ef70bda61768b2bef14f50c6c3b8b096f0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "35.183.66.150",
          port: 50211,
        },
        {
          ip_address_v4: "35.183.66.150",
          port: 50212,
        },
        {
          ip_address_v4: "35.236.5.219",
          port: 50211,
        },
        {
          ip_address_v4: "35.236.5.219",
          port: 50212,
        },
      ],
      stake: 178571428571428580,
      stake_not_rewarded: 78565154400000000,
      stake_rewarded: 104397212600000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Zain Group | Kuwait City, Kuwait",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 6,
      node_account_id: "0.0.9",
      node_cert_hash:
        "0x9281f9a1f057e9de66fac4432cb13b102d90d5cc5ea787487f71403cb62aa809976f65cc3b5eda38a1c33a719b46b303",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a028201810093a215cc4a7a722cae9c13abd636df99cceec6af9db46b69fa516716ef50ce2490a981e09ab019ca2cb46811b5b619d1bd1d5ee6f46a42c777cbdee642a1484ecdf5ddd3729642c38c6d43a8858874475f5824443664c04dfed9b89045fb085e25c3efcb4841733eff7c529c139e69350c2cd79b2c8d19679a712e4e8cafd3267541b832b3e10a01255def69df1e9d3b8d8eaf0311de67d5e12b26dd01dbbd9d3e42d35d9de271302e0f1f69d87cbc7aca9e8867e9d428d3cab0666eb490d5fbab30bff3f785d03f2072a43bb9b5e54656a592cb61eafd5a5ef284c7caec66f7f47325cc0d4c1d27f661d8a748ca5071c06ef134dff96f4086688366d468a24780017e0b56aba7fab43b3b7c0b77906fae5482f32811c292e6b14454e14b894801a86a03cc47794dd0d74527a72e424ed3afa04899ecb9a63f2a9ae72be7fa989adf0d65a32c851d9801fc41048df33564fc7b31707ec8fb80140fe7b7a1fa120ba1cb660324ceffb4bcc2d9bb7de0cf54c819f2dd3bceadec9c25f5e19dc9b10203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "35.181.158.250",
          port: 50211,
        },
        {
          ip_address_v4: "35.181.158.250",
          port: 50212,
        },
        {
          ip_address_v4: "35.197.192.225",
          port: 50211,
        },
        {
          ip_address_v4: "35.197.192.225",
          port: 50212,
        },
      ],
      stake: 132211538461538460,
      stake_not_rewarded: 118007937800000000,
      stake_rewarded: 1107807600000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Magalu | São Paulo, Brazil",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 7,
      node_account_id: "0.0.10",
      node_cert_hash:
        "0x74bccc94033896aa45945458b883b98143f3d261021bde847675c5c7b0d0f6916defdcd88f2079086a21f6d63547091e",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100c57edb9ff276e023b28021cb1d87cdf1966b698cf48e4eaaa7c692077ceee8ccb239a4c921597e8e89f7cc05d3f3131578976c4e314405d4a4e03a72410c5c09ca527ad5a85b998637e72a32e1fbc0d5546b2465e9e806c2dd509eb050ab5fb27063fd92815b1dd2689e2111caeb6f549e94a9f00f0821d4ca6c6a6117f5a533c9263bf074a30d5cbef50d1c8c2387bca972ededa0983b5d0a6b57dcb0020006828b40e4076b4870b24bad84056ee52b5f422e8840028c25006382d8e9c661225f4f76ea72e340607e9fc6f3c20433076a1ca8cb15ed03ac8966d0507bcde681e4e0231ee9f87d111e7b48ac8f94d2d842b52df73f573cc5414964797c626968ffae7418f3b6109b5a0f09e3223f4a4d5e3509dd250138f6bc17bf6cece17594430df180a38e90adf2affbfad0c6b8c1b87f178a061dcfbff8b92c9166d874c1ff5af4fbcdbfe8e9d099370ddf60be747633d36ee4eb5cd51f6e3c339e151e41bdb5a5ce2c8c97a0a43b3cd4cc081884c879f9d2f3748428c8573f17c90f3cbd0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "177.154.62.234",
          port: 50211,
        },
        {
          ip_address_v4: "177.154.62.234",
          port: 50212,
        },
        {
          ip_address_v4: "3.248.27.48",
          port: 50211,
        },
        {
          ip_address_v4: "3.248.27.48",
          port: 50212,
        },
        {
          ip_address_v4: "35.242.233.154",
          port: 50211,
        },
        {
          ip_address_v4: "35.242.233.154",
          port: 50212,
        },
      ],
      stake: 121909340659340660,
      stake_not_rewarded: 60259160900000000,
      stake_rewarded: 47753360500000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Boeing | Toronto, Canada",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 8,
      node_account_id: "0.0.11",
      node_cert_hash:
        "0x7031f1541dbd7b6fe7da70240265820d37f7c529a93348f50d78421b18797e7b15cde7d0e5f057c884b87d093e7d38f5",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181009bdd8e84fadaa3532fc4ce01a8a17d4c3b232f50a9790e262684edc4823e815a1bd5b20ecea7bf56e29f6bb7b831fb3bf6efcd1475f0b8ed5ffb0b1385b96d166b629f0396a8fef5f06e4bca25ee4a1340ee263a4d9bb020d8f472306f3d886138de7a019e059bd0afc902ccba1a213ae2daa60c8a013755fe0a48e034f5b4023a2dadeaa88c54868353ac7a7a3df12b2fb6418774e9b14be6eab8cc27b88012ad6162da74e0eeb16135905f437374dab8586d750a26bbd3ac24aed878c4d53e651072c871e94d7acc575c967381734a53feaf4d7ba6bcdd241cc6458c6087d86302aa251c04f6d56b9c32d7d96624750ed055785d0773f43dc099b28c92281148e6c81f297ff9d166e000ac04b3124186775fcef75f5eba0c1032bf130df6cd7a46211d0df3e0584d92ea67349d8490508eb4ef88f54c8c3d486de8719f10fa96feb85cc796076ca781318ee2d9ed903ca1336040c59ad91a4d2f698e9108ae0edb9b1cb95ad33b197ffb18bd1ba8b56cbee2aae9585ece208a1e14b48564630203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "13.53.119.185",
          port: 50211,
        },
        {
          ip_address_v4: "13.53.119.185",
          port: 50212,
        },
        {
          ip_address_v4: "35.240.118.96",
          port: 50211,
        },
        {
          ip_address_v4: "35.240.118.96",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 103876849800000000,
      stake_rewarded: 9968354400000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by DLA Piper | London, UK",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 9,
      node_account_id: "0.0.12",
      node_cert_hash:
        "0x200cdbe854f985aa6d6bd159a24a034eabe90d838a8480f8fb0e6e92eb5c57be2ecbe54a32c71ae4f971e3c36f2f70c9",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a028201810090259f4e3d9f0f394256548e9c7308b10b73403cc9094d97ad151b7706170b9772ceb64d662ecef901a8d7d15d319a59c8b71071accd895b7c93610dc6976f67c4e1729ba8373ab7e52a3f3c8f265491dde69d6e0999470e7445981131bd96c36e6865203fb2ebd5d50eadafb726396dec1d9174898b4e9be04c74d304feadd9cbd3234c3b7f3306c99cb0c339fc25969b41d58a2b7cfc1832e226d81c1963993e2255a087d1698c03d4210bd64580644d095ca76aa1794edd40c1c87b5f82a8e39f603e97116ba04578e7e80346495d785d4ef7cf7714b9eb6f5f9e0b9a94f4b73884619b9274d4a95ef15754a89d97ef5c1a88b6d693e0a80ebd537fc9cf0ca91d1c62d915de7ed818b952e64c200293ee8e284a416a72a3e12fc7d423b158f9b49660cbc2466fbed0fed2e24e102fde942eb4cfd94bec46d3d90fc08c39fecba03e0ca2464ae664b979515ba29e1f702c3fe702be793796d8edb17aa48c09290b024549f0611f5ae23ed7e16442df7d1dad2286c2bb09d5522dd3ed698c2f0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "170.187.184.238",
          port: 50211,
        },
        {
          ip_address_v4: "170.187.184.238",
          port: 50212,
        },
        {
          ip_address_v4: "35.177.162.180",
          port: 50211,
        },
        {
          ip_address_v4: "35.177.162.180",
          port: 50212,
        },
        {
          ip_address_v4: "35.204.86.32",
          port: 50211,
        },
        {
          ip_address_v4: "35.204.86.32",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 97738752900000000,
      stake_rewarded: 12267349600000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Tata Communications | California, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 10,
      node_account_id: "0.0.13",
      node_cert_hash:
        "0x07b77ce284f7ebb5beb07b105375af55d228a765e1a84587eb1d1f1b0675c38a1d1512370e56f21c8ed5eadefb3779a9",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a028201810082de73065f34ffc29340d5949d2220b1e4366ed5cf7c6ebd616cf9416a53ea0017f6bb116bfd3f3defcc15b7a4ddf0e44d02fe695688053e79a770e201bcf7193390039ee8f086d4fa746c7e056918301f9b5e84e39262828085a79b322bca0b5d85fe97221a26bbde258c620f0dcea02ab1edd16cc49a3f2ab9288e3dd1f37dc4b6a6f7133ff92e541c71b70d2a2f66d55725ab18bf86d009ec3d24f5d12e0b5e6802d1151372d4b764ebecb4af82f649485ec57b5a01dc67958f5a03ccaab7cba9354a17372c1316ba47c953aaf94901b3f8c24e6a3afd6758e7f3b143ce2dd3cb071b2a74c921cee949a4b5a6be879f1c790a6b8d63b192d7ee29a9491fdd689a98c0a7c3d60320f1b4ac2d6229dfd94e42f3a6048a76be1eb958c8a1873be8d338aec9fc59ab7f37626789402c1fd595f19087575e0be827fc4c0a4fb3d393ad74a949cc986bfb64cabddae53935f6dc56074db93d77ea3b816bdd6be534497272289859ff34ce51860affb621d10487dc3843f1f86d54034a63e48a1a0d0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "34.215.192.104",
          port: 50211,
        },
        {
          ip_address_v4: "34.215.192.104",
          port: 50212,
        },
        {
          ip_address_v4: "35.234.132.107",
          port: 50211,
        },
        {
          ip_address_v4: "35.234.132.107",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 103818441300000000,
      stake_rewarded: 5358570200000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by IBM | Washington, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 11,
      node_account_id: "0.0.14",
      node_cert_hash:
        "0x50afa448a3a78b615f49fef577bd7b62b13082eb552cf8895109e0e5438f79ac8aed2f2a48e2f570490746f4c439104b",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a028201810098755a408b5321e263052000d6d7d4a2c3a554d5e1384a9cb5ebf474ae882c63b486bd08d144ddf1a94ce9a7d6251963006afdaac458846f17640195fe2539a656930efa854f2148e68ec1a08c1c49d200c3f3045fe7147f06d534c4bd262100cb1dd39739d760d81a0bd20f83f255d2507d4ccb1106b53618c6a94409c887cae262d4cee9c86232147cec1404e0c57bba7317130ee39643888af3d598edd82b8c61e65ae81a4e1a56bc06d397143a98d41ca87d3ef433ef0aeab6801191b3e38480968f66b6e88662af45a9e212994f68b288eb967beb98478c243e2136c1a1591f061f5bc04b21ff2ba48b29f18431088873bdfe99f8a52e9408971856e804dea602a311786c985652963c3a3770329b409f74fdfc746b22a5f8418912071c4ce846c9b4b320fedf6e9b64e2cbe384f9a82b6aaad4b20907431df1a33f69207a565600be81070d0832900995859a4498d5b59315bcebefee807eb0a3a942f1cdf3367dd4444fdb29886efcdd0be4abe9a188803953875eda33db72989f763b0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "35.236.2.27",
          port: 50211,
        },
        {
          ip_address_v4: "35.236.2.27",
          port: 50212,
        },
        {
          ip_address_v4: "52.8.21.141",
          port: 50211,
        },
        {
          ip_address_v4: "52.8.21.141",
          port: 50212,
        },
      ],
      stake: 121909340659340660,
      stake_not_rewarded: 96241711700000000,
      stake_rewarded: 12561598800000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Deutsche Telekom | Berlin, Germany",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 12,
      node_account_id: "0.0.15",
      node_cert_hash:
        "0xc6713d87e3c1f6859a3a3663ebb1b7e1bd1da14fcf076ce51d36464b5682a5df7cfadd440197564f498842313091c2bd",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100a9db7f8baa126898fab789115a3b5d89744f197e28041ae098f3e886c69871721e11bb0ad11f3ce9124aa961d6a0dc845f49765c3fab19958402676f564462bf281dba5588780f03e905798e184269aaa60f7a1472331e2fb1deadd877c84cbcb641ca9e5c8ad6e45bc159cb079fcb0d449cdcd8d9239c1a047e7b448da0cdca26610a25f296d96e7469b676d4a444516e7a59e85293a8086f840c052854e02a8cb2002dad35825be4d83b52fa91e8c73ff049746148862787c1118f924d31cbac1b44feff22d436b3979eadf9b43a4bfa72e15b4755fcab260e06a279c3bb73bc7f16a060d4d522fd490580388aa595d8044736e522f6424915f7803b7583e095cdf78c32519697de81b89fb50054753b1a17f9aafb064d84c992f9ab11ccbc8cb10814dcaf5264aa45f21bdefac82ccacaaf358e31373ee1ba4e7402fd8a70ea0c28ca5cc74dc42510c969cd2c459b1ec3688a01ea39a992710cd2297c98a84b6348a577804fdc234d3fe1903e2c21e172da28b59ae6e4c7e8edd8b71c49d70203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "3.121.238.26",
          port: 50211,
        },
        {
          ip_address_v4: "3.121.238.26",
          port: 50212,
        },
        {
          ip_address_v4: "35.228.11.53",
          port: 50211,
        },
        {
          ip_address_v4: "35.228.11.53",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 105612170300000000,
      stake_rewarded: 3951063300000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by UCL | London, UK",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 13,
      node_account_id: "0.0.16",
      node_cert_hash:
        "0xa53c8eb70bdd89edb6be5fec50cfabc081002a477af478eefa355ea6ee572e4ae50e84988f8ea2c068afa78967b2caf0",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100a8ceac367eb1f1de5f0d9ef3eaf0df9b98448fe20808476562a060c51c289770b4cacfe92cb65569823e962c2a2c9fed53bd36ca3a122de1c525a582f25a4d7d628c1a3d5bdb8936aece7510e7554ee7033025c092c828eeb5738be02ed963da81a59205634ce9454577ab82f40f13f1ee55e0ae727e23c30284b1f44b99ace4ddc5f9ac7ad88d9fa2255935b24dcba8400642e16cf2532c0b0d6892904608715c4076f46d84a0e0fed36e76ccdc96355e7a26160945c2b54ae26cc00fd082326346eeeea7dd75f91911e99dbcb99ea4ac6ba056c33228d881d85831d9cc879593da1746dd0ee95dc2b96fe93bafcff2cd7d92958d78df33f205d7115ed9fac4db6f4cc60e56a5441da5b5b55fa5999902e958a6b6c44d810ddc56181241b87f22f059a6880e8021736d01897db65449ce817a2375d03551cb0de507c609a0c8030ecf4bfdeb213c03daa764a1821b724334f71f768d7aecb277052a7033765f07218056c78f2a87af18386d8f61a5cfcb3f2ba4dd59915f13d38634d16957570203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "18.157.223.230",
          port: 50211,
        },
        {
          ip_address_v4: "18.157.223.230",
          port: 50212,
        },
        {
          ip_address_v4: "34.91.181.183",
          port: 50211,
        },
        {
          ip_address_v4: "34.91.181.183",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 107165675600000000,
      stake_rewarded: 2423892800000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by Avery Dennison | Pennsylvania, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 14,
      node_account_id: "0.0.17",
      node_cert_hash:
        "0xb5b28e6f57240730cda802c56e53b8837a7d63dab9b3b3ab156a04d9e2e6e24b6790c38a5fd335be67a951b77beec748",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100af0b914257bf7a4655c4a50d0cad5e0a1e4581ed6623f0e8730f796b8f29c58178bccc6932c1fc31f39ef44b82d3c43b398737373fecb1295228a04fd50a14f3646d84fe1f467caeb98d463e2975e995b8d2e1e39f3bf6addc25ae35d65d02608e0345537966e2abce49b814bead3c1b757174ae30c00b0c43e99b80496b72d3c131f1c6e4fcda05f28117ef9e28c4303be4d8c7e042d58b83cc121945a2c65e7962caa9185938f3757df7cca95cf02b5e31944a3a619a0ac3f1e34b9b013d4c224c4f1e70fd9fd36983ef86ade518362cc8322c0f7b61a9ac75fb82e7b86d68bc0f099a09a14cac5a1d8d38f9a8a70cc37ff5cc3bbd2742ffd146255c171e6a178083271dce0fde681ed492cb59b0796d270175838dc5908107e3a6ea3f9a406b3d1130ccec3b4791e49bbc231603b46ab2d0f93d43be75ab9a4d710ea940e285a7b153b0ca7cddee6d9dce0ad8350c41d90c215b9588515afa0ac3365ae07e81f3bbb36bdbeac4b31bcb1aa4e82565b977f9dad85d626eef9aaa9ef8d7e3fb0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "18.232.251.19",
          port: 50211,
        },
        {
          ip_address_v4: "18.232.251.19",
          port: 50212,
        },
        {
          ip_address_v4: "34.86.212.247",
          port: 50211,
        },
        {
          ip_address_v4: "34.86.212.247",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 92032131600000000,
      stake_rewarded: 17857035700000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for Dentons | Frankfurt, DE",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 15,
      node_account_id: "0.0.18",
      node_cert_hash:
        "0xeb976995e5d2a9da69c44b06df3c29ecca5eba5008f054077c0ee87b08813314c4fd91ec834d3b868fb7ee7794f4cbeb",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181008c07be305ad60b90ba2dab39b0ee7760e1a22f857522540d70b03b3f9e4875a3a29ab08088f144f57eb252e46ba59385d0e6d4270117da0abc1b3b80694c9a5058b86d61dfa06e716709c88e8feac7c3a0e1d25fc0aebf6a8f76fcb99f845fe181461cab6858b97c3a4027fb3712b14e6c0789de17d41764577e511417eb162692eb07ae1e7355235e9bb439047b6c01613782e7dd6f604daa4674661d53961f46c3faa6b7e76762d373b5b542b79ea963efbf33ac68198bb2b661cff676916ef372ad4c26c216c4bc4787c84ec32d184d77c75186c09cf3d9f91433ca9853119bab31fa6ad26f453e596d9bdeca68a5769bc8fee7a535d80c8c6f3efb1dfb288ab6a979854b7ce83124ec0d102aff94c3b74f9c378958c25eb933dd53c1e805a18654d6d9186990f6570429f960f34e8b4f7fd9972dcbfe9240e074da2d355a5f7ef9c1af62ef5982a8174578b9c15c49ec566bdacb30ccfcef09cdfe708ad487424e9c1be653f9ee7660e7d942c1efa5da286e1addab06a9a33f9de946795b0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "139.162.156.222",
          port: 50211,
        },
        {
          ip_address_v4: "139.162.156.222",
          port: 50212,
        },
        {
          ip_address_v4: "141.94.175.187",
          port: 50211,
        },
        {
          ip_address_v4: "141.94.175.187",
          port: 50212,
        },
        {
          ip_address_v4: "172.104.150.132",
          port: 50211,
        },
        {
          ip_address_v4: "172.104.150.132",
          port: 50212,
        },
        {
          ip_address_v4: "172.105.247.67",
          port: 50211,
        },
        {
          ip_address_v4: "172.105.247.67",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 82998554800000000,
      stake_rewarded: 26094704000000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for Standard Bank | Warsaw, Poland",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 16,
      node_account_id: "0.0.19",
      node_cert_hash:
        "0xd5ce6f4378d6d547239486efd6a702a74fca9e965723f0ea43eefa32be98179508c42185fa23750d20e8c0f1ca1d563a",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100be17c99647cec65a44407b535856b3c3baef5b54f565af58b8456ba8c7ce535d5ac72c61c44c76b3c57c8e864841637be10a83cfe39c092476d0dbe4d6cdcdcd720a30b5bfeb51a01a18f582c45f6c86993fcf7df182935de1d86906044dcf35186935d9bd7eea7952352bebb4ef9ae0f7661e70a4237afa98996687ca48fcfc5b00d3807f054be0fa8c3bfa425038be6ef295164f22f73b7e88c94ea9be8aa4f3a245c89b9d1fd5192f7a50b958b2ef8104b36f1bf8fd2cfb28c1421800c1c47e4ef98af150070cc6d69d17e8eb92f18a6aa1a65266a495238d103f8f695b57ecf373650a052008745721bea815627967c8076365df8c4c7a7d4dd8f2c3850c18fba71eb60e6e8dfbd196e0537fd70b344ecbcc530dfc83da6fedf49d51a90419502ba9d70cd35f1cf3c0694e2354f9064fdbf535eb23c27c0a43d0b78c1f867c61d98695d8def7bc2a10bb6674c22f66aab0a91813ddf27cdb852c59ef79e1b9e1a075fa6ee27a7e3774dbf4b26465427e6d5ab91fe7f0f3a71784eca182b50203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "13.244.166.210",
          port: 50211,
        },
        {
          ip_address_v4: "13.244.166.210",
          port: 50212,
        },
        {
          ip_address_v4: "13.246.51.42",
          port: 50211,
        },
        {
          ip_address_v4: "13.246.51.42",
          port: 50212,
        },
        {
          ip_address_v4: "18.168.4.59",
          port: 50211,
        },
        {
          ip_address_v4: "18.168.4.59",
          port: 50212,
        },
        {
          ip_address_v4: "34.89.87.138",
          port: 50211,
        },
        {
          ip_address_v4: "34.89.87.138",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 98088478000000000,
      stake_rewarded: 10932273500000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by eftpos | Sydney, Australia",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 17,
      node_account_id: "0.0.20",
      node_cert_hash:
        "0xb0d760b75396bd80292cf751dc43832a01426fc79e2940aa9d2839525ffda1db04bd47d4e2ed3b46088373800504ce13",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100a5ad2b7643a04c055d2f8cd2511b15139fc45575621388e49c119b2f398aca110f61396b0c866de5063522bb8540273e13f6d94ce1e60438f6afb00aaa64612f7145e9bce8bc1a53b941913aa76c9f3a2833fad7cf285c7ac2d37f99f3c2cdb49de4d151e61678564f281f541424b41fa7c51b2a9602283c7d32ee00eb838da15c38afc96e061d97cede22165ff1aa959f1c4275b2d098c40586a5579fbb3cb90072704120a8a66a5270f4fcfd1086c923690a35e7fd445e33ac03f139c6868556570cdc4aaf22107a6c1a442456a7c6c79ee04090e7e5d4f66bca60ca1f47b6dfb543dac3cbf19a7719a8f55b6f83b4a3b8a66d60256d0a46551fa7024bd05631b8a5580877254c2f2f268cdc33d2dbbcfb733e9fbe233bb9cb59ab31a0148b23e8c42680ff10af4c79a4d08346fb79a93d9629548eaf1bb124698faefa4cdd72442c03a04b733432f748903a325c283d456ab9ae921ae7ed3391e5d1787efdc23540a7b85c691ae870a07f90b11c13b32ce43eaed15b369685ce49177cc9850203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "34.82.78.255",
          port: 50211,
        },
        {
          ip_address_v4: "34.82.78.255",
          port: 50212,
        },
        {
          ip_address_v4: "52.39.162.216",
          port: 50211,
        },
        {
          ip_address_v4: "52.39.162.216",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 102894299700000000,
      stake_rewarded: 7278258400000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by EDF | Paris, France",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 18,
      node_account_id: "0.0.21",
      node_cert_hash:
        "0xc32b80403febe31c4ba1eb46cfa93cbc9169f28597a30ca01365cb3e179672a755a38450ce6aaabf40ad9e36048fd8d4",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181008d45c21c0c95ef65a029d52c957fd0f85f20123da034e61671ddee5475f07382a66c66cb4dc50504ddfd37581083df8d1757730ed8d6f364df4c36a2651591955da201a2407fa8ab9b2313811225a0da230fbe380e090aa56efa4f202ec9b4823f6501d96ac698ebf26aacf3ee2d1f32a721c947e1076cf35b373da1d87a36a152e00e71011792282e825ff171c5833b88570bfc6da8449e6f95f8b1265ab555194031553d1d576f93c42c0ca60aabac4c8dd162d8114f2b21511583c72539fe56c499a929de3a40a0d45c17c589c2d7988ce26eafc92a3d37b7ea0042d43e03afa6271b26255a6cccfae5371821d81e0b05c250b59f0a90741a0e0e88a09ed56c5b9780d095f0906f0b81d51263982aae01136c072d844a11d6da4b2a61c644e1ab17f16ff48ee23fede8452f1e42e2d30a0790c25d42060e1d44a671a2eb23d114f68c71e33f176db58a68b430054bc1d2983a23a32ea6ff95fa7c4d8e380eb296e98b7968ecf8454d817c737eea5dd921eb86c16c7b29304a4a7ecbe5a3a10203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "13.36.123.209",
          port: 50211,
        },
        {
          ip_address_v4: "13.36.123.209",
          port: 50212,
        },
        {
          ip_address_v4: "34.76.140.109",
          port: 50211,
        },
        {
          ip_address_v4: "34.76.140.109",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 93391268800000000,
      stake_rewarded: 15907145400000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for Shinhan Bank | Seoul, South Korea",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 19,
      node_account_id: "0.0.22",
      node_cert_hash:
        "0x73d89b53f7cc1ec674af28ad521faf08d7a018166469efc845154ac41108a9d8129a8830031a19a5751a2d79cbc47520",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100b05abe2ab00fdd06c955e86710b0e06f1a92624a48ad1cbc8dfc6f2212962b0c30fdbd284a37c5a37658b63c36ea8162561a8e4f946cbe5722c028801f0f281c70f8d88c7c00a2f2e29f597b799869ed8356df57c47be9944a2aaff650f9b4bba0dbc53dc880fdbb69ea451905d2802202f8e29c04a76d27af2eb7c548485bf3f4694c90c41810888843792848835f7816707d3e8d76f4e67f5780bcf08813c55ec639a9bd624178f5eb147d500af351e9ef1b1e342484ca260db7ccbae486f13cf265b5b1ab688066008053b20c3dedce771c9a08a0320aa9ce451eb9d983a7b49caa1096f8adc098318dc38e0e7cef0d8e5d557a0675685a1c9e256a2bc9dba322b3bb3172cf714077bc380f8a0a433a8bfa7fbfc59f6b093ec8bf6e9397c09b18e18040c1b566864737c8fa7e29795f3a4588dda7c2bab495665cc4a9b836e2eb90c62a3fcaf591fb5f81804c76180e626fa2644a7de34511d6c4667d98937e27733f4d1e913883354e54fd7351721e76f7b56c3483388f4a6b87b28aebeb0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "34.64.141.166",
          port: 50211,
        },
        {
          ip_address_v4: "34.64.141.166",
          port: 50212,
        },
        {
          ip_address_v4: "52.78.202.34",
          port: 50211,
        },
        {
          ip_address_v4: "52.78.202.34",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 108437327900000000,
      stake_rewarded: 1601292100000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for Chainlink Labs | Michigan, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 20,
      node_account_id: "0.0.23",
      node_cert_hash:
        "0x903388fe34e8bd8cae28eec4c6e8fdd2035b1dcb5c9f45b32b4b17d658c688b81d2330689564c371d477f68b4d2b3959",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a028201810098ed6b2213a3da894b8e83c4532589097d1f9456c70b9fe2d8c308def36daa87706d430f23ca53b27d034deff5c2e0ac351a0729b4760a19b1525b9d20a1961b962255c4bb2a5cc05a05d7b476f6e5b0547b4a883b50f7d1c93745ba40366608106dbf05b755ebc51d1b8291d107f5c0d9a2483ebce3d07c8b7b5857d62b4be56375cf2314f7e009e4f19e8c8089ec69f96d0266199cf7ea3363b157ae952b2283a8d9f7ceb45738b152486f54d40f6200b7ea755d336e1c33ad58ffe03a8c5650ab62b93b2b6645769fe01f4d21cfaa4ce99510f771de22ba9ad1e8c5ecd3404cc3183174c7c84fbdf108b49733868e7c9fecb90b3bb85b0c3c1378032f3b798e6fb9f7fd35fd25f3c21e7cfae81a01bba50bc4fdf82222a1686e9200a1b323b618e448990e2aefb30619048be3599ffc8880ede3b67ecc8bbd4df6432f521bfb337bf2b0958e29e66223ae35dc09406be0212132be29581694a7402604f1ce689c4b57a5bafbc1d46b342b51c31ff2b5675c6c1df60d128d4a64c66fb4f1830203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "3.18.91.176",
          port: 50211,
        },
        {
          ip_address_v4: "3.18.91.176",
          port: 50212,
        },
        {
          ip_address_v4: "35.232.244.145",
          port: 50211,
        },
        {
          ip_address_v4: "35.232.244.145",
          port: 50212,
        },
        {
          ip_address_v4: "69.167.169.208",
          port: 50211,
        },
        {
          ip_address_v4: "69.167.169.208",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 74133982200000000,
      stake_rewarded: 35573725300000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for LSE | Virginia, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 21,
      node_account_id: "0.0.24",
      node_cert_hash:
        "0x416f95bfee63fdd45bfc1007cbec3d544fac6b3039fe1d00317aff4c9c9e67918b28c48bddb23c4ca11131cd8260b3ed",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181009dcd8c0a53e90c3559574f66204117d3b503e50a36d3097fac8429e6cecd37bb54071808f2ee982035f851a0c9be2176383a22e38c1aba168f32f90570cb3233cfe625987666af67b514caef21fb8df6d0fcd33cf2606b92ddea5536b6068d86782e39bd5c38445991d419b7d1ec08599412c0949d1c240b35c14dc55274dba71ffae936125a5f819f54132e2439d4ac5597996ece85e13dff3361f9131f56ceac5b9f552b49cf6f9a9ac6e5dce2db369462f93af80e5b56b6e8befa162a061b4a76892bdc84647306c600858fdd2703276c2c70440198efd7fe3545cf2ab580c74cfd6445aaf7bd7f745cc252eabd265eabee862417104e6948a55756fdc222df0a101524de1c3c08ccf043011ec7fe964edd8451a130147c07363a35f11fdeef8f2a2b761757b4358ff89b75a48d67bdc6090693e0bb8679ecbb93ffdb3f3ed96bec93ef4656e3716ab87ce46ca8e1259c8fedde8f2f1ea0f3eb2c48e96551de12330345725f45ed69c8575b51683afa472621826db22bb2d1c4f1e36464a90203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "18.135.7.211",
          port: 50211,
        },
        {
          ip_address_v4: "18.135.7.211",
          port: 50212,
        },
        {
          ip_address_v4: "34.89.103.38",
          port: 50211,
        },
        {
          ip_address_v4: "34.89.103.38",
          port: 50212,
        },
      ],
      stake: 116758241758241760,
      stake_not_rewarded: 94594689900000000,
      stake_rewarded: 2483522300000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for IIT Madras | Georgia, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 22,
      node_account_id: "0.0.25",
      node_cert_hash:
        "0x8852cb8dcddab369e5719cdbac5e5f50098f882176412ad711e2b03ac6e9fe7035826fd47c12a12742d2c00d5075753f",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100ae7af9c608c1bdb289fb817ffc6c9577ed6d4f6d57f274b215f1390c7e79e490f9dcb74cffe0e8757d67f90f4b20dd4451b7ff6631a6b45c9e403be5a66224955583d1aa4238ba6f946b71cca8c16cc7888b2f0d333c635b8e5478fac3ba3f81457a1a16b04e2b2252651b6c4688c5510d2edc21b03e0a9b283041beef6783c0089845ecc96e6d235c56685d248f8391fe0afcf8ee03f3b498696c6d9decf2fc990c219ef6d2cbba2a69a26528e6009632d82ead3a583ef0c37c2b79068118e0320b9fcb318f5ae48c0877955d0831bc9521aaa88b93419fed9f462f900fc42601056e24ce449edbdc849bb782c09a1a36ad5e4d4b5d7466b7763913f794b2771b07afb617444fb6b4b7484d64e191b513fc8e2501043f725421cd57b073bed21b00314185d6887fbc2b548d90bb2a3c9184ae944c326db8f37a7356aa882bad4c7947a80e16d0f02e382d5771f1987c1b76e88cde1cdf2d1a92215ec68d9b204e80b5dc4675ff3aabf223f7787eb2415df5e389cff60fc40ca252000b4768410203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "13.232.240.207",
          port: 50211,
        },
        {
          ip_address_v4: "13.232.240.207",
          port: 50212,
        },
        {
          ip_address_v4: "34.93.112.7",
          port: 50211,
        },
        {
          ip_address_v4: "34.93.112.7",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 110892250600000000,
      stake_rewarded: 1799524400000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for DBS | Singapore, Republic of Singapore",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 23,
      node_account_id: "0.0.26",
      node_cert_hash:
        "0x43e94ba24bfb7fea94918f3881be62529905b81561a7dbc7cd4dcc0aeb02bea20b896980344c3e7e35a328eb1c526440",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100b72801058ccefb52139ba9c6868a9495e37ba6571c5bc0fb7f2b0d079005dd5ce12af705dfc5ace7fe4b011e6497e1b065e5ef3d937553b1c7c10545ac5c91354ecfad6a6476468883cc66a4a5eb0e1c1d1bbf1030d9650f67b075909e53696ea31acad5240111f75537b14e6eef6451d7b334d1804a2a5789b5e4ac6bfa27955e5517851601b67cfd0bd2869c7ed1f4ce098e367f133b1958743c13c6f69011a8c475b2126d3bc352387989c866fe219a16291e44a92d5471f6fc16862ec7bfe0cad5a4eea1c60829876fb5a012e1dbc51c0c082d890b9635267dd99b4c81115826e816e22e336834c9303c533e202cfa6a191392601ceedba3f9ca4de6117775e0fc6104341e73521139d76c3364de28af58f1473a08472c60916a641ae97ddb9bb072832dfe5b92271fd47ef89c9828a0c7175418d1c9ea3202e2ba588130bbf2e384eb847c9ac2d6807a92e4ba133d5715f36266617f8da56c9c8b394bc002575ca2020cda9f9297a7d045d251025817559e2ea52f54428328ec3db312710203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "13.228.103.14",
          port: 50211,
        },
        {
          ip_address_v4: "13.228.103.14",
          port: 50212,
        },
        {
          ip_address_v4: "34.87.150.174",
          port: 50211,
        },
        {
          ip_address_v4: "34.87.150.174",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 101867760800000000,
      stake_rewarded: 7188041100000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted by ServiceNow | Ogden, Utah",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 24,
      node_account_id: "0.0.27",
      node_cert_hash:
        "0x9e51d01fd202f55080e5ddc4c5a9822747c66a857b0d4070fc20b3f508c5a20239877a219b761825349af5f30010a83d",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100ca795b166d8343bed7ee146c955dd21b828e83078b2a6d314b677610ffd73eba291183a69b558e93c4e0e6c68a2535b13aaf61f9a56e2901f7e1bb999fe178f4c9354f456fcd5cc8c98d259028afdd2fb1df66622d343a0d51317677fee1eb7491693334a0f66b89665be40a4aeb376acc0ac0283c5f5d304b1030696bfd6c073063f21fdfe7b9a2c839abf637828303bf2dea28da015920458f9fd94eac62fd174e37ee08a43b7930b22214a5664deca8d348295e0c399aa8b8460821fb644d77024267ec942edf2dd0c5dab272640431333885f442e73cc194148f728c5a7c9b5a2966d3e3b25f983600fda0ea3a4be97cf7e8f3b0fb648f0b35fa13d272ae7d4342a929b597b40d1c544439cadc26db99b545caee607418883135e9bf160f9779f58d08d502f5eb951bf1e10917c8039abdf09ac3614ede498839f3da2760016840541fefc84ac93c7efd91852a44016bfdc68e38e50c3ae3cc545c37d83a06742aa8ae531d5b16be32c6bdf06dcc2373013892f92e3ae53641d76cd2a8dd0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "13.56.4.96",
          port: 50211,
        },
        {
          ip_address_v4: "13.56.4.96",
          port: 50212,
        },
        {
          ip_address_v4: "34.125.200.96",
          port: 50211,
        },
        {
          ip_address_v4: "34.125.200.96",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 103985509000000000,
      stake_rewarded: 6213567300000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for Ubisoft | Singapore, Republic of Singapore",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 25,
      node_account_id: "0.0.28",
      node_cert_hash:
        "0xb02c9e85f49da18147fd1353773baf0e71d72e22a007f1df9051aa8a4761ae87ad4f90ea4c3409811a1c4777cc2fc61f",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181009f661e1b6526bd231239280555db14a909404cdcc9188642b6d47cb2f3e9c916632e26a4504cff08ba70d146db317a08cc08200419b1b96945984c19cf38d61cb4ae6f11a6aa507eabc12a7291731363790816df3a65fb9f55b20218429c6d24cd19302b12bdb659ad6bb8171ed6f68d9e96dde1aa0af45c69c3bec061c5615d81600bd2bd710d8135a500e37eb748fd296f7c568c26c0dcbe6afe8a2fc2bc3a7e530524c835128d76aa54b413efa035269fd6881497d5ab300ab4efda455f42a80ef39c6bc41931f46b891299040b6d0f3de893f68254be0841aae4f5112097e09db8ffc80c8523c79ea81c6c1adecd04115af9dbbcbc35a02dbe89db88eff6fff8cd6b1f335ef4fa720008fa0b2a5b14022193eb9e2cb7f0372fa9b7e881438ef7460fe1780ec653f2a3ce789c0f5cb6f7b2716148a2e1cb3edc1c6daa1e10a4c0b86741b1bfc8c4d2f35cbb0b0bc14cffbd677512fc15b0df93f76b22c32437c2751c8329cddd8a56eca7520072ef3d01acefc17bb38aa4d442bb56d3b06d0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "18.139.47.5",
          port: 50211,
        },
        {
          ip_address_v4: "18.139.47.5",
          port: 50212,
        },
        {
          ip_address_v4: "35.198.220.75",
          port: 50211,
        },
        {
          ip_address_v4: "35.198.220.75",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 103172281200000000,
      stake_rewarded: 5822902000000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for abrdn | Madrid, Spain",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 26,
      node_account_id: "0.0.29",
      node_cert_hash:
        "0xfff800ea4280d62c9c1ff333cf430194e0f8af282b813b45211328533cf72f9f14644c0604aacf12b165b5a6b059acc3",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a02820181009b18967c838877f85a6471ce9f164cef939b01830b9eb22c02cc6b72a907020b3e4c014dc711ea8e095b88d0b4858ec86b05a8c3a59ac12d2b9fabcac282ceb618db00eb59716611d6706c81aa32d9dddc6a6c7b396ba202fedeb33f289a887284ebfc07d166d02c2c6ed32c7324c3ec8ae22112854e18ab5ea07a615c5ef8004ec68ac70dc03003a47f7efe103edce257d28e7961f428f1cfa2e6cf71bf45c564b82ccbda14a183f30c2c3d5a7afba7a004079e87702c249e96a7b2fdd562fc16759efe75abe6a23d0d2f906a2df1d4b64cb2117a7304449c75319a7620c219a4ffc982e822b6e1a07be1cf98be9265d086dc271aa406310f8a846fd331239fe303bd5616c89080fb88639b7c0ceb14009381823e0433db6f9156e2bda1873d4aa9a3a639604bfbd11a6dd6ce03b4b0ceef95601c7d88a840397cdbca3ff214fbf58c9d9dbd79d39ea767e9ae5f6eab9fca05fc4800f557657c90c12c60e02164825d4c33af4737374ea235b50313ed0b75bf89a6b79001fba74cc1319e55150203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "34.142.71.129",
          port: 50211,
        },
        {
          ip_address_v4: "34.142.71.129",
          port: 50212,
        },
        {
          ip_address_v4: "54.74.60.120",
          port: 50211,
        },
        {
          ip_address_v4: "54.74.60.120",
          port: 50212,
        },
      ],
      stake: 116758241758241760,
      stake_not_rewarded: 96204635700000000,
      stake_rewarded: 1242655300000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
    {
      description: "Hosted for Dell | New Jersey, USA",
      file_id: "0.0.102",
      max_stake: 178571428571428580,
      memo: "",
      min_stake: 44642857142857144,
      node_id: 27,
      node_account_id: "0.0.30",
      node_cert_hash:
        "0x9773691c2995551932e052e7dc80532b31d8470ec2db37956ce88036817965436300f00d95ba5a750c2b7891c8b66a9a",
      public_key:
        "0x308201a2300d06092a864886f70d01010105000382018f003082018a0282018100a13e000c6349b6b805ef58d0661201107b7546a59d2bd4e0d76333c384e3a33a9466c86fe78f5db80bafcabc177cf7c9abe62ac4883e9636975c6e95897854ea1cd3fb807b7e60be9eb1f285c90fad206be6fa01ca14cff11a2bdae96f00008baab443a53874c2593c76b0a3bddb4a20ad57b2f5fe444059e8591f6b53bbf92396436f0a739423da834e74c3fcff32f4d697434088ccee7773172640dcb49422ff668a34311f70788497afbd0dce61d9e3b6d4b83d53b31f27afd5c76ce77c9ef80bd7dfa928a74f1a1d23947f2f1497826fa6f88044ee171858802134d9e2dae75b7e397aec3a826f890d700a8a2396fef9673f77ae0633349410d9758747ea8ff2878fa73ac1dea79b7ce680f18fb9b80815a75be12413d56bad730116e0ea6e9038c2d247ef0ef95b1dd03f62b8f1a1366558897e4324ad06aa93fcd9516b64042f7be40878ac78e7a9c40447fe38878f8218a52fe64132b39936e660309b04d07dc722fc495bc9bce8138d0e62c86ec53c7f9cc997c3d6cd8a91520189eb0203010001",
      reward_rate_start: 17808,
      service_endpoints: [
        {
          ip_address_v4: "34.201.177.212",
          port: 50211,
        },
        {
          ip_address_v4: "34.201.177.212",
          port: 50212,
        },
        {
          ip_address_v4: "35.234.249.150",
          port: 50211,
        },
        {
          ip_address_v4: "35.234.249.150",
          port: 50212,
        },
      ],
      stake: 127060439560439550,
      stake_not_rewarded: 108000000000000000,
      stake_rewarded: 1789729200000000,
      staking_period: {
        from: "1684800000.000000000",
        to: "1684886400.000000000",
      },
      timestamp: {
        from: "1680288793.607753004",
        to: null,
      },
    },
  ];

  return nodeList;
}
