import React from "react";
import axios from "axios";
import { jest, describe, beforeAll, beforeEach, it, expect } from "@jest/globals";
import BigNumber from "bignumber.js";
import { render, screen, waitFor } from "tests/testUtils";

import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/types-live";
import { InvalidAddress } from "@ledgerhq/errors";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import RecipientField from "./RecipientField";
import { TFunction } from "i18next";

// Temp mock to prevent error on sentry init
jest.mock("../../../../sentry/install", () => ({
  init: () => null,
}));

jest.mock("axios");

const mockedAxios = jest.mocked(axios);

jest.mock("@ledgerhq/live-config/featureFlags/index", () => ({
  useFeature: jest.fn(),
}));

const mockedUseFeature = jest.mocked(useFeature);

const mockedOnChangeTransaction = jest.fn().mockImplementation(t => t);

const eth = getCryptoCurrencyById("ethereum");
const polygon = getCryptoCurrencyById("polygon");

const ethMockAccount: Account = {
  type: "Account",
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
  currency: eth,
  lastSyncDate: new Date("2023-02-14T11:01:19.252Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 1676329200000 },
    DAY: { balances: [], latestDate: 1676329200000 },
    WEEK: { balances: [], latestDate: 1676329200000 },
  },
  nfts: [],
  subAccounts: [],
};
const polygonMockAccount: Account = {
  type: "Account",
  id: "js:2:polygon:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:",
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
  name: "Polygon 1",
  blockHeight: 16626551,
  creationDate: new Date("2021-03-23T14:17:07.001Z"),
  balance: new BigNumber("22913015427119498"),
  spendableBalance: new BigNumber("22913015427119498"),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  unit: {
    name: "matic",
    code: "MATIC",
    magnitude: 18,
  },
  currency: polygon,
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

const baseMockTransaction: Transaction = {
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  mode: "send",
  family: "evm",
  gasPrice: undefined,
  maxFeePerGas: new BigNumber("28026227316"),
  maxPriorityFeePerGas: new BigNumber("1000000000"),
  customGasLimit: undefined,
  nonce: 0,
  gasLimit: new BigNumber("21000"),
  chainId: 1,
  type: 2,
};

const baseMockStatus: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber("1041182537010000"),
  amount: new BigNumber("0"),
  totalSpent: new BigNumber("0"),
};

const mockTFunction: jest.Mock<TFunction> = jest.fn(key => key) as unknown as jest.Mock<TFunction>;

const setup = (
  mockStatus: Partial<TransactionStatus> | null = {},
  mockTransaction: Partial<Transaction> | null = {},
  account = ethMockAccount,
) => {
  return render(
    <DomainServiceProvider>
      <RecipientField
        account={account}
        transaction={{ ...baseMockTransaction, ...mockTransaction } as Transaction}
        // tslint:disable-next-line
        t={mockTFunction as unknown as TFunction}
        onChangeTransaction={mockedOnChangeTransaction}
        status={{ ...baseMockStatus, ...mockStatus }}
      />
    </DomainServiceProvider>,
  );
};

