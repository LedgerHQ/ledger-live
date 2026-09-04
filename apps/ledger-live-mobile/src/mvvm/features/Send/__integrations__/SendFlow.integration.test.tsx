import * as React from "react";
import { TextInput as RNTextInput } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { setEnv } from "@shared/env";
import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  act,
  fireEvent,
  renderWithReactQuery,
  screen,
  withFlagOverrides,
} from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import { SendFlowOrchestrator } from "../SendFlowOrchestrator";
import { SEND_FLOW_CONFIG } from "../constants";
import { RecipientScreen } from "../screens/Recipient";
import { AmountScreen } from "../screens/Amount";
import { CustomFeesScreen } from "../screens/CustomFees";
import { CoinControlScreen } from "../screens/CoinControl";
import { SignatureScreen } from "../screens/Signature";
import { ConfirmationScreen } from "../screens/Confirmation";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";

const stellarCurrency = getCryptoCurrencyById("stellar");
const ethereumCurrency = getCryptoCurrencyById("ethereum");
const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const accountStellar = genAccount("send-stellar-account", { currency: stellarCurrency });
const accountEthereum = genAccount("send-ethereum-account", { currency: ethereumCurrency });
const accountBitcoin = genAccount("send-bitcoin-account", { currency: bitcoinCurrency });

const recipientEthereum = genAccount("recipient-ethereum", { currency: ethereumCurrency });
const recipientBitcoin = genAccount("recipient-bitcoin", { currency: bitcoinCurrency });

const VALID_STELLAR_RECIPIENT = "GAUFLBKWAXBQGM5IXXYU33VVNHIB6UPBC3TF3GFPLKIWTOSI5AYU75TF";
const VALID_ETHEREUM_RECIPIENT = recipientEthereum.freshAddress;
const VALID_BITCOIN_RECIPIENT = recipientBitcoin.freshAddress;
const MEMO_VALUE = "test-memo";

const stepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.RECENT_HISTORY]: () => null,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.CUSTOM_FEES]: CustomFeesScreen,
  [SEND_FLOW_STEP.COIN_CONTROL]: CoinControlScreen,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
};

const HostStack = createNativeStackNavigator();

type DriveOpts = Readonly<{
  recipient: string;
  memo?: string;
}>;

type RenderForAccountOptions = Readonly<{
  contactsEnabled?: boolean;
  contacts?: State["contacts"]["contacts"];
}>;

jest.mock("LLM/features/Contacts/hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: () => ({
    validateAddress: async ({ address }: { address: string }) => ({
      status: "valid",
      resolvedAddress: address,
      isDomain: false,
    }),
  }),
}));

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  const React = jest.requireActual<typeof import("react")>("react");
  const { QueuedBottomSheet } = actual;

  function MockQueuedBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onOpened,
    ...props
  }: import("@shared/ui-queued-bottom-sheet").QueuedBottomSheetProps) {
    const shouldOpen = !!(isRequestingToBeOpened || isForcingToBeOpened);
    React.useEffect(() => {
      if (shouldOpen) {
        onOpened?.();
      }
    }, [onOpened, shouldOpen]);
    return (
      <QueuedBottomSheet
        isRequestingToBeOpened={isRequestingToBeOpened}
        isForcingToBeOpened={isForcingToBeOpened}
        onOpened={onOpened}
        {...props}
      />
    );
  }

  return {
    ...actual,
    QueuedBottomSheet: MockQueuedBottomSheet,
  };
});

jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const actual = jest.requireActual("LLM/components/DeviceIntentExecutor");
  const ReactModule = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    ...actual,
    DeviceIntentExecutorLWM: () =>
      ReactModule.createElement(View, { testID: "device-intent-executor" }),
  };
});

jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(undefined),
  deactivateKeepAwake: jest.fn(),
  useKeepAwake: jest.fn(),
}));

async function flushTimers(): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(600);
  });
}

