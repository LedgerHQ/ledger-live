import {
  findCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { render } from "@testing-library/react";
import BigNumber from "bignumber.js";
import React from "react";
import { ThemeProvider } from "styled-components";
import { TransactionMode } from "~/../../../libs/ledger-live-common/lib/families/ethereum/modules";
import RecipientField from "./RecipientField";
import defaultTheme from "../../../styles/theme";
import light from "./light";
const eth = findCryptoCurrencyById("ethereum");

const mockAccount = {
  type: "Account" as "Account",
  id: "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:",
  starred: false,
  used: true,
  seedIdentifier:
    "0441996d9ce858d8fd6304dd790e645500fc6cee7ae0fccfee8c8fa884dfa8ccf1f6f8cc82cc0aa71fc659c895a8a43b69f918b08a22b3a6145a0bbd93c5cb9308",
  derivationMode: "",
  index: 0,
  freshAddress: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [
    {
      address: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      derivationPath: "44'/60'/0'/0/0",
    },
  ],
  name: "Ethereum 1",
  blockHeight: 16626551,
  creationDate: new Date("2021-03-23T14:17:07.001Z"),
  balance: new BigNumber("22913015427119498"),
  spendableBalance: new BigNumber("22913015427119498"),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  unit: {
    name: "ether",
    code: "ETH",
    magnitude: 18,
  },
  currency: eth as CryptoCurrency,
  lastSyncDate: new Date("2023-02-14T11:01:19.252Z"),
  swapHistory: [],
  syncHash: "[]_6595",
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 1676329200000 },
    DAY: { balances: [], latestDate: 1676329200000 },
    WEEK: { balances: [], latestDate: 1676329200000 },
  },
  nfts: [],
  subAccounts: [],
};

const mockTransaction = {
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  mode: "send" as TransactionMode,
  family: "ethereum" as "ethereum",
  gasPrice: null,
  maxFeePerGas: new BigNumber("28026227316"),
  maxPriorityFeePerGas: new BigNumber("1000000000"),
  userGasLimit: null,
  estimatedGasLimit: null,
  feeCustomUnit: {
    name: "Gwei",
    code: "Gwei",
    magnitude: 9,
  },
  networkInfo: {
    family: "ethereum" as "ethereum",
  },
  feesStrategy: "medium" as "medium",
};

const mockStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber("1041182537010000"),
  amount: new BigNumber("0"),
  totalSpent: new BigNumber("0"),
};

const changeTransactionFn = jest.fn();

describe("RecipientField", () => {
  beforeAll(() => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
  });

  it("should test input", () => {
    render(
      <ThemeProvider
        theme={{
          ...defaultTheme,
          //@ts-ignore
          colors: { palette: { text: { shade100: "" }, background: { default: "", paper: "" } } },
        }}
      >
        <RecipientField
          account={mockAccount}
          transaction={mockTransaction}
          t={str => {
            return str;
          }}
          onChangeTransaction={changeTransactionFn}
          status={mockStatus}
        ></RecipientField>
      </ThemeProvider>,
    );
  });
});
