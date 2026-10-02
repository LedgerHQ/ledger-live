import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { setEnv } from "@shared/env";
import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type {
  EnergyRentOrder,
  SponsoredCoinApi,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import {
  USDT_CONTRACT,
  USDT_FEE_ASSET,
  USDT_RENT_PAYMENT,
} from "@ledgerhq/live-common/flows/send/sponsored/fixtures/usdt";
import { act, renderWithReactQuery, screen, within, withFlagOverrides } from "@tests/test-renderer";
import type { Account, Operation, SignedOperation, TokenAccount } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import { SendFlowOrchestrator } from "../SendFlowOrchestrator";
import { SEND_FLOW_CONFIG } from "../constants";
import { RecipientScreen } from "../screens/Recipient";
import { AmountScreen } from "../screens/Amount";
import { CustomFeesScreen } from "../screens/CustomFees";
import { CoinControlScreen } from "../screens/CoinControl";
import { SignatureScreen } from "../screens/Signature";
import { ConfirmationScreen } from "../screens/Confirmation";
import { PaySuccessScreen } from "../screens/PaySuccess";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";

const tronCurrency = getCryptoCurrencyById("tron");
const RECIPIENT = genAccount("sponsored-recipient", {
  currency: tronCurrency,
  subAccountsCount: 0,
}).freshAddress;
const SPONSORED_FEE_OPTION_ID = "tronify";
const ONE_USDT = 1_000_000;
const contractDataError = Object.assign(new Error("refused"), {
  name: "TransportStatusError",
  statusCode: 0x6a80,
});

const stepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.RECENT_HISTORY]: () => null,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.CUSTOM_FEES]: CustomFeesScreen,
  [SEND_FLOW_STEP.COIN_CONTROL]: CoinControlScreen,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
  [SEND_FLOW_STEP.PAY_SUCCESS]: PaySuccessScreen,
};

const HostStack = createNativeStackNavigator();

type ExecutorKind = "rent" | "transfer";

type ExecutorProps = Readonly<{
  enabled: boolean;
  intent: { input: { transaction: unknown } };
  onIntentJobStateChanged: (jobState: { type: "signed"; signedOperation: SignedOperation }) => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
}>;

const mockExecutors: Partial<Record<ExecutorKind, ExecutorProps>> = {};

type Deferred = Readonly<{
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
}>;

const noop = () => undefined;

function deferred(): Deferred {
  let resolve: () => void = noop;
  let reject: (error: Error) => void = noop;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let mockSeam: SponsoredCoinApi | null = null;
let delivery: Deferred = deferred();

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/sponsored", () => ({
  getSponsoredCoinApi: jest.fn(() => Promise.resolve(mockSeam)),
}));

jest.mock("@ledgerhq/live-common/bridge/generic-coin-framework/buildIntent", () => ({
  buildGenericTransactionIntent: jest.fn(() => Promise.resolve({ type: "send" })),
}));

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

// Keeps the real sheet so that unmounting an open one calls onUserCancel, as in the app.
jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const actual = jest.requireActual("LLM/components/DeviceIntentExecutor");
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual("react-native");
  const { BottomSheetHeader } = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const { QueuedBottomSheet } = jest.requireActual("@shared/ui-queued-bottom-sheet");

  function MockDeviceIntentExecutorLWM(props: ExecutorProps) {
    const kind: ExecutorKind =
      typeof props.intent.input.transaction === "string" ? "rent" : "transfer";
    React.useEffect(() => {
      mockExecutors[kind] = props;
      return () => {
        delete mockExecutors[kind];
      };
    });
    return (
      <QueuedBottomSheet isRequestingToBeOpened={props.enabled} onClose={props.onUserCancel}>
        <View testID={`device-intent-executor-${kind}`}>
          <BottomSheetHeader />
        </View>
      </QueuedBottomSheet>
    );
  }

  return { ...actual, DeviceIntentExecutorLWM: MockDeviceIntentExecutorLWM };
});

jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(undefined),
  deactivateKeepAwake: jest.fn(),
  useKeepAwake: jest.fn(),
}));