describe("Send flow integration tests", () => {
  beforeAll(() => {
    setEnv("MOCK", "1");
  });

  afterAll(() => {
    setEnv("MOCK", "");
  });

  function SendPage({ initParams }: { initParams: SendFlowInitParams }) {
    return (
      <HostStack.Navigator screenOptions={{ headerShown: false }}>
        <HostStack.Screen name="SendHost">
          {() => (
            <SendFlowOrchestrator
              initParams={initParams}
              onClose={() => {}}
              stepRegistry={stepRegistry}
              flowConfig={SEND_FLOW_CONFIG}
            />
          )}
        </HostStack.Screen>
      </HostStack.Navigator>
    );
  }

  function renderForAccount(
    account: Account,
    initParams: Omit<SendFlowInitParams, "account"> = {},
    options: RenderForAccountOptions = {},
  ) {
    const withAccount = (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
      contacts: options.contacts ? { contacts: options.contacts } : state.contacts,
    });

    return renderWithReactQuery(<SendPage initParams={{ account, ...initParams }} />, {
      overrideInitialState: options.contactsEnabled
        ? withFlagOverrides(
            {
              lwmContacts: {
                enabled: true,
                params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
              },
            },
            withAccount,
          )
        : withAccount,
    });
  }

  async function driveToAmount(
    user: ReturnType<typeof renderForAccount>["user"],
    opts: DriveOpts,
  ): Promise<void> {
    // EVM enables ENS resolution so the placeholder is "Enter address or ENS";
    // every other family uses "Enter address".
    const recipientInput = await screen.findByPlaceholderText(/^Enter address( or ENS)?$/);
    await user.paste(recipientInput, opts.recipient);
    await flushTimers();
    if (opts.memo !== undefined) {
      const memoInput = await screen.findByTestId("send-memo-input");
      await user.paste(memoInput, opts.memo);
    }
    await user.press(await screen.findByText(/^Send to /));
    await screen.findByText("Review");
  }

  function findInputByLabel(labelText: string | RegExp) {
    const labelNode = screen.getByText(labelText);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = labelNode;
    for (let i = 0; i < 6; i++) {
      node = node?.parent;
      if (!node) break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input = node.children?.find?.((c: any) => c?.type === RNTextInput);
      if (input) return input;
    }
    throw new Error(`No TextInput found near label "${String(labelText)}"`);
  }

  it("should prefill and validate the recipient from the initial parameters", async () => {
    const { user } = renderForAccount(accountEthereum, {
      recipient: VALID_ETHEREUM_RECIPIENT,
    });

    expect(await screen.findByDisplayValue(VALID_ETHEREUM_RECIPIENT)).toBeOnTheScreen();

    await flushTimers();
    await user.press(await screen.findByText(/^Send to /));

    expect(await screen.findByText("Review")).toBeOnTheScreen();
  });

  it("should open recipient from amount without stacking a second amount", async () => {
    const benoit = mockContact({
      id: "contact-benoit",
      name: "Benoit",
      addresses: [
        mockContactAddress({
          id: "address-benoit-eth",
          currencyId: "ethereum",
          label: "Ethereum",
          address: VALID_ETHEREUM_RECIPIENT,
        }),
        mockContactAddress({
          id: "address-benoit-coinbase",
          currencyId: "ethereum",
          label: "Ethereum Coinbase",
          address: "0x1234567890123456789012345678901234567890",
        }),
      ],
    });
    const { user } = renderForAccount(
      accountEthereum,
      { recipient: VALID_ETHEREUM_RECIPIENT, skipRecipientStep: true },
      { contactsEnabled: true, contacts: [mockMeContact(), benoit] },
    );

    expect(await screen.findByLabelText("Edit recipient")).toBeVisible();
    expect(screen.getByText("Benoit")).toBeVisible();

    await user.press(screen.getByLabelText("Edit recipient"));

    expect(await screen.findByDisplayValue("Benoit")).toBeVisible();

    await user.press(await screen.findByTestId("contacts-compact-row-contact-benoit"));
    expect(await screen.findByText("Select Benoit's address")).toBeVisible();
    await user.press(screen.getByLabelText(`Ethereum, ${VALID_ETHEREUM_RECIPIENT}`));

    expect(await screen.findByLabelText("Edit recipient")).toBeVisible();
    expect(screen.queryByLabelText("Back")).not.toBeVisible();
    expect(screen.queryByPlaceholderText("Enter address, ENS or contact")).not.toBeVisible();
  });

  it("should show a truncated address on amount when the recipient is not a contact", async () => {
    const { user } = renderForAccount(
      accountEthereum,
      { recipient: VALID_ETHEREUM_RECIPIENT, skipRecipientStep: true },
      { contactsEnabled: true },
    );

    expect(await screen.findByLabelText("Edit recipient")).toBeVisible();
    expect(
      screen.getByDisplayValue(
        formatAddress(VALID_ETHEREUM_RECIPIENT, SEND_ADDRESS_FORMAT_OPTIONS),
      ),
    ).toBeVisible();
    expect(screen.queryByText("Benoit")).not.toBeOnTheScreen();

    await user.press(screen.getByLabelText("Edit recipient"));

    expect(await screen.findByDisplayValue(VALID_ETHEREUM_RECIPIENT)).toBeVisible();
  });

  it("should show a truncated address on amount when contacts are off", async () => {
    const benoit = mockContact({
      id: "contact-benoit",
      name: "Benoit",
      addresses: [
        mockContactAddress({
          id: "address-benoit-eth",
          currencyId: "ethereum",
          label: "Ethereum",
          address: VALID_ETHEREUM_RECIPIENT,
        }),
      ],
    });
    renderForAccount(
      accountEthereum,
      { recipient: VALID_ETHEREUM_RECIPIENT, skipRecipientStep: true },
      { contactsEnabled: false, contacts: [mockMeContact(), benoit] },
    );

    expect(await screen.findByLabelText("Edit recipient")).toBeVisible();
    expect(
      screen.getByDisplayValue(
        formatAddress(VALID_ETHEREUM_RECIPIENT, SEND_ADDRESS_FORMAT_OPTIONS),
      ),
    ).toBeVisible();
    expect(screen.queryByText("Benoit")).not.toBeOnTheScreen();
  });

  it("should keep add contact enabled when the network supports the address book", async () => {
    const { user } = renderForAccount(accountEthereum, {}, { contactsEnabled: true });

    await user.paste(
      await screen.findByPlaceholderText("Enter address, ENS or contact"),
      VALID_ETHEREUM_RECIPIENT,
    );
    await flushTimers();

    expect(await screen.findByRole("button", { name: "Add contact" })).toBeEnabled();
  });

  it("should add a new contact from the recipient card and return to recipient after review", async () => {
    const { user } = renderForAccount(accountEthereum, {}, { contactsEnabled: true });

    await user.paste(
      await screen.findByPlaceholderText("Enter address, ENS or contact"),
      VALID_ETHEREUM_RECIPIENT,
    );
    await flushTimers();
    await user.press(await screen.findByRole("button", { name: "Add contact" }));
    await user.press(await screen.findByTestId("send-add-contact-new"));

    const nameInput = await screen.findByTestId("contacts-add-contact-name-input");
    await user.type(nameInput, "Benoit");
    await user.press(await screen.findByTestId("contacts-add-contact-save"));
    await flushTimers();

    expect(await screen.findByText("Name address")).toBeVisible();
    expect(await screen.findByTestId("contacts-add-address-name-input")).toBeVisible();
    await user.press(await screen.findByTestId("contacts-add-address-name-continue"));

    expect(await screen.findByText("Review address")).toBeVisible();
    expect(await screen.findByTestId("contacts-add-address-review-continue")).toBeVisible();
    await user.press(await screen.findByTestId("contacts-add-address-review-continue"));
    await flushTimers();

    expect(await screen.findByPlaceholderText("Enter address, ENS or contact")).toBeVisible();
    expect(await screen.findByText("Benoit")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Add contact" })).toBeNull();
    expect(screen.queryByTestId("contacts-add-address-review")).toBeNull();
    expect(screen.queryByTestId("contacts-add-contact-name-input")).toBeNull();
  });

  it("should add the recipient to an existing contact and return to recipient after review", async () => {
    const ada = mockContact({
      id: "contact-ada",
      name: "Ada",
      addresses: [],
    });
    const { user } = renderForAccount(
      accountEthereum,
      {},
      { contactsEnabled: true, contacts: [mockMeContact(), ada] },
    );

    await user.paste(
      await screen.findByPlaceholderText("Enter address, ENS or contact"),
      VALID_ETHEREUM_RECIPIENT,
    );
    await flushTimers();
    await user.press(await screen.findByRole("button", { name: "Add contact" }));
    await user.press(await screen.findByTestId("send-add-contact-existing"));

    expect(await screen.findByTestId("send-add-to-existing-contact-step")).toBeVisible();
    expect(await screen.findByText("Select contact")).toBeVisible();
    await user.press(await screen.findByTestId("contacts-saved-contact-contact-ada"));
    await flushTimers();

    expect(await screen.findByText("Name address")).toBeVisible();
    expect(await screen.findByTestId("contacts-add-address-name-input")).toBeVisible();
    expect(screen.queryByTestId("send-add-to-existing-contact-step")).toBeNull();
    await user.press(await screen.findByTestId("contacts-add-address-name-continue"));

    expect(await screen.findByText("Review address")).toBeVisible();
    await user.press(await screen.findByTestId("contacts-add-address-review-continue"));
    await flushTimers();

    expect(await screen.findByPlaceholderText("Enter address, ENS or contact")).toBeVisible();
    expect(await screen.findByText("Ada")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Add contact" })).toBeNull();
    expect(screen.queryByTestId("contacts-add-address-review")).toBeNull();
    expect(screen.queryByTestId("send-add-to-existing-contact-step")).toBeNull();
  });

  it("should show network contacts and open the address sheet for a contact with one address", async () => {
    const contacts = [
      mockContact({
        id: "contact-vincent",
        name: "Vincent",
        addresses: [
          mockContactAddress({
            id: "address-vincent-eth",
            currencyId: "ethereum",
            label: "Ethereum Main",
            address: VALID_ETHEREUM_RECIPIENT,
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
    ];
    const { user } = renderForAccount(accountEthereum, {}, { contactsEnabled: true, contacts });

    expect(await screen.findByTestId("contacts-compact-row-contact-vincent")).toBeVisible();
    expect(screen.queryByText("Solana contact")).toBeNull();

    await user.press(screen.getByTestId("contacts-compact-row-contact-vincent"));

    expect(await screen.findByText("Select Vincent's address")).toBeVisible();
    await user.press(screen.getByLabelText("Ethereum Main, " + VALID_ETHEREUM_RECIPIENT));

    expect(await screen.findByText("Review")).toBeVisible();
  });

  it("should open the address sheet when a contact has several network addresses", async () => {
    const contacts = [
      mockContact({
        id: "contact-benoit",
        name: "Benoit",
        addresses: [
          mockContactAddress({
            id: "address-benoit-main",
            currencyId: "ethereum",
            label: "Ethereum",
            address: VALID_ETHEREUM_RECIPIENT,
          }),
          mockContactAddress({
            id: "address-benoit-coinbase",
            currencyId: "ethereum",
            label: "Ethereum Coinbase",
            address: "0x1234567890123456789012345678901234567890",
          }),
        ],
      }),
    ];
    const { user } = renderForAccount(accountEthereum, {}, { contactsEnabled: true, contacts });

    await user.press(await screen.findByTestId("contacts-compact-row-contact-benoit"));

    expect(await screen.findByText("Select Benoit's address")).toBeVisible();

    await user.press(
      screen.getByLabelText("Ethereum Coinbase, 0x1234567890123456789012345678901234567890"),
    );

    expect(await screen.findByText("Review")).toBeVisible();
  });

  it("should explain why add contact is unavailable on an unsupported network", async () => {
    const { user } = renderForAccount(accountBitcoin, {}, { contactsEnabled: true });

    await user.paste(await screen.findByPlaceholderText("Enter address"), VALID_BITCOIN_RECIPIENT);
    await flushTimers();

    await user.press(await screen.findByRole("button", { name: "Add contact" }));

    expect(await screen.findByText("Bitcoin isn't supported yet")).toBeVisible();
    expect(
      screen.getByText(
        "You can't add a Bitcoin address to your contacts yet. We're adding more cryptos over time.",
      ),
    ).toBeVisible();
  });

  describe("Stellar (memo flow)", () => {
    it("Should walk through Recipient → Amount and reach the Signature step", async () => {
      const { user } = renderForAccount(accountStellar);

      await driveToAmount(user, { recipient: VALID_STELLAR_RECIPIENT, memo: MEMO_VALUE });

      await user.press(await screen.findByText("50%"));
      await user.press(screen.getByText("Review"));

      // The signature step is now rendered as a co-located overlay (the Device Intent Executor and
      // the bottom sheet it owns) instead of a dedicated navigation modal screen.
      expect(await screen.findByTestId("send-signature-step")).toBeOnTheScreen();
      expect(await screen.findByTestId("device-intent-executor")).toBeOnTheScreen();
    });

    it("Should stop with invalid recipient", async () => {
      const { user } = renderForAccount(accountStellar);

      await user.type(await screen.findByPlaceholderText("Enter address"), "invalid-recipient");

      expect(await screen.findByText("Incorrect address format")).toBeOnTheScreen();
    });

    it("Should stop with invalid amount", async () => {
      const { user } = renderForAccount(accountStellar);

      await driveToAmount(user, { recipient: VALID_STELLAR_RECIPIENT, memo: MEMO_VALUE });

      await user.press(screen.getByLabelText("Toggle currency"));

      for (const digit of "14") {
        const matches = screen.getAllByText(digit);
        await user.press(matches[matches.length - 1]);
        await flushTimers();
      }

      expect(await screen.findByText(/Balance cannot be below/)).toBeOnTheScreen();
    });
  });

  describe("Bitcoin custom fees (sat/vbyte)", () => {
    async function openCustomFees(user: ReturnType<typeof renderForAccount>["user"]) {
      // The fee selector bottom sheet content is rendered inline by the gorhom
      // mock, so the "Custom fees" link inside it is directly tappable. The
      // same label also appears once outside the sheet (in the lumen overlay
      // chrome), so we tap the last match.
      const matches = screen.getAllByText("Custom fees");
      await user.press(matches[matches.length - 1]);
    }

    it("Should open Custom fees, accept a valid sat/vbyte value, and return to Amount", async () => {
      const { user } = renderForAccount(accountBitcoin);
      await driveToAmount(user, { recipient: VALID_BITCOIN_RECIPIENT });

      await openCustomFees(user);

      const feeInput = findInputByLabel(/Fees amount \(sat\/vbyte\)/);
      fireEvent.changeText(feeInput, "10");

      await user.press(screen.getByText("Confirm"));
      expect(await screen.findByText("Review")).toBeOnTheScreen();
    });

    it("Should show 'Enter a valid number' for an invalid sat/vbyte value", async () => {
      const { user } = renderForAccount(accountBitcoin);
      await driveToAmount(user, { recipient: VALID_BITCOIN_RECIPIENT });

      await openCustomFees(user);

      const feeInput = findInputByLabel(/Fees amount \(sat\/vbyte\)/);
      fireEvent.changeText(feeInput, "0");

      expect(await screen.findByText("Enter a valid number")).toBeOnTheScreen();
    });
  });

  describe("EVM custom fees (gas)", () => {
    async function openCustomFees(user: ReturnType<typeof renderForAccount>["user"]) {
      const matches = screen.getAllByText("Custom fees");
      await user.press(matches[matches.length - 1]);
    }

    it("Should open Custom fees, accept valid gas values, and return to Amount", async () => {
      const { user } = renderForAccount(accountEthereum);
      await driveToAmount(user, { recipient: VALID_ETHEREUM_RECIPIENT });

      await openCustomFees(user);

      const maxFee = findInputByLabel(/Max fee \(Gwei\)/);
      const maxPriorityFee = findInputByLabel(/Max priority fee \(Gwei\)/);
      fireEvent.changeText(maxFee, "20");
      fireEvent.changeText(maxPriorityFee, "1");

      await user.press(screen.getByText("Confirm"));

      expect(await screen.findByText("Review")).toBeOnTheScreen();
    });

    it("Should show 'Enter a valid number' when max fee is zero", async () => {
      const { user } = renderForAccount(accountEthereum);
      await driveToAmount(user, { recipient: VALID_ETHEREUM_RECIPIENT });

      await openCustomFees(user);

      const maxFee = findInputByLabel(/Max fee \(Gwei\)/);
      fireEvent.changeText(maxFee, "0");

      expect(await screen.findByText("Enter a valid number")).toBeOnTheScreen();
    });
  });

  describe("Fee strategy (Slow / Medium / Fast)", () => {
    it("Bitcoin: selecting 'Fast' updates the strategy label on Amount", async () => {
      const { user } = renderForAccount(accountBitcoin);
      await driveToAmount(user, { recipient: VALID_BITCOIN_RECIPIENT });

      await user.press(screen.getByText("Fast"));

      const fastMatches = await screen.findAllByText("Fast");
      expect(fastMatches.length).toBeGreaterThan(1);
    });

    describe("EVM (gasOptions patched into the mock bridge)", () => {
      // The mock EVM bridge's `prepareTransaction` never sets
      // `transaction.gasOptions`, which the descriptor's `getOptions` reads
      // to expose Slow/Medium/Fast in the bottom sheet selector. We wrap
      // the cached bridge once so the preset UI has something to render —
      // restored in afterAll so we don't leak state to other test files.
      let restoreBridge: (() => void) | undefined;

      type PreparableBridge = {
        prepareTransaction: (
          account: unknown,
          transaction: Record<string, unknown>,
        ) => Promise<Record<string, unknown>>;
      };

      beforeAll(async () => {
        const bridge = (await getAccountBridge(
          accountEthereum,
          null,
        )) as unknown as PreparableBridge;
        const original = bridge.prepareTransaction.bind(bridge);
        bridge.prepareTransaction = async (account, tx) => {
          const next = await original(account, tx);
          return {
            ...next,
            gasOptions: {
              slow: {
                gasPrice: new BigNumber("20000000000"),
                maxFeePerGas: new BigNumber("20000000000"),
                maxPriorityFeePerGas: new BigNumber("1000000000"),
              },
              medium: {
                gasPrice: new BigNumber("30000000000"),
                maxFeePerGas: new BigNumber("30000000000"),
                maxPriorityFeePerGas: new BigNumber("1500000000"),
              },
              fast: {
                gasPrice: new BigNumber("50000000000"),
                maxFeePerGas: new BigNumber("50000000000"),
                maxPriorityFeePerGas: new BigNumber("2000000000"),
              },
            },
          };
        };
        restoreBridge = () => {
          bridge.prepareTransaction = original;
        };
      });

      afterAll(() => {
        restoreBridge?.();
      });

      it("Should reveal Slow/Medium/Fast presets and update the strategy label when 'Slow' is selected", async () => {
        const { user } = renderForAccount(accountEthereum);
        await driveToAmount(user, { recipient: VALID_ETHEREUM_RECIPIENT });

        await user.press(await screen.findByText("Slow"));

        const slowMatches = await screen.findAllByText("Slow");
        expect(slowMatches.length).toBeGreaterThan(1);
      });
    });

    it("Bitcoin: selecting a preset then entering an invalid amount surfaces the balance error", async () => {
      const { user } = renderForAccount(accountBitcoin);
      await driveToAmount(user, { recipient: VALID_BITCOIN_RECIPIENT });

      await user.press(screen.getByText("Fast"));

      await user.press(screen.getByLabelText("Toggle currency"));
      for (const digit of "99") {
        const matches = screen.getAllByText(digit);
        await user.press(matches[matches.length - 1]);
        await flushTimers();
      }

      expect(await screen.findByText("Get BTC")).toBeOnTheScreen();
    });
  });
});