describe("RecipientField", () => {
  beforeAll(() => {
    setSupportedCurrencies(["polygon", "ethereum"]);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(axios, "request").mockImplementation(async ({ url }) => {
      if (url?.endsWith("vitalik.eth")) {
        return {
          data: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        };
      } else if (url?.endsWith("0x16bb635bc5c398b63a0fbb38dac84da709eb3e86")) {
        return {
          data: "degendon.eth",
        };
      }
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({ response: { status: 404 } });
    });
  });

  describe("Rendering", () => {
    it("should render without problem with minimum config", async () => {
      setup();
      // NB: Document is not available in test dom so use truthy instead of .toBeInTheDocument()
      expect(screen.queryByRole("textbox")).toBeTruthy();
    });

    it("should test change input should trigger change transaction", async () => {
      const { user } = setup();
      const input = screen.getByRole("textbox");
      expect(mockedOnChangeTransaction).toHaveBeenCalledTimes(0);
      await user.type(input, "mockrecipient");
      expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
        ...baseMockTransaction,
        recipient: "mockrecipient",
      });
    });

    it("should display error if status has error", async () => {
      setup({ errors: { recipient: new InvalidAddress() } });
      expect(await screen.findByTestId("input-error")).toBeTruthy();
    });
  });

  describe("Feature Flag", () => {
    describe("Flag on", () => {
      beforeEach(() => {
        mockedUseFeature.mockReturnValue({
          enabled: true,
          params: { supportedCurrencyIds: ["ethereum"] },
        });
      });

      it("should change domain in transaction", async () => {
        const { user } = setup();
        const input = screen.getByRole("textbox");

        await user.type(input, "vitalik.eth");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            recipientDomain: {
              registry: "ens",
              domain: "vitalik.eth",
              address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
              type: "forward",
            },
          }),
        );
      });

      it("should reverse addr to domain name in transaction", async () => {
        const { user } = setup();
        const input = screen.getByRole("textbox");
        await user.type(input, "0x16bb635bc5c398b63a0fbb38dac84da709eb3e86");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "0x16bb635bc5c398b63a0fbb38dac84da709eb3e86",
            recipientDomain: {
              registry: "ens",
              domain: "degendon.eth",
              address: "0x16Bb635bc5c398b63A0fBb38DAC84da709EB3e86",
              type: "reverse",
            },
          }),
        );
      });

      it("should not change domain because invalid recipient name", async () => {
        const { user } = setup();
        const input = screen.getByRole("textbox");

        await user.type(input, "vitalik.notadomainservice");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "vitalik.notadomainservice",
            recipientDomain: undefined,
          }),
        );
      });

      it("should not change domain if domain is invalid", async () => {
        const { user } = setup();
        const input = screen.getByRole("textbox");

        await user.type(input, "vitalik👋.eth");
        await waitFor(() => {
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "vitalik👋.eth",
            recipientDomain: undefined,
          });
        });

        expect(screen.getByTestId("domain-error-invalid-domain")).toBeTruthy();
      });

      it("should not change domain if domain has no resolution", async () => {
        const { user } = setup();
        const input = screen.getByRole("textbox");

        await user.type(input, "anything-not-existing.eth");
        await waitFor(() => {
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "anything-not-existing.eth",
            recipientDomain: undefined,
          });
        });
        expect(
          screen.getByText("send.steps.recipient.domainService.noResolution.title"),
        ).toBeTruthy();

        expect(screen.getByTestId("domain-error-no-resolution")).toBeTruthy();
      });

      it("should remove domain on input change", async () => {
        const { user } = setup(
          {},
          {
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            recipientDomain: {
              registry: "ens",
              domain: "vitalik.eth",
              address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
              type: "forward",
            },
          },
        );
        const input = screen.getByRole("textbox");

        await user.type(input, "{Backspace}");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "vitalik.et",
            recipientDomain: undefined,
          }),
        );
      });

      it("should add then remove domain on input change", async () => {
        const { user } = setup();

        const input = screen.getByRole("textbox");

        await user.type(input, "vitalik.eth");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            recipientDomain: {
              registry: "ens",
              domain: "vitalik.eth",
              address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
              type: "forward",
            },
          }),
        );

        await user.type(input, "{Backspace}");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "vitalik.et",
            recipientDomain: undefined,
          }),
        );
      });

      it("should not change domain because currency not supported", async () => {
        const { user } = setup(null, null, polygonMockAccount);
        const input = screen.getByRole("textbox");
        await user.type(input, "0x16bb635bc5c398b63a0fbb38dac84da709eb3e86");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "0x16bb635bc5c398b63a0fbb38dac84da709eb3e86",
            recipientDomain: undefined,
          }),
        );
        expect(mockedAxios).not.toHaveBeenCalled();
      });
    });

    describe("Flag off", () => {
      beforeEach(() => {
        mockedUseFeature.mockReturnValue({ enabled: false });
      });

      it("should not change domain", async () => {
        const { user } = setup();
        const input = screen.getByRole("textbox");
        await user.type(input, "vitalik.eth");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "vitalik.eth",
            recipientDomain: undefined,
          }),
        );
      });
    });
  });
});