function makeTronAccount(id: string, usdtBalance: number): Account {
  const base = genAccount(id, { currency: tronCurrency, subAccountsCount: 0, operationsSize: 0 });
  const usdt: TokenAccount = {
    type: "TokenAccount",
    id: `${base.id}|usdt`,
    parentId: base.id,
    token: {
      type: "TokenCurrency",
      id: "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
      contractAddress: USDT_CONTRACT,
      parentCurrencyId: "tron",
      tokenType: "trc20",
      name: "Tether USD",
      ticker: "USDT",
      units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
    },
    balance: new BigNumber(usdtBalance),
    spendableBalance: new BigNumber(usdtBalance),
    creationDate: new Date(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: base.balanceHistoryCache,
    swapHistory: [],
  };
  const trx = new BigNumber(100_000_000);
  return { ...base, balance: trx, spendableBalance: trx, subAccounts: [usdt] };
}

function makeSeam(payer: Account): SponsoredCoinApi {
  let crafted = 0;
  return {
    feeOptionId: SPONSORED_FEE_OPTION_ID,
    providerName: "Tronify",
    waivesErrorKeys: [],
    waivesWarningKeys: [],
    reservationDedupKey: jest.fn().mockReturnValue("1.5"),
    listFeeOptions: jest
      .fn()
      .mockResolvedValue([{ id: SPONSORED_FEE_OPTION_ID, feeAsset: USDT_FEE_ASSET }]),
    estimateSponsoredFeeQuote: jest.fn().mockResolvedValue({
      feeAsset: USDT_FEE_ASSET,
      value: USDT_RENT_PAYMENT.amount,
      originalValue: 30_000_000n,
    }),
    buildEnergyRentRequest: jest.fn().mockResolvedValue({
      payerAddress: payer.freshAddress,
      receiverAddress: payer.freshAddress,
      energy: 65_000n,
      durationSeconds: 3_600,
    }),
    craftEnergyRentTransaction: jest.fn(async (): Promise<EnergyRentOrder> => {
      crafted += 1;
      return {
        orderId: `order-${crafted}`,
        transaction: { raw: `0a0${crafted}`, paymentTxId: `txA-${crafted}` },
        payCoinCode: "USDT",
        payCoinAmt: "3.2",
      };
    }),
    submitEnergyRentPayment: jest.fn().mockResolvedValue(undefined),
    getEnergyRentStatus: jest.fn().mockResolvedValue("paid"),
    awaitEnergyDelivery: jest.fn(() => {
      delivery = deferred();
      return delivery.promise;
    }),
    isEnergyDelivered: jest.fn().mockResolvedValue(false),
    getEnergyRentSignaturePayload: jest.fn((transaction: unknown) => {
      const { raw, paymentTxId } = transaction as { raw: string; paymentTxId: string };
      return { toSign: raw, paymentTxId };
    }),
    buildSignedEnergyRentTransaction: jest.fn((transaction: unknown, signature: string) => ({
      transaction,
      signature,
    })),
    rentPayment: jest.fn().mockReturnValue(USDT_RENT_PAYMENT),
  };
}

function signedOperation(account: Account, signature: string): SignedOperation {
  const operation: Operation = {
    id: `${account.id}-${signature}`,
    hash: `${signature}-hash`,
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [account.freshAddress],
    recipients: [RECIPIENT],
    blockHash: null,
    blockHeight: null,
    accountId: account.id,
    date: new Date(),
    extra: {},
  };
  return { operation, signature };
}

function executor(kind: ExecutorKind): ExecutorProps {
  const props = mockExecutors[kind];
  if (!props) throw new Error(`No ${kind} executor was rendered`);
  return props;
}

async function flushTimers(ms = 600): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe("Sponsored send flow integration tests", () => {
  let account: Account;
  let seam: SponsoredCoinApi;

  beforeAll(() => {
    setEnv("MOCK", "1");
  });

  afterAll(() => {
    setEnv("MOCK", "");
  });

  function SendPage({ usdt, parent }: Readonly<{ usdt: TokenAccount; parent: Account }>) {
    return (
      <HostStack.Navigator screenOptions={{ headerShown: false }}>
        <HostStack.Screen name="SendHost">
          {() => (
            <SendFlowOrchestrator
              initParams={{
                account: usdt,
                parentAccount: parent,
                recipient: RECIPIENT,
                skipRecipientStep: true,
              }}
              onClose={() => {}}
              stepRegistry={stepRegistry}
              flowConfig={SEND_FLOW_CONFIG}
            />
          )}
        </HostStack.Screen>
      </HostStack.Navigator>
    );
  }

  function renderSponsoredSend(usdtBalance: number) {
    account = makeTronAccount(`sponsored-sender-${usdtBalance}`, usdtBalance);
    seam = makeSeam(account);
    mockSeam = seam;
    const [usdt] = account.subAccounts as TokenAccount[];

    const withAccount = (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
    });

    return renderWithReactQuery(<SendPage usdt={usdt} parent={account} />, {
      overrideInitialState: withFlagOverrides({ gasSponsorship: { enabled: true } }, withAccount),
    });
  }

  async function reviewHalfTheBalance(user: ReturnType<typeof renderSponsoredSend>["user"]) {
    await user.press(await screen.findByText("50%"));
    await flushTimers();
    await user.press(screen.getByText("Review"));
    await flushTimers();
  }

  async function signRent(): Promise<void> {
    await screen.findByTestId("device-intent-executor-rent");
    await act(async () => {
      executor("rent").onIntentJobStateChanged({
        type: "signed",
        signedOperation: signedOperation(account, "rent-signature"),
      });
    });
  }

  async function deliverEnergy(): Promise<void> {
    await act(async () => {
      delivery.resolve();
    });
    await flushTimers();
  }

  it("should rent energy, wait for delivery and send when the sponsored fee is picked", async () => {
    const { user } = renderSponsoredSend(100 * ONE_USDT);

    await reviewHalfTheBalance(user);
    await signRent();

    expect(await screen.findByTestId("send-sponsored-polling")).toBeOnTheScreen();
    expect(seam.craftEnergyRentTransaction).toHaveBeenCalledTimes(1);
    expect(seam.buildSignedEnergyRentTransaction).toHaveBeenCalledWith(
      expect.anything(),
      "rent-signature",
    );
    expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
    expect(seam.submitEnergyRentPayment).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1" }),
    );

    await deliverEnergy();
    await screen.findByTestId("device-intent-executor-transfer");
    await act(async () => {
      executor("transfer").onIntentJobStateChanged({
        type: "signed",
        signedOperation: signedOperation(account, "transfer-signature"),
      });
    });
    // useBroadcast waits at least 3s before resolving.
    await flushTimers(3_000);

    expect(await screen.findByTestId("send-confirmation-success")).toBeOnTheScreen();
    expect(seam.craftEnergyRentTransaction).toHaveBeenCalledTimes(1);
    expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  });

  it("should return to the amount and craft a new order when the rent sheet is closed before signing", async () => {
    const { user } = renderSponsoredSend(100 * ONE_USDT);

    await reviewHalfTheBalance(user);
    const rentSheet = await screen.findByTestId("device-intent-executor-rent");
    await user.press(within(rentSheet).getByLabelText("Close"));
    await flushTimers();

    expect(screen.queryByTestId("device-intent-executor-rent")).not.toBeOnTheScreen();
    expect(screen.getByText("Review")).toBeOnTheScreen();
    expect(seam.submitEnergyRentPayment).not.toHaveBeenCalled();

    await user.press(screen.getByText("Review"));
    await flushTimers();

    expect(await screen.findByTestId("device-intent-executor-rent")).toBeOnTheScreen();
    expect(seam.craftEnergyRentTransaction).toHaveBeenCalledTimes(2);
  });

  it("should offer to pay again and craft a new order when the energy is not delivered", async () => {
    const { user } = renderSponsoredSend(100 * ONE_USDT);

    await reviewHalfTheBalance(user);
    await signRent();
    await screen.findByTestId("send-sponsored-polling");
    await act(async () => {
      delivery.reject(new Error("delivery failed"));
    });
    await flushTimers();

    expect(await screen.findByTestId("send-sponsored-failure")).toBeOnTheScreen();
    await user.press(screen.getByText("Pay again and retry"));
    await flushTimers();

    expect(await screen.findByTestId("device-intent-executor-rent")).toBeOnTheScreen();
    expect(seam.craftEnergyRentTransaction).toHaveBeenCalledTimes(2);
    expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  });

  it("should reopen the transfer when contract data was off and the user retries", async () => {
    const { user } = renderSponsoredSend(100 * ONE_USDT);

    await reviewHalfTheBalance(user);
    await signRent();
    await screen.findByTestId("send-sponsored-polling");
    await deliverEnergy();
    await screen.findByTestId("device-intent-executor-transfer");

    await act(async () => {
      executor("transfer").onIntentJobError(contractDataError);
    });
    await flushTimers();

    expect(await screen.findByTestId("send-sponsored-failure")).toBeOnTheScreen();
    expect(screen.queryByTestId("device-intent-executor-transfer")).not.toBeOnTheScreen();

    await user.press(screen.getByTestId("send-sponsored-failure-retry"));
    await flushTimers();

    expect(await screen.findByTestId("device-intent-executor-transfer")).toBeOnTheScreen();
    expect(seam.submitEnergyRentPayment).toHaveBeenCalledTimes(1);
  });

  it("should fall back to the standard fee when the USDT balance can't cover the amount and the rent", async () => {
    const { user } = renderSponsoredSend(5 * ONE_USDT);

    await reviewHalfTheBalance(user);

    expect(await screen.findByTestId("device-intent-executor-transfer")).toBeOnTheScreen();
    expect(screen.queryByTestId("device-intent-executor-rent")).not.toBeOnTheScreen();
    expect(seam.craftEnergyRentTransaction).not.toHaveBeenCalled();
  });
});
