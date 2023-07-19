import { CurrenciesData } from "@ledgerhq/types-live";
import type { CosmosAccountRaw, Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreOperationFields: ["gas"],
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "axelar seed 1",
      apdus: `
      => 550400001b066178656c61722c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836178656c61723167796175766c3434713261706e33753361756a6d333671387a726a3734767279336b676c79679000
      => 550400001b066178656c61722c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e836178656c61723167796175766c3434713261706e33753361756a6d333671387a726a3734767279336b676c79679000
      => 550400001b066178656c61722c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f6178656c61723176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e657874393938309000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:axelar:axelar1gyauvl44q2apn3u3aujm36q8zrj74vry3kglyg:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Axelar 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "axelar1gyauvl44q2apn3u3aujm36q8zrj74vry3kglyg",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 6982788,
        creationDate: "2023-04-17T13:48:02.000Z",
        operationsCount: 9,
        operations: [],
        pendingOperations: [],
        currencyId: "axelar",
        unitMagnitude: 6,
        lastSyncDate: "2023-04-17T14:48:22.102Z",
        balance: "978792",
        spendableBalance: "628791",
        balanceHistoryCache: {
          HOUR: { balances: [0, 996681], latestDate: 1681740000000 },
          DAY: { balances: [0], latestDate: 1681682400000 },
          WEEK: { balances: [0], latestDate: 1681596000000 },
        },
        xpub: "axelar1gyauvl44q2apn3u3aujm36q8zrj74vry3kglyg",
        cosmosResources: {
          delegations: [
            {
              amount: "100001",
              status: "bonded",
              validatorAddress: "axelarvaloper1gp957czryfgyvxwn3tfnyy2f0t9g2p4ppzdrn6",
            },
            {
              amount: "25000",
              status: "bonded",
              validatorAddress: "axelarvaloper13s44uvtzf578zjze9eqeh0mnemj60pwn83frcp",
            },
            {
              amount: "200000",
              status: "bonded",
              validatorAddress: "axelarvaloper1kj8j6hkmgfvtxpgfuskj602sxs5dsfkm6ewm4l",
            },
            {
              amount: "12500",
              status: "bonded",
              validatorAddress: "axelarvaloper1uvx854yjzn9re8vu74067u68r4ar70tywgpcwg",
            },
          ],
          redelegations: [
            {
              amount: "25000",
              completionDate: "Mon Apr 24 2023 16:01:36 GMT+0200 (Central European Summer Time)",
              validatorSrcAddress: "axelarvaloper1uvx854yjzn9re8vu74067u68r4ar70tywgpcwg",
              validatorDstAddress: "axelarvaloper13s44uvtzf578zjze9eqeh0mnemj60pwn83frcp",
            },
          ],
          unbondings: [
            {
              amount: "12500",
              completionDate: "Mon Apr 24 2023 16:02:16 GMT+0200 (Central European Summer Time)",
              validatorAddress: "axelarvaloper1uvx854yjzn9re8vu74067u68r4ar70tywgpcwg",
            },
          ],
          delegatedBalance: "337501",
          pendingRewardsBalance: "1",
          unbondingBalance: "12500",
          withdrawAddress: "axelar1gyauvl44q2apn3u3aujm36q8zrj74vry3kglyg",
        },
        swapHistory: [],
      } as unknown as CosmosAccountRaw,
    },
  ],
};

export default dataset;
