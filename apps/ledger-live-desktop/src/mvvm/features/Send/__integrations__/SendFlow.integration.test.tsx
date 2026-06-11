import BigNumber from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { bitcoinPickingStrategy } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  createBitcoinAccount,
  createEthereumAccount,
  createMinimalBtcTransaction,
  createMinimalEvmTransaction,
  createResolvedStatus,
  navigateToAmountScreen,
  openCoinControlScreen,
  openCustomFeesScreen,
  openFeeMenu,
  renderSendFlow,
  resetSendFlowTestState,
  screen,
  waitFor,
  setMockBridgeRecipientValidation,
  setMockStatus,
  setMockStatusResolver,
  setMockTransaction,
  VALID_BTC_RECIPIENT,
  VALID_EVM_RECIPIENT,
} from "../__mocks__/sendFlowTestUtils";

describe("Send Flow Integration", () => {
  const ethereumAccount = createEthereumAccount();
  const bitcoinAccount = createBitcoinAccount();

  beforeEach(() => {
    resetSendFlowTestState("evm");
  });

  describe("Recipient step", () => {
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
      const { InvalidAddress } = jest.requireActual("@ledgerhq/errors");
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
});
