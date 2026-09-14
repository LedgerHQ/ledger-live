import BigNumber from "bignumber.js";
import userEvent from "@testing-library/user-event";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { bitcoinPickingStrategy } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  SPONSORED_FAILURE_KIND,
  SPONSORED_PHASE,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { mockContact, mockContactAddress } from "@domain/entity-contact/schema.mock";
import {
  act,
  createBitcoinAccount,
  createEthereumAccount,
  createMinimalBtcTransaction,
  createMinimalEvmTransaction,
  createMinimalTronTransaction,
  createResolvedStatus,
  createTronAccount,
  mockSponsoredOrchestrationActions,
  navigateToAmountScreen,
  openCoinControlScreen,
  openCustomFeesScreen,
  openFeeMenu,
  renderSendFlow,
  resetSendFlowTestState,
  screen,
  waitFor,
  setMockBridgeRecipientValidation,
  setMockDeviceActionResult,
  setMockOrchestrationState,
  setMockScannedCode,
  setMockContacts,
  setMockSponsoredSeam,
  setMockStatus,
  setMockStatusResolver,
  setMockTransaction,
  VALID_BTC_RECIPIENT,
  VALID_EVM_RECIPIENT,
  VALID_TRON_RECIPIENT,
} from "../__mocks__/sendFlowTestUtils";

