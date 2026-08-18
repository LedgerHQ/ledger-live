import nock from "nock";
import React from "react";
import axios from "axios";
import { TFunction } from "i18next";
import BigNumber from "bignumber.js";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { Account } from "@ledgerhq/types-live";
import { InvalidAddress } from "@ledgerhq/ledger-wallet-framework/errors";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountBridgeByFamily } from "@ledgerhq/live-common/bridge/impl";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import RecipientField from "./RecipientField";
import { importLLDCoinFamily } from "~/renderer/families";

nock.disableNetConnect();

const mockedOnChangeTransaction = jest.fn().mockImplementation(t => t);

const eth = getCryptoCurrencyById("ethereum");
const polygon = getCryptoCurrencyById("polygon");

const ethMockAccount: Account = {
  type: "Account",
  id: "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:",
  used: true,
  seedIdentifier:
    "0441996d9ce858d8fd6304dd790e645500fc6cee7ae0fccfee8c8fa884dfa8ccf1f6f8cc82cc0aa71fc659c895a8a43b69f918b08a22b3a6145a0bbd93c5cb9308",
  derivationMode: "",
  index: 0,
  freshAddress: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 16626551,
  creationDate: new Date("2021-03-23T14:17:07.001Z"),
  balance: new BigNumber("22913015427119498"),
  spendableBalance: new BigNumber("22913015427119498"),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
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
  used: true,
  seedIdentifier:
    "0441996d9ce858d8fd6304dd790e645500fc6cee7ae0fccfee8c8fa884dfa8ccf1f6f8cc82cc0aa71fc659c895a8a43b69f918b08a22b3a6145a0bbd93c5cb9308",
  derivationMode: "",
  index: 0,
  freshAddress: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 16626551,
  creationDate: new Date("2021-03-23T14:17:07.001Z"),
  balance: new BigNumber("22913015427119498"),
  spendableBalance: new BigNumber("22913015427119498"),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
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

const bitcoinMockAccount = {
  ...createFixtureAccount(),
  // decodeAccountId requires >= 5 ":"-separated parts; the fixture's id isn't one.
  id: "js:2:bitcoin:1fMK6i7CMDES1GNGDEMX5ddDaxbkjWPw1M:",
} as unknown as Account;

const bitcoinMockTransaction: Transaction = {
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  family: "bitcoin",
  utxoStrategy: { strategy: 0, excludeUTXOs: [] },
  rbf: false,
  feePerByte: null,
  networkInfo: null,
} as unknown as Transaction;

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

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockTFunction: jest.Mock<TFunction> = jest.fn(key => key) as unknown as jest.Mock<TFunction>;

const domainInputResolutionOn = {
  domainInputResolution: { enabled: true, params: { supportedCurrencyIds: ["ethereum"] } },
};

const domainInputResolutionOff = {
  domainInputResolution: { enabled: false },
};

const setup = (
  mockStatus: Partial<TransactionStatus> | null = {},
  mockTransaction: Partial<Transaction> | null = {},
  account = ethMockAccount,
  featureFlagOverrides?: Parameters<typeof withFlagOverrides>[0],
) => {
  return render(
    <DomainServiceProvider>
      <RecipientField
        account={account}
        transaction={{ ...baseMockTransaction, ...mockTransaction }}
        // tslint:disable-next-line
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        t={mockTFunction as unknown as TFunction}
        onChangeTransaction={mockedOnChangeTransaction}
        status={{ ...baseMockStatus, ...mockStatus }}
      />
    </DomainServiceProvider>,
    featureFlagOverrides ? { initialState: withFlagOverrides(featureFlagOverrides) } : undefined,
  );
};

// Renders with a caller-supplied transaction, unmerged with baseMockTransaction --
// needed for families (e.g. bitcoin) whose transaction shape isn't the evm one.
const setupWithTransaction = (
  transaction: Transaction,
  mockStatus: Partial<TransactionStatus> | null = {},
  account = ethMockAccount,
) => {
  return render(
    <DomainServiceProvider>
      <RecipientField
        account={account}
        transaction={transaction}
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        t={mockTFunction as unknown as TFunction}
        onChangeTransaction={mockedOnChangeTransaction}
        status={{ ...baseMockStatus, ...mockStatus }}
      />
    </DomainServiceProvider>,
  );
};

describe("RecipientField", () => {
  beforeAll(async () => {
    await getAccountBridgeByFamily("evm");
    // Preload so useLLDCoinFamily resolves synchronously on first render instead of suspending.
    await importLLDCoinFamily("evm");
    await getAccountBridgeByFamily("bitcoin");
    await importLLDCoinFamily("bitcoin");
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
      it("should change domain in transaction", async () => {
        const { user } = setup({}, {}, ethMockAccount, domainInputResolutionOn);
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
        const { user } = setup({}, {}, ethMockAccount, domainInputResolutionOn);
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
        const { user } = setup({}, {}, ethMockAccount, domainInputResolutionOn);
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
        const { user } = setup({}, {}, ethMockAccount, domainInputResolutionOn);
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
        const { user } = setup({}, {}, ethMockAccount, domainInputResolutionOn);
        const input = screen.getByRole("textbox");

        await user.type(input, "anything-not-existing.eth");
        await waitFor(() => {
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "anything-not-existing.eth",
            recipientDomain: undefined,
          });
        });
        await waitFor(() => {
          expect(screen.getByText("No address found for this domain")).toBeTruthy();
        });

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
          ethMockAccount,
          domainInputResolutionOn,
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
        const { user } = setup({}, {}, ethMockAccount, domainInputResolutionOn);
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
        const spy = jest.spyOn(axios, "request");
        const { user } = setup(null, null, polygonMockAccount, domainInputResolutionOn);
        const input = screen.getByRole("textbox");
        await user.type(input, "0x16bb635bc5c398b63a0fbb38dac84da709eb3e86");
        await waitFor(() =>
          expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
            ...baseMockTransaction,
            recipient: "0x16bb635bc5c398b63a0fbb38dac84da709eb3e86",
            recipientDomain: undefined,
          }),
        );
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe("Flag off", () => {
      it("should not change domain", async () => {
        const { user } = setup({}, {}, ethMockAccount, domainInputResolutionOff);
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

  // recipientIsReadOnly is set by coin-zcash today; every other currency never
  // sets it, so the sync effect it drives must stay inert for them.
  describe("recipientIsReadOnly regression guards", () => {
    it("leaves typing unaffected when recipientIsReadOnly is false", async () => {
      const { user } = setup({ recipientIsReadOnly: false });
      const input = screen.getByRole("textbox");

      await user.type(input, "mockrecipient");

      expect(input).toHaveValue("mockrecipient");
      expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
        ...baseMockTransaction,
        recipient: "mockrecipient",
      });
    });

    it("leaves typing unaffected when recipientIsReadOnly is undefined", async () => {
      const { user } = setup({}, {}, polygonMockAccount);
      const input = screen.getByRole("textbox");

      await user.type(input, "mockrecipient");

      expect(input).toHaveValue("mockrecipient");
    });

    it("still lowercases a mixed-case bc1 segwit address for a bitcoin account", async () => {
      const { user } = setupWithTransaction(bitcoinMockTransaction, {}, bitcoinMockAccount);
      const input = screen.getByRole("textbox");

      await user.type(input, "BC1QTEST");

      await waitFor(() =>
        expect(mockedOnChangeTransaction).toHaveLastReturnedWith({
          ...bitcoinMockTransaction,
          recipient: "bc1qtest",
        }),
      );
    });
  });

  describe("recipientIsReadOnly: externally-driven recipient stays visible in the input", () => {
    const unifiedAddress =
      "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

    it("displays the address the transaction carries when the field is locked", () => {
      setup(
        { recipientIsReadOnly: true },
        { recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
      );

      const input = screen.getByTestId("send-recipient-input") as HTMLInputElement;
      expect(input).toHaveValue("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
      expect(input.readOnly).toBe(true);
      expect(screen.queryByTestId("open-camera-qrcode-scanner")).not.toBeInTheDocument();
    });

    it("displays a ~106-char unified address in full, untruncated", () => {
      expect(unifiedAddress).toHaveLength(106);

      setup({ recipientIsReadOnly: true }, { recipient: unifiedAddress });

      expect(screen.getByTestId("send-recipient-input")).toHaveValue(unifiedAddress);
    });

    it("updates the displayed value on rerender with a different external recipient, still read-only", () => {
      const { rerender } = setup(
        { recipientIsReadOnly: true },
        { recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
      );
      expect(screen.getByTestId("send-recipient-input")).toHaveValue(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      );

      rerender(
        <DomainServiceProvider>
          <RecipientField
            account={ethMockAccount}
            transaction={{ ...baseMockTransaction, recipient: unifiedAddress }}
            t={mockTFunction as unknown as TFunction}
            onChangeTransaction={mockedOnChangeTransaction}
            status={{ ...baseMockStatus, recipientIsReadOnly: true }}
          />
        </DomainServiceProvider>,
      );

      expect(screen.getByTestId("send-recipient-input")).toHaveValue(unifiedAddress);
    });

    it("clears the input on the read-only -> editable transition, leaving no stale address", () => {
      const { rerender } = setup(
        { recipientIsReadOnly: true },
        { recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
      );
      expect(screen.getByTestId("send-recipient-input")).toHaveValue(
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      );

      rerender(
        <DomainServiceProvider>
          <RecipientField
            account={ethMockAccount}
            transaction={{ ...baseMockTransaction, recipient: "" }}
            t={mockTFunction as unknown as TFunction}
            onChangeTransaction={mockedOnChangeTransaction}
            status={{ ...baseMockStatus, recipientIsReadOnly: false }}
          />
        </DomainServiceProvider>,
      );

      expect(screen.getByTestId("send-recipient-input")).toHaveValue("");
    });
  });
});
