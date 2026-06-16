/* eslint-disable @typescript-eslint/consistent-type-assertions */

import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { act, render } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import {
  PlatformExchangeNavigatorParamList,
  ResultComplete,
} from "~/components/RootNavigator/types/PlatformExchangeNavigator";
import { ScreenName } from "~/const";
import CompleteExchange from "../Platform/exchange/CompleteExchange";

const mockBroadcast = jest.fn().mockResolvedValue({ id: "0" });

jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));

let latestOnResult: ((res: unknown) => void) | undefined;
jest.mock("~/components/DeviceActionModal", () => ({
  __esModule: true,
  default: (props: { onResult?: (res: unknown) => void }) => {
    latestOnResult = props.onResult;
    return null;
  },
}));

const ethereum = getCryptoCurrencyById("ethereum");
const bitcoin = getCryptoCurrencyById("bitcoin");

const fromAccount = genAccount("0", { currency: ethereum });
const toAccount = genAccount("1", { currency: bitcoin });

const exchange: ExchangeSwap = {
  fromParentAccount: undefined,
  fromAccount,
  fromCurrency: ethereum,
  toParentAccount: undefined,
  toAccount,
  toCurrency: bitcoin,
};

const transaction = {
  family: "evm",
  mode: "send",
  amount: new BigNumber("1000000000000000000"),
  recipient: "0x1234567890123456789012345678901234567890",
  nonce: 8,
  gasLimit: new BigNumber("21000"),
  chainId: 1,
  maxFeePerGas: new BigNumber("30000000000"),
  maxPriorityFeePerGas: new BigNumber("1500000000"),
  type: 2,
  feesStrategy: "medium",
} as unknown as Transaction;

const operation: Operation = {
  id: `${fromAccount.id}-0xabc-OUT`,
  hash: "0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
  type: "OUT",
  value: new BigNumber("1000000000000000000"),
  fee: new BigNumber("630000000000000"),
  senders: [fromAccount.freshAddress],
  recipients: ["0x1234567890123456789012345678901234567890"],
  blockHeight: null,
  blockHash: null,
  accountId: fromAccount.id,
  date: new Date("2026-06-09T10:00:00.000Z"),
  extra: {},
};

const exampleSignedOperation: SignedOperation = {
  operation,
  signature: "0x02f8730182",
};

function makeRoute() {
  return {
    key: "PlatformCompleteExchange",
    name: ScreenName.PlatformCompleteExchange as const,
    params: {
      request: {
        exchangeType: 0,
        provider: "changelly",
        exchange,
        transaction: transaction,
        binaryPayload: "0x123456789abcdefghiklmopqrstuvwxyz",
        signature: "zyxwvutsrqponmlkjhgfedcba9876543210",
        feesStrategy: "medium",
        rateType: 1,
        amountExpectedTo: 0.0123,
        sponsored: false,
      },
      onResult: jest.fn() as (_: ResultComplete) => void,
    },
  };
}

function makeNavigation(): NativeStackNavigationProp<
  PlatformExchangeNavigatorParamList,
  ScreenName.PlatformCompleteExchange,
  undefined
> {
  return {} as unknown as NativeStackNavigationProp<
    PlatformExchangeNavigatorParamList,
    ScreenName.PlatformCompleteExchange,
    undefined
  >;
}

describe("CompleteExchange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestOnResult = undefined;
  });

  it("should broadcast only 1 time when re-render", async () => {
    const { rerender } = render(
      <CompleteExchange navigation={makeNavigation()} route={makeRoute()} />,
      {},
    );

    await act(async () => {
      latestOnResult?.({ completeExchangeResult: transaction });
    });

    await act(async () => {
      latestOnResult?.({ signedOperation: exampleSignedOperation });
    });

    expect(mockBroadcast).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender(<CompleteExchange navigation={makeNavigation()} route={makeRoute()} />);
    });

    await act(async () => {
      latestOnResult?.({ signedOperation: exampleSignedOperation });
    });

    expect(mockBroadcast).toHaveBeenCalledTimes(1);
  });
});
