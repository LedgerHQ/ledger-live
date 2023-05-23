import { CurrenciesData, OperationRaw } from "@ledgerhq/types-live";
import { CosmosAccountRaw, Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [
    "cosmosResources.unbondingBalance", // They move once all unbonding are done
    "cosmosResources.pendingRewardsBalance", // They are always movings
    "cosmosResources.delegations", // They are always movings because of pending Rewards
    "cosmosResources.redelegations", // will change ince a redelegation it's done
    "cosmosResources.unbondings", // will change once a unbonding it's done
    "spendableBalance", // will change with the rewards that automatically up
  ],
  FIXME_ignorePreloadFields: ["validators"], // the APY of validators changes over time
  scanAccounts: [
    {
      name: "nyx seed 1",
      apdus: `
      => 5504000016016e2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836e3167796175766c3434713261706e33753361756a6d333671387a726a37347672793875663473769000
      => 5504000016016e2c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836e3167796175766c3434713261706e33753361756a6d333671387a726a37347672793875663473769000
      => 5504000016016e2c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f6e3176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e65737079306e749000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
        seedIdentifier:
          "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Nyx 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [
          {
            address: "n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv",
            derivationPath: "44'/118'/0'/0/0",
          },
        ],
        blockHeight: 7169086,
        creationDate: "2023-04-19T17:14:46.000Z",
        operationsCount: 9,
        operations: [
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-0536BB2066D4CB3B4521525F20F3D5F086E558A638B4D0CC41A7FF34757513D0-OUT",
            hash: "0536BB2066D4CB3B4521525F20F3D5F086E558A638B4D0CC41A7FF34757513D0",
            type: "OUT",
            senders: ["n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv"],
            recipients: ["n103h9fdkgm7ucccujyunck5lfejrvthd79xs4aq"],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "7168751",
            extra: {
              validators: [],
            },
            date: "2023-05-23T10:05:44.000Z",
            value: "700000",
            fee: "0",
            transactionSequenceNumber: 6,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-FF77E4EC79D2942C000127177E658C23A02D043B1C88E3B388E84B29FD603EEF-REDELEGATE",
            hash: "FF77E4EC79D2942C000127177E658C23A02D043B1C88E3B388E84B29FD603EEF",
            type: "REDELEGATE",
            senders: [],
            recipients: [],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "7168714",
            extra: {
              validators: [
                {
                  address: "nvaloper166m7e8hxntq8e68whqrfk37f32xyk3eer0t427",
                  amount: "25000",
                },
              ],
              sourceValidator:
                "nvaloper1xgyczxuxspeytdpyvp3w840ckzp4env4phq67x",
            },
            date: "2023-05-23T10:02:12.000Z",
            value: "0",
            fee: "0",
            transactionSequenceNumber: 5,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-259161A4CB4AAE2F67A3A0067FED4E079B37302BF867975A00007D7B61F109A3-UNDELEGATE",
            hash: "259161A4CB4AAE2F67A3A0067FED4E079B37302BF867975A00007D7B61F109A3",
            type: "UNDELEGATE",
            senders: [],
            recipients: [],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "7168709",
            extra: {
              validators: [
                {
                  address: "nvaloper1xgyczxuxspeytdpyvp3w840ckzp4env4phq67x",
                  amount: "50000",
                },
              ],
            },
            date: "2023-05-23T10:01:43.000Z",
            value: "0",
            fee: "0",
            transactionSequenceNumber: 4,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-CAF7AC7DA16B4BE3B2FB6C5A56A22FB82D8726846F28ED68E1702DB24AD14043-DELEGATE",
            hash: "CAF7AC7DA16B4BE3B2FB6C5A56A22FB82D8726846F28ED68E1702DB24AD14043",
            type: "DELEGATE",
            senders: [],
            recipients: [],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "7168705",
            extra: {
              validators: [
                {
                  address: "nvaloper1uw3y3g6du2xxvlsu7qtv9vwvq7nqe5t65u0aph",
                  amount: "1000000",
                },
              ],
            },
            date: "2023-05-23T10:01:20.000Z",
            value: "0",
            fee: "0",
            transactionSequenceNumber: 3,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-6C1EDC2190665486BC0897CE101FA7A1B9534B9D89319A5253DED595321BB7B7-OUT",
            hash: "6C1EDC2190665486BC0897CE101FA7A1B9534B9D89319A5253DED595321BB7B7",
            type: "OUT",
            senders: ["n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv"],
            recipients: ["n103h9fdkgm7ucccujyunck5lfejrvthd79xs4aq"],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "6896858",
            extra: {
              validators: [],
            },
            date: "2023-05-05T07:33:50.000Z",
            value: "8009004",
            fee: "9004",
            transactionSequenceNumber: 2,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-2618E39FC7A5EB30E77FAD5F2E7E60ECEF38D24E54E787C9FD87095CEB2DB2E7-DELEGATE",
            hash: "2618E39FC7A5EB30E77FAD5F2E7E60ECEF38D24E54E787C9FD87095CEB2DB2E7",
            type: "DELEGATE",
            senders: [],
            recipients: [],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "6896825",
            extra: {
              validators: [
                {
                  address: "nvaloper1xgyczxuxspeytdpyvp3w840ckzp4env4phq67x",
                  amount: "100000",
                },
              ],
            },
            date: "2023-05-05T07:30:40.000Z",
            value: "15369",
            fee: "15369",
            transactionSequenceNumber: 1,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-799CBE8B097B342DA294251BF57E88F54106F259E0593E0015088B68AE3A00C9-IN",
            hash: "799CBE8B097B342DA294251BF57E88F54106F259E0593E0015088B68AE3A00C9",
            type: "IN",
            senders: ["n1hzn28p2c6pzr98r85jp3h53fy8mju5w7ndd5vh"],
            recipients: ["n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv"],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "6733714",
            extra: {
              validators: [],
            },
            date: "2023-04-24T10:50:13.000Z",
            value: "10000000",
            fee: "0",
            transactionSequenceNumber: 47,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-3AD0F1CE69E6FD9EBCD0D489E86401BB6ABFBD01B2ECDA95B4169235C0FECDAA-OUT",
            hash: "3AD0F1CE69E6FD9EBCD0D489E86401BB6ABFBD01B2ECDA95B4169235C0FECDAA",
            type: "OUT",
            senders: ["n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv"],
            recipients: ["n1e533m29emngs7camh5rjzpxkr0ngyuekuprsxd"],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "6675216",
            extra: {
              validators: [],
            },
            date: "2023-04-20T13:24:17.000Z",
            value: "0",
            fee: "0",
            transactionSequenceNumber: 0,
          },
          {
            id: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:-C67C2B010D47A95C5E3B9D30F009556527FFAF3189024FBF22996447234AAB70-IN",
            hash: "C67C2B010D47A95C5E3B9D30F009556527FFAF3189024FBF22996447234AAB70",
            type: "IN",
            senders: ["n12x228j690q00zpw85p98dgzn76p8sl36m4shh4"],
            recipients: ["n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv"],
            accountId: "js:2:nyx:n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv:",
            blockHash: null,
            blockHeight: "6662596",
            extra: {
              validators: [],
            },
            date: "2023-04-19T17:14:46.000Z",
            value: "0",
            fee: "0",
            transactionSequenceNumber: 2640,
          },
        ] as unknown as OperationRaw[],
        pendingOperations: [],
        currencyId: "nyx",
        unitMagnitude: 6,
        lastSyncDate: "2023-05-23T10:38:02.169Z",
        balance: "1275627",
        spendableBalance: "225627",
        balanceHistoryCache: {
          HOUR: {
            balances: [
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627,
            ],
            latestDate: 1684836000000,
          },
          DAY: {
            balances: [
              0, 0, 0, 0, 0, 0, 10000000, 10000000, 10000000, 10000000,
              10000000, 10000000, 10000000, 10000000, 10000000, 10000000,
              10000000, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627, 1975627, 1975627,
              1975627, 1975627, 1975627, 1975627, 1975627,
            ],
            latestDate: 1684792800000,
          },
          WEEK: {
            balances: [0, 0, 10000000, 1975627, 1975627, 1975627],
            latestDate: 1684620000000,
          },
        },
        xpub: "n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv",
        cosmosResources: {
          delegations: [
            {
              amount: "25000",
              status: "bonded",
              pendingRewards: "0",
              validatorAddress:
                "nvaloper1xgyczxuxspeytdpyvp3w840ckzp4env4phq67x",
            },
            {
              amount: "25000",
              status: "bonded",
              pendingRewards: "0",
              validatorAddress:
                "nvaloper166m7e8hxntq8e68whqrfk37f32xyk3eer0t427",
            },
            {
              amount: "1000000",
              status: "bonded",
              pendingRewards: "0",
              validatorAddress:
                "nvaloper1uw3y3g6du2xxvlsu7qtv9vwvq7nqe5t65u0aph",
            },
          ],
          redelegations: [],
          unbondings: [],
          delegatedBalance: "1050000",
          pendingRewardsBalance: "0",
          unbondingBalance: "0",
          withdrawAddress: "n1gyauvl44q2apn3u3aujm36q8zrj74vry8uf4sv",
        },
        swapHistory: [],
      } as CosmosAccountRaw,
    },
  ],
};

export default dataset;