describe("Send Flow Integration", () => {
  const ethereumAccount = createEthereumAccount();
  const bitcoinAccount = createBitcoinAccount();

  beforeEach(() => {
    resetSendFlowTestState("evm");
  });

  describe("Recipient step", () => {
    it("should start on amount when opened from a contact", async () => {
      renderSendFlow(ethereumAccount, {
        recipient: VALID_EVM_RECIPIENT,
        skipRecipientStep: true,
      });

      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
      expect(screen.getByTestId("send-amount-input")).toBeVisible();
    });

    it("should keep the recipient step when a direct recipient is empty", async () => {
      renderSendFlow(ethereumAccount, {
        recipient: "   ",
        skipRecipientStep: true,
      });

      expect(await screen.findByTestId("send-recipient-input")).toBeVisible();
      expect(screen.queryByTestId("send-amount-step")).not.toBeInTheDocument();
    });

    it("shows only contacts with addresses on the recipient network and advances directly for one address", async () => {
      setMockContacts([
        mockContact({
          id: "contact-vincent",
          name: "Vincent",
          addresses: [
            mockContactAddress({
              id: "address-vincent-eth",
              currencyId: "ethereum",
              label: "Ethereum Main",
              address: VALID_EVM_RECIPIENT,
            }),
          ],
        }),
        mockContact({
          id: "contact-solana",
          name: "Solana contact",
          addresses: [
            mockContactAddress({
              id: "address-solana",
              currencyId: "solana",
              label: "Solana",
              address: "SolanaAddress123",
            }),
          ],
        }),
      ]);
      const { user } = renderSendFlow(ethereumAccount);

      expect(await screen.findByTestId("contacts-compact-row-contact-vincent")).toBeVisible();
      expect(screen.queryByText("Solana contact")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("contacts-compact-row-contact-vincent"));
      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
    });

    it("opens address selection when a contact has several addresses on the recipient network", async () => {
      setMockContacts([
        mockContact({
          id: "contact-benoit",
          name: "Benoit",
          addresses: [
            mockContactAddress({
              id: "address-benoit-main",
              currencyId: "ethereum",
              label: "Ethereum",
              address: VALID_EVM_RECIPIENT,
            }),
            mockContactAddress({
              id: "address-benoit-coinbase",
              currencyId: "ethereum",
              label: "Ethereum Coinbase",
              address: "0x1234567890123456789012345678901234567890",
            }),
          ],
        }),
      ]);
      const { user } = renderSendFlow(ethereumAccount);

      await user.click(await screen.findByTestId("contacts-compact-row-contact-benoit"));

      expect(await screen.findByTestId("send-recipient-contact-address-selection")).toBeVisible();
      expect(screen.getAllByText("Select address")).toHaveLength(2);
      expect(screen.getAllByText("Benoit")).toHaveLength(2);
      expect(screen.queryByTestId("send-recipient-input")).not.toBeInTheDocument();

      await user.click(
        screen.getByTestId("send-recipient-contact-address-address-benoit-coinbase"),
      );
      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
    });

    it("requires choosing an address when searching for a contact with several network addresses", async () => {
      setMockContacts([
        mockContact({
          id: "contact-benoit",
          name: "Benoit",
          addresses: [
            mockContactAddress({
              id: "address-benoit-main",
              currencyId: "ethereum",
              label: "Ethereum",
              address: VALID_EVM_RECIPIENT,
            }),
            mockContactAddress({
              id: "address-benoit-coinbase",
              currencyId: "ethereum",
              label: "Ethereum Coinbase",
              address: "0x1234567890123456789012345678901234567890",
            }),
          ],
        }),
      ]);
      const { user } = renderSendFlow(ethereumAccount);

      await user.type(await screen.findByTestId("send-recipient-input"), "Benoit");

      expect(await screen.findByTestId("contacts-compact-row-contact-benoit")).toBeVisible();
      expect(screen.queryByTestId("send-recipient-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("send-matched-address-button")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("contacts-compact-row-contact-benoit"));
      expect(await screen.findByTestId("send-recipient-contact-address-selection")).toBeVisible();

      await user.click(
        screen.getByTestId("send-recipient-contact-address-address-benoit-coinbase"),
      );

      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
      expect(screen.queryByTestId("send-recipient-card")).not.toBeInTheDocument();
    });

    it("should add a new contact from the recipient card and return to recipient after review", async () => {
      setMockContacts([], true);
      const { user } = renderSendFlow(ethereumAccount);

      await user.type(await screen.findByTestId("send-recipient-input"), VALID_EVM_RECIPIENT);
      await user.click(await screen.findByTestId("send-recipient-card-add-contact"));

      expect(await screen.findByTestId("send-add-contact-step")).toBeVisible();
      await user.click(screen.getByTestId("send-add-contact-new"));

      expect(await screen.findByTestId("send-add-new-contact-step")).toBeVisible();
      const nameInput = screen.getByTestId("contacts-add-contact-name-input");
      await user.type(nameInput, "Benoit");
      await user.click(screen.getByTestId("contacts-add-contact-save"));

      expect(await screen.findByTestId("contacts-add-address-name-input")).toBeVisible();
      expect(screen.queryByTestId("send-recipient-input")).not.toBeInTheDocument();
      expect(screen.queryByTestId("send-add-new-contact-step")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("contacts-add-address-name-continue"));

      expect(await screen.findByTestId("contacts-add-address-review")).toBeVisible();
      expect(screen.queryByTestId("send-recipient-input")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("contacts-add-address-review-continue"));

      expect(await screen.findByTestId("send-recipient-input")).toBeVisible();
      expect(screen.queryByTestId("contacts-add-address-review")).not.toBeInTheDocument();
    });

    it("should add the recipient to an existing contact and return to recipient after review", async () => {
      setMockContacts(
        [
          mockContact({
            id: "contact-ada",
            name: "Ada",
            addresses: [],
          }),
        ],
        true,
      );
      const { user } = renderSendFlow(ethereumAccount);

      await user.type(await screen.findByTestId("send-recipient-input"), VALID_EVM_RECIPIENT);
      await user.click(await screen.findByTestId("send-recipient-card-add-contact"));

      expect(await screen.findByTestId("send-add-contact-step")).toBeVisible();
      await user.click(screen.getByTestId("send-add-contact-existing"));

      expect(await screen.findByTestId("send-add-to-existing-contact-step")).toBeVisible();
      await user.click(screen.getByTestId("contacts-saved-row-contact-ada"));

      expect(await screen.findByTestId("contacts-add-address-name-input")).toBeVisible();
      expect(screen.queryByTestId("send-add-to-existing-contact-step")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("contacts-add-address-name-continue"));

      expect(await screen.findByTestId("contacts-add-address-review")).toBeVisible();

      await user.click(screen.getByTestId("contacts-add-address-review-continue"));

      expect(await screen.findByTestId("send-recipient-input")).toBeVisible();
      expect(screen.queryByTestId("contacts-add-address-review")).not.toBeInTheDocument();
    });

    it("should show the collapsable security card collapsed by default and expand on click", async () => {
      const { user } = renderSendFlow(ethereumAccount);

      expect(await screen.findByTestId("send-recipient-intro-card")).toBeVisible();
      expect(screen.queryByTestId("send-recipient-security-content")).not.toBeInTheDocument();
      expect(screen.queryByTestId("send-recent-addresses-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("send-my-accounts-section")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("send-recipient-security-toggle"));

      expect(screen.getByTestId("send-recipient-security-content")).toBeVisible();

      await user.click(screen.getByTestId("send-recipient-security-toggle"));

      expect(screen.queryByTestId("send-recipient-security-content")).not.toBeInTheDocument();
    });

    it("should open the recent history step for a new address and return to recipient", async () => {
      const { user } = renderSendFlow(ethereumAccount);
      const recipientInput = await screen.findByTestId("send-recipient-input");

      await user.type(recipientInput, VALID_EVM_RECIPIENT);

      expect(await screen.findByTestId("send-recent-history-warning")).toBeVisible();

      await user.click(screen.getByRole("button", { name: /learn more/i }));

      expect(await screen.findByTestId("send-recipient-recent-history-step")).toBeVisible();
      expect(screen.queryByTestId("send-recent-history-warning")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("send-recipient-recent-history-step-close"));

      await waitFor(() => {
        expect(screen.queryByTestId("send-recipient-recent-history-step")).not.toBeInTheDocument();
        expect(screen.getByTestId("send-recent-history-warning")).toBeVisible();
      });
    });

    it("should open the QR scanner from the empty recipient field and fill it with the scanned address", async () => {
      setMockScannedCode(`ethereum:${VALID_EVM_RECIPIENT}`);
      const { user } = renderSendFlow(ethereumAccount);

      expect(await screen.findByTestId("send-recipient-intro-card")).toBeVisible();

      await user.click(screen.getByRole("button", { name: /qr/i }));

      expect(await screen.findByTestId("send-recipient-qr-scanner")).toBeVisible();
      expect(screen.queryByTestId("send-recipient-intro-card")).not.toBeInTheDocument();

      await user.click(screen.getByTestId("mock-qrcode-pick"));

      await waitFor(() => {
        expect(screen.queryByTestId("send-recipient-qr-scanner")).not.toBeInTheDocument();
      });
      expect(screen.getByTestId("send-recipient-input")).toHaveValue(VALID_EVM_RECIPIENT);
    });

    it("should show the clear button instead of the QR icon once the recipient field has content", async () => {
      const { user } = renderSendFlow(ethereumAccount);
      const recipientInput = await screen.findByTestId("send-recipient-input");

      expect(screen.getByRole("button", { name: /qr/i })).toBeVisible();

      await user.type(recipientInput, VALID_EVM_RECIPIENT);

      expect(screen.queryByRole("button", { name: /qr/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /clear/i }));

      expect(recipientInput).toHaveValue("");
      expect(screen.getByRole("button", { name: /qr/i })).toBeVisible();
    });

    it("should close the QR scanner as soon as the user types an address", async () => {
      const { user } = renderSendFlow(ethereumAccount);
      const recipientInput = await screen.findByTestId("send-recipient-input");

      await user.click(screen.getByRole("button", { name: /qr/i }));
      expect(await screen.findByTestId("send-recipient-qr-scanner")).toBeVisible();

      await user.type(recipientInput, VALID_EVM_RECIPIENT);

      await waitFor(() => {
        expect(screen.queryByTestId("send-recipient-qr-scanner")).not.toBeInTheDocument();
      });
    });

    it("should not show the recent history warning for an address already sent to", async () => {
      const accountWithHistory = createEthereumAccount({
        operations: [
          {
            id: "outgoing-op-1",
            hash: "outgoing-op-1",
            type: "OUT",
            value: new BigNumber("1000"),
            fee: new BigNumber(100),
            senders: ["0x1234567890abcdef1234567890abcdef12345678"],
            recipients: [VALID_EVM_RECIPIENT],
            accountId: "mock-account-id",
            date: new Date("2026-03-01T10:00:00.000Z"),
            blockHeight: 1,
            blockHash: "block-1",
            extra: {},
          },
        ],
      });
      const { user } = renderSendFlow(accountWithHistory);
      const recipientInput = await screen.findByTestId("send-recipient-input");

      await user.type(recipientInput, VALID_EVM_RECIPIENT);

      expect(await screen.findByTestId("send-matched-address-button")).toBeVisible();
      expect(screen.queryByTestId("send-recent-history-warning")).not.toBeInTheDocument();
    });
  });

  describe("Happy path: send to valid recipient", () => {
    it("should navigate from recipient to amount screen", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({
          amount: new BigNumber("10000000000000000"),
          recipient: VALID_EVM_RECIPIENT,
        }),
      );

      const { user } = renderSendFlow(ethereumAccount);
      const recipientInput = await screen.findByTestId("send-recipient-input");
      await user.type(recipientInput, VALID_EVM_RECIPIENT);
      const matchedButton = await screen.findByTestId("send-matched-address-button");
      await user.click(matchedButton);

      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
      expect(screen.getByTestId("send-review-button")).not.toBeDisabled();
    });

    it("should navigate to signature step after review", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({
          amount: new BigNumber("10000000000000000"),
          recipient: VALID_EVM_RECIPIENT,
        }),
      );

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);
      await user.click(screen.getByTestId("send-review-button"));

      expect(await screen.findByTestId("send-signature-step")).toBeVisible();
    });
  });

  describe("Invalid amount", () => {
    it("should show get-funds button when balance is insufficient", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({
          amount: new BigNumber("99000000000000000000"),
          recipient: VALID_EVM_RECIPIENT,
        }),
      );
      setMockStatus(createResolvedStatus({ amount: new NotEnoughBalance() }));

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);

      expect(await screen.findByTestId("send-get-funds-button")).toBeVisible();
    });

    it("should disable review when no amount is entered", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({ amount: new BigNumber(0), recipient: VALID_EVM_RECIPIENT }),
      );

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);

      expect(screen.getByTestId("send-review-button")).toBeDisabled();
    });
  });

  describe("Invalid recipient", () => {
    it("should not allow proceeding with invalid address", async () => {
      const { InvalidAddress } = jest.requireActual("@ledgerhq/ledger-wallet-framework/errors");
      setMockBridgeRecipientValidation({
        errors: { recipient: new InvalidAddress() },
        warnings: {},
        isLoading: false,
      });

      const { user } = renderSendFlow(ethereumAccount);
      const recipientInput = await screen.findByTestId("send-recipient-input");
      await user.type(recipientInput, "not-a-valid-address");

      expect(await screen.findByTestId("address-validation-status")).toBeVisible();
      expect(screen.queryByTestId("send-matched-address-button")).not.toBeInTheDocument();
    });
  });

  describe("Fee strategy", () => {
    it("should display network fees row on amount screen", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({ amount: new BigNumber(0), recipient: VALID_EVM_RECIPIENT }),
      );

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);

      expect(screen.getByTestId("send-network-fees-row")).toBeVisible();
    });

    it("should show fee menu trigger for EVM currencies", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({ amount: new BigNumber(0), recipient: VALID_EVM_RECIPIENT }),
      );

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);

      expect(screen.getByTestId("send-network-fees-menu-trigger")).toBeVisible();
    });

    it("should update the selected strategy when picking a preset", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({ amount: new BigNumber(0), recipient: VALID_EVM_RECIPIENT }),
      );

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);

      expect(screen.getByTestId("send-network-fees-menu-trigger")).toHaveTextContent(/medium/i);

      await openFeeMenu(user);
      await user.click(await screen.findByTestId("send-fees-preset-fast"));

      await waitFor(() =>
        expect(screen.getByTestId("send-network-fees-menu-trigger")).toHaveTextContent(/fast/i),
      );
    });
  });

  describe("Custom fees", () => {
    it("should apply EVM custom fees on the happy path", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({
          amount: new BigNumber("10000000000000000"),
          recipient: VALID_EVM_RECIPIENT,
          maxPriorityFeePerGas: new BigNumber("2000000000"),
          maxFeePerGas: new BigNumber("10000000000"),
        }),
      );

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);
      await openCustomFeesScreen(user);

      expect(await screen.findAllByRole("textbox")).toHaveLength(2);
      expect(screen.getByRole("button", { name: /confirm/i })).not.toBeDisabled();

      await user.click(screen.getByRole("button", { name: /confirm/i }));

      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
      expect(screen.getByTestId("send-review-button")).not.toBeDisabled();
    });

    it("should show get-funds after confirming insufficient EVM custom fees", async () => {
      setMockTransaction(
        createMinimalEvmTransaction({
          amount: new BigNumber("10000000000000000"),
          recipient: VALID_EVM_RECIPIENT,
          maxPriorityFeePerGas: new BigNumber("2000000000"),
          maxFeePerGas: new BigNumber("10000000000"),
        }),
      );
      setMockStatusResolver((transaction: Transaction) => {
        const maxFeePerGas = "maxFeePerGas" in transaction ? transaction.maxFeePerGas : undefined;

        if (
          BigNumber.isBigNumber(maxFeePerGas) &&
          maxFeePerGas.gte(new BigNumber("50000000000000"))
        ) {
          return createResolvedStatus({ amount: new NotEnoughBalance() });
        }

        return createResolvedStatus();
      });

      const { user } = renderSendFlow(ethereumAccount);
      await navigateToAmountScreen(user);
      await openCustomFeesScreen(user);

      const feeInputs = await screen.findAllByRole("textbox");
      await user.clear(feeInputs[1]);
      await user.type(feeInputs[1], "50000");

      expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
      expect(screen.getByTestId("send-dialog-header")).toBeVisible();
      expect(screen.queryByTestId("send-amount-step")).not.toBeInTheDocument();
    });

    it("should apply bitcoin sat/vbyte custom fees on the happy path", async () => {
      resetSendFlowTestState("bitcoin");
      setMockTransaction(
        createMinimalBtcTransaction({
          amount: new BigNumber("1000"),
          recipient: VALID_BTC_RECIPIENT,
          feesStrategy: "custom",
          feePerByte: new BigNumber(20),
        }),
      );

      const { user } = renderSendFlow(bitcoinAccount);
      await navigateToAmountScreen(user, VALID_BTC_RECIPIENT);
      await openCustomFeesScreen(user);

      expect(await screen.findAllByRole("textbox")).toHaveLength(1);
      expect(screen.getByRole("button", { name: /confirm/i })).not.toBeDisabled();

      await user.click(screen.getByRole("button", { name: /confirm/i }));

      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
      expect(screen.getByTestId("send-review-button")).not.toBeDisabled();
    });

    it("should show get-funds after confirming insufficient bitcoin sat/vbyte custom fees", async () => {
      resetSendFlowTestState("bitcoin");
      setMockTransaction(
        createMinimalBtcTransaction({
          amount: new BigNumber("1000"),
          recipient: VALID_BTC_RECIPIENT,
          feesStrategy: "custom",
          feePerByte: new BigNumber(20),
        }),
      );
      setMockStatusResolver((transaction: Transaction) => {
        const feePerByte = "feePerByte" in transaction ? transaction.feePerByte : undefined;

        if (BigNumber.isBigNumber(feePerByte) && feePerByte.gte(new BigNumber(5000))) {
          return createResolvedStatus({ amount: new NotEnoughBalance() });
        }

        return createResolvedStatus();
      });

      const { user } = renderSendFlow(bitcoinAccount);
      await navigateToAmountScreen(user, VALID_BTC_RECIPIENT);
      await openCustomFeesScreen(user);

      const [feePerByteInput] = await screen.findAllByRole("textbox");
      await user.clear(feePerByteInput);
      await user.type(feePerByteInput, "5000");
      await user.click(screen.getByRole("button", { name: /confirm/i }));

      expect(await screen.findByTestId("send-amount-step")).toBeVisible();
      expect(await screen.findByTestId("send-get-funds-button")).toBeVisible();
    });
  });

  describe("Coin control", () => {
    beforeEach(() => {
      resetSendFlowTestState("bitcoin");
    });

    it("should keep review available in coin control on the happy path", async () => {
      setMockTransaction(
        createMinimalBtcTransaction({
          amount: new BigNumber("1000"),
          recipient: VALID_BTC_RECIPIENT,
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
            excludeUTXOs: [],
          },
        }),
      );
      setMockStatus(
        createResolvedStatus(
          {},
          {
            estimatedFees: new BigNumber(250),
            txOutputs: [{ isChange: true, value: new BigNumber(100) }],
          },
        ),
      );

      const { user } = renderSendFlow(bitcoinAccount);
      await navigateToAmountScreen(user, VALID_BTC_RECIPIENT);
      await openCoinControlScreen(user);

      expect(await screen.findByTestId("send-coin-control-footer")).toBeVisible();
      expect(screen.getByTestId("send-change-to-return-row")).toBeVisible();
      expect(screen.getByTestId("send-review-button")).not.toBeDisabled();
    });

    it("should show get-funds in coin control when the amount is insufficient", async () => {
      setMockTransaction(
        createMinimalBtcTransaction({
          amount: new BigNumber("150000000"),
          recipient: VALID_BTC_RECIPIENT,
          utxoStrategy: {
            strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
            excludeUTXOs: [],
          },
        }),
      );
      setMockStatus(
        createResolvedStatus(
          { amount: new NotEnoughBalance() },
          {
            estimatedFees: new BigNumber(250),
            txOutputs: [{ isChange: true, value: new BigNumber(0) }],
          },
        ),
      );

      const { user } = renderSendFlow(bitcoinAccount);
      await navigateToAmountScreen(user, VALID_BTC_RECIPIENT);
      await openCoinControlScreen(user);

      expect(await screen.findByTestId("send-coin-control-footer")).toBeVisible();
      expect(await screen.findByTestId("send-get-funds-button")).toBeVisible();
    });
  });

  describe("Sponsored send (TRON Tronify)", () => {
    const tronAccount = createTronAccount();
    // Known constant used to build the TX-A device signature the way coin-tron's combine() actually
    // shapes it (see recoverDeviceSignature: combined.slice(4 + rawDataHex.length)).
    const rawDataHex = "0a02abcd";
    const rentOrder = {
      orderId: "order-1",
      transaction: {
        visible: true,
        txID: "tx-a-id",
        raw_data: {},
        raw_data_hex: rawDataHex,
      },
      payCoinCode: "TRX",
      payCoinAmt: "5",
    };

    beforeEach(() => {
      resetSendFlowTestState("tron");
      setMockTransaction(
        createMinimalTronTransaction({
          amount: new BigNumber("1000000"),
          recipient: VALID_TRON_RECIPIENT,
        }),
      );
    });

    // Fake timers for the whole test, not switched mid-flight: SponsoredPolling's
    // setInterval(...,1000) otherwise defeats React's async act() flush loop under real timers
    // (the interval keeps firing while act() waits for quiescence), hanging the test to the 5s
    // asyncUtilTimeout non-deterministically. A partial/mid-test switch to fake timers was tried
    // and breaks other microtask chains instead — timers must be consistent start-to-finish.
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    /**
     * Navigates AMOUNT -> FEE_PAYMENT (select Tronify) -> AMOUNT -> review -> SPONSORED_RENT_SIGNATURE.
     * The mocked orchestration (see sendFlowTestUtils' useSponsoredSendOrchestration mock) starts in
     * RENT_SIGNING with no order, so the screen's craft-on-entry effect fires actions.craftRent()
     * (our spy) exactly once and the screen renders observably mid-craft (isCrafting=true, no
     * DeviceAction mounted yet) until the test pushes an order in via setMockOrchestrationState.
     */
    async function navigateToRentSignature(user: ReturnType<typeof renderSendFlow>["user"]) {
      await navigateToAmountScreen(user, VALID_TRON_RECIPIENT);
      expect(await screen.findByTestId("send-sponsored-fee-nudge")).toBeVisible();

      await user.click(screen.getByTestId("send-fee-payment-entry"));
      expect(await screen.findByTestId("send-fee-payment-options")).toBeVisible();

      await user.click(screen.getByTestId("send-fee-payment-option-tronify"));
      expect(await screen.findByTestId("send-amount-step")).toBeVisible();

      await user.click(screen.getByTestId("send-review-button"));
      expect(await screen.findByTestId("send-sponsored-rent-signature")).toBeVisible();
    }

    it("runs the sponsored happy path: rent signature -> polling -> transfer signature -> confirmation", async () => {
      const listFeeOptions = jest.fn().mockResolvedValue([
        { id: "tronify", feeAsset: {} },
        { id: "standard", feeAsset: {} },
      ]);
      const estimateSponsoredFeeQuote = jest
        .fn()
        .mockResolvedValue({ value: 1000n, originalValue: 5000n, savings: 4000n });
      // Only the fee-nudge/option-list seam calls matter here (useSponsoredFee) — the rent-payment
      // seam calls (craft/submit/deliver) live inside the now-mocked orchestration hook and are
      // never reached from this test; fakeSponsoredSeam's defaults for those fields are unused.
      setMockSponsoredSeam({ listFeeOptions, estimateSponsoredFeeQuote });

      renderSendFlow(tronAccount, {}, { flags: { gasSponsorship: { enabled: true } } });
      // Not the `user` renderSendFlow returns: under fake timers, userEvent needs
      // advanceTimers wired to its own event-loop advance or user.type/click hang forever.
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
        pointerEventsCheck: 0,
      });

      await navigateToRentSignature(user);
      expect(mockSponsoredOrchestrationActions.craftRent).toHaveBeenCalledTimes(1);

      // TX-A: set the device result, then push the crafted order in — the mocked DeviceAction
      // mounts for the first time (order truthy -> request non-null) and immediately consumes it,
      // driving the real onResult -> actions.startRentPayment call synchronously.
      setMockDeviceActionResult({
        signedOperation: { signature: "0008" + rawDataHex + "SIGA" },
        device: {},
      });
      await act(async () => {
        setMockOrchestrationState({ order: rentOrder });
      });

      // Proves the signature recovered from the TX-A device result is what reaches the rent-payment
      // action — the stand-in for asserting the seam's submitEnergyRentPayment call, which now lives
      // inside the mocked-out orchestration and is never exercised from this test.
      expect(mockSponsoredOrchestrationActions.startRentPayment).toHaveBeenCalledWith(
        expect.objectContaining({ signature: ["SIGA"] }),
        "tx-a-id",
      );

      // Step the phase the way the real orchestration would once startRentPayment begins polling.
      await act(async () => {
        setMockOrchestrationState({ phase: SPONSORED_PHASE.POLLING, paymentTxId: "tx-a-id" });
      });
      expect(await screen.findByTestId("send-sponsored-polling")).toBeVisible();

      // TX-C: swap the device result before delivery "succeeds", so the standard SIGNATURE screen's
      // fresh DeviceAction consumes this value rather than TX-A's stale one.
      setMockDeviceActionResult({ signedOperation: { signature: "tx-c-signature" }, device: {} });
      await act(async () => {
        setMockOrchestrationState({ phase: SPONSORED_PHASE.TRANSFER });
      });

      expect(await screen.findByTestId("send-confirmation-step")).toBeVisible();
      expect(screen.getByTestId("send-confirmation-success-content")).toBeVisible();
    });

    it("lands on SPONSORED_FAILURE with retry/cancel when energy delivery times out", async () => {
      const listFeeOptions = jest.fn().mockResolvedValue([
        { id: "tronify", feeAsset: {} },
        { id: "standard", feeAsset: {} },
      ]);
      const estimateSponsoredFeeQuote = jest
        .fn()
        .mockResolvedValue({ value: 1000n, originalValue: 5000n, savings: 4000n });
      setMockSponsoredSeam({ listFeeOptions, estimateSponsoredFeeQuote });

      renderSendFlow(tronAccount, {}, { flags: { gasSponsorship: { enabled: true } } });
      const user = userEvent.setup({
        advanceTimers: jest.advanceTimersByTime,
        pointerEventsCheck: 0,
      });

      await navigateToRentSignature(user);
      expect(mockSponsoredOrchestrationActions.craftRent).toHaveBeenCalledTimes(1);

      setMockDeviceActionResult({
        signedOperation: { signature: "0008" + rawDataHex + "SIGA" },
        device: {},
      });
      await act(async () => {
        setMockOrchestrationState({ order: rentOrder });
      });
      expect(mockSponsoredOrchestrationActions.startRentPayment).toHaveBeenCalledWith(
        expect.objectContaining({ signature: ["SIGA"] }),
        "tx-a-id",
      );

      await act(async () => {
        setMockOrchestrationState({ phase: SPONSORED_PHASE.POLLING, paymentTxId: "tx-a-id" });
      });
      expect(await screen.findByTestId("send-sponsored-polling")).toBeVisible();

      // Shaped exactly like useSponsoredSendOrchestration's own delivery-timeout dispatch
      // (error.name === "EnergyDelegationTimeoutError"), which maps to the DELIVERY_FAILED kind.
      await act(async () => {
        setMockOrchestrationState({
          phase: SPONSORED_PHASE.FAILED,
          failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED,
          failureError: Object.assign(new Error("energy delivery timed out"), {
            name: "EnergyDelegationTimeoutError",
          }),
        });
      });

      expect(await screen.findByTestId("send-sponsored-failure")).toBeVisible();
      expect(screen.getByTestId("send-sponsored-failure-retry")).toBeVisible();
      expect(screen.getByTestId("send-sponsored-failure-cancel")).toBeVisible();
      // Not just "some failure screen": the delivery-failed copy specifically (distinct from the
      // other three failureKind messages), confirming this is the DELIVERY_FAILED branch.
      expect(screen.getByText(/Energy was not delivered/i)).toBeVisible();
    });
  });
});
