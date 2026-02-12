import BigNumber from "bignumber.js";
import {
  toSuiResourcesRaw,
  fromSuiResourcesRaw,
  assignToAccountRaw,
  assignFromAccountRaw,
} from "./serialization";

const account = {
  type: "Account" as const,
  id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
  used: true,
  seedIdentifier: "99807c4b6e1b8b25120f633f5f7816a393e4d3e7f84bdf24bd8afe725911be91",
  derivationMode: "sui" as const,
  index: 0,
  freshAddress: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
  freshAddressPath: "44'/784'/0'/0'/0'",
  blockHeight: 10,
  creationDate: new Date(),
  balance: BigNumber(9998990120),
  spendableBalance: BigNumber(9998990120),
  operations: [
    {
      id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui-DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt-IN",
      hash: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
      type: "IN" as const,
      senders: ["0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24"],
      recipients: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
      accountId: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
      blockHash: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
      blockHeight: 5,
      date: new Date(),
      value: BigNumber(9998990120),
      fee: BigNumber(1009880),
      extra: {},
      hasFailed: false,
    },
  ],
  operationsCount: 1,
  pendingOperations: [],
  currency: {
    type: "CryptoCurrency" as const,
    id: "sui" as const,
    coinType: 784,
    name: "Sui",
    managerAppName: "Sui",
    ticker: "SUI",
    scheme: "sui",
    color: "#000",
    family: "sui",
    units: [{ name: "Sui", code: "SUI", magnitude: 9 }],
    explorerViews: [
      {
        tx: "https://suiscan.xyz/mainnet/tx/$hash",
        address: "https://suiscan.xyz/mainnet/account/$address",
      },
      {
        tx: "https://suivision.xyz/txblock/$hash",
        address: "https://suivision.xyz/account/$address",
      },
    ],
  },
  lastSyncDate: new Date(),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { balances: [0, 9998990120, 9998990120, 9998990120], latestDate: 1742302800000 },
    DAY: { balances: [0], latestDate: 1742245200000 },
    WEEK: { balances: [0], latestDate: 1742072400000 },
  },
  suiResources: {},
};
const accountRaw = {
  id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
  seedIdentifier: "99807c4b6e1b8b25120f633f5f7816a393e4d3e7f84bdf24bd8afe725911be91",
  used: true,
  derivationMode: "sui" as const,
  index: 0,
  freshAddress: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
  freshAddressPath: "44'/784'/0'/0'/0'",
  blockHeight: 10,
  creationDate: "2025-03-18T10:40:54.878Z",
  operationsCount: 1,
  operations: [
    {
      id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui-DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt-IN",
      hash: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
      type: "IN" as const,
      senders: ["0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24"],
      recipients: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
      accountId: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
      blockHash: "DhKLpX5kwuKuyRa71RGqpX5EY2M8Efw535ZVXYXsRiDt",
      blockHeight: 5,
      extra: {},
      date: "2025-03-18T10:40:54.878Z",
      value: "9998990120",
      fee: "1009880",
      hasFailed: false,
    },
  ],
  pendingOperations: [],
  currencyId: "sui",
  lastSyncDate: "2025-03-18T10:40:54.878Z",
  balance: "9998990120",
  spendableBalance: "9998990120",
  balanceHistoryCache: {
    HOUR: { balances: [0, 9998990120, 9998990120, 9998990120], latestDate: 1742302800000 },
    DAY: { balances: [0], latestDate: 1742245200000 },
    WEEK: { balances: [0], latestDate: 1742072400000 },
  },
  suiResources: {},
};

describe("serialization", () => {
  test("toSuiResourcesRaw should convert SuiResources to SuiResourcesRaw", () => {
    const resources = {};
    const result = toSuiResourcesRaw(resources);
    expect(result).toEqual({});
  });

  test("fromSuiResourcesRaw should convert SuiResourcesRaw to SuiResources", () => {
    const resourcesRaw = {};
    const result = fromSuiResourcesRaw(resourcesRaw);
    expect(result).toEqual({});
  });

  test("assignToAccountRaw should assign SuiResources to AccountRaw", () => {
    assignToAccountRaw(account, accountRaw);
    expect(accountRaw.suiResources).toEqual({});
  });

  test("assignFromAccountRaw should assign SuiResourcesRaw to Account", () => {
    assignFromAccountRaw(accountRaw, account);
    expect(accountRaw.suiResources).toEqual({});
  });
});
