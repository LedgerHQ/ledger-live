import * as React from "react";
import { TextInput as RNTextInput } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { setEnv } from "@ledgerhq/live-env";
import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { act, fireEvent, renderWithReactQuery, screen } from "@tests/test-renderer";
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
    jest.advanceTimersByTime(600);
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

  function renderForAccount(account: Account) {
    return renderWithReactQuery(<SendPage initParams={{ account }} />, {
      overrideInitialState: (state: State) => ({
        ...state,
        accounts: { ...state.accounts, active: [account] },
      }),
    });
  }

  async function driveToAmount(
    user: ReturnType<typeof renderForAccount>["user"],
    opts: DriveOpts,
  ): Promise<void> {
    // EVM enables ENS resolution so the placeholder is "Enter address or ENS";
    // every other family uses "Enter address".
    await user.type(
      await screen.findByPlaceholderText(/^Enter address( or ENS)?$/),
      opts.recipient,
    );
    if (opts.memo !== undefined) {
      await user.type(await screen.findByTestId("send-memo-input"), opts.memo);
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
