import React, { useState } from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import type { StepId } from "../types";

type StakingInfo = ReturnType<
  typeof import("@ledgerhq/live-common/families/tezos/react").useTezosStakingInfo
>;

const stakingInfoMock = jest.fn<StakingInfo, []>();
const bakersMock = jest.fn<unknown[], []>(() => [
  {
    address: "tz1baker",
    name: "Baker A",
    logoURL: "",
    nominalYield: "5 %",
    capacityStatus: "normal",
  },
]);

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  useBakers: () => bakersMock(),
  useTezosStakingInfo: () => stakingInfoMock(),
  useDelegation: () => null,
  useBaker: () => undefined,
}));

jest.mock("../steps/StepValidator", () => ({
  __esModule: true,
  default: () => <div data-testid="step-validator">validator</div>,
}));

const makeOp = (accountId: string | undefined) => ({
  id: "op-1",
  hash: "h",
  accountId: accountId ?? "",
  type: "OUT" as const,
  value: new BigNumber(0),
  fee: new BigNumber(0),
  senders: [],
  recipients: [],
  blockHeight: null,
  blockHash: null,
  transactionSequenceNumber: 0,
  date: new Date(),
  extra: {},
});

jest.mock("../steps/StepDeviceDelegation", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-device-delegation">
      <button
        data-testid="device-delegation-broadcast"
        onClick={() => {
          props.onOperationBroadcasted(makeOp(props.account?.id));
          props.transitionTo("amount");
        }}
      >
        broadcast
      </button>
      <button
        data-testid="device-delegation-error"
        onClick={() => {
          props.onTransactionError(new Error("dev-error"));
          props.transitionTo("confirmation");
        }}
      >
        error
      </button>
    </div>
  ),
}));

jest.mock("../steps/StepAmount", () => ({
  __esModule: true,
  default: () => <div data-testid="step-amount">amount</div>,
  StepAmountFooter: () => null,
}));

jest.mock("../steps/StepDeviceStaking", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-device-staking">
      <button
        data-testid="device-staking-error"
        onClick={() => {
          props.onTransactionError(new Error("dev-error"));
          props.transitionTo("confirmation");
        }}
      >
        error
      </button>
    </div>
  ),
}));

jest.mock("../steps/StepConfirmation", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="step-confirmation">
      <span data-testid="failed-step">{props.failedStep ?? ""}</span>
    </div>
  ),
  StepConfirmationFooter: () => null,
}));

import Body from "../Body";

setSupportedCurrencies(["tezos"]);

const currency = getCryptoCurrencyById("tezos");

const makeAccount = (): TezosAccount =>
  ({
    ...genAccount("tezos-stake-test", { currency }),
  }) as unknown as TezosAccount;

const defaultStakingInfo: StakingInfo = {
  isDelegated: false,
  isStaked: false,
  hasUnstaking: false,
  delegation: null,
  stakedBalance: new BigNumber(0),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(1_000_000),
  delegateAddress: undefined,
};

beforeEach(() => {
  stakingInfoMock.mockReturnValue(defaultStakingInfo);
});

const ControlledBody = ({
  initialStep,
  skipDelegation,
}: {
  initialStep: StepId;
  skipDelegation: boolean;
}) => {
  const [stepId, setStepId] = useState<StepId>(initialStep);
  const account = makeAccount();
  return (
    <Body
      stepId={stepId}
      onClose={jest.fn()}
      onChangeStepId={setStepId}
      params={{ account, skipDelegation }}
    />
  );
};

describe("StakeFlowModal/Body", () => {
  it("renders the validator step first when skipDelegation is false", async () => {
    const account = makeAccount();
    await act(async () => {
      render(
        <Body
          stepId="validator"
          onClose={jest.fn()}
          onChangeStepId={jest.fn()}
          params={{ account, skipDelegation: false }}
        />,
      );
    });
    expect(screen.getByTestId("step-validator")).toBeInTheDocument();
  });

  it("starts on the amount step when skipDelegation is true", async () => {
    const account = makeAccount();
    const onChangeStepId = jest.fn();
    await act(async () => {
      render(
        <Body
          stepId="validator"
          onClose={jest.fn()}
          onChangeStepId={onChangeStepId}
          params={{ account, skipDelegation: true }}
        />,
      );
    });
    expect(onChangeStepId).toHaveBeenCalledWith("amount");
  });

  it("broadcasting from device-delegation navigates to the amount step", async () => {
    const { user } = render(
      <ControlledBody initialStep="device-delegation" skipDelegation={false} />,
    );
    expect(screen.getByTestId("step-device-delegation")).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByTestId("device-delegation-broadcast"));
    });
    expect(screen.getByTestId("step-amount")).toBeInTheDocument();
  });

  it("error at device-staking surfaces failedStep on the confirmation step", async () => {
    const { user } = render(<ControlledBody initialStep="device-staking" skipDelegation={true} />);
    expect(screen.getByTestId("step-device-staking")).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByTestId("device-staking-error"));
    });
    expect(screen.getByTestId("step-confirmation")).toBeInTheDocument();
    expect(screen.getByTestId("failed-step")).toHaveTextContent("device-staking");
  });

  it("error at device-delegation surfaces failedStep on the confirmation step", async () => {
    const { user } = render(
      <ControlledBody initialStep="device-delegation" skipDelegation={false} />,
    );
    expect(screen.getByTestId("step-device-delegation")).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByTestId("device-delegation-error"));
    });
    expect(screen.getByTestId("step-confirmation")).toBeInTheDocument();
    expect(screen.getByTestId("failed-step")).toHaveTextContent("device-delegation");
  });
});
