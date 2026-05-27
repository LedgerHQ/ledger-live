import React, { useState } from "react";
import BigNumber from "bignumber.js";
import { act, render, screen } from "tests/testSetup";
import {
  createMockAccount,
  createMockOperation,
  defaultStakingInfo,
} from "../../__tests__/testUtils";
import type { StepId } from "../types";

const stakingInfoMock = jest.fn<typeof defaultStakingInfo, []>();
const bakersMock = jest.fn<unknown[], []>(() => [
  {
    address: "tz1baker",
    name: "Baker A",
    logoURL: "https://example.test/baker.png",
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
  isAwaitingDelegation: (
    delegation: { isPending: boolean } | null | undefined,
    transaction: { mode?: string } | null | undefined,
  ) => transaction?.mode === "stake" && (!delegation || delegation.isPending),
}));

jest.mock("../steps/StepValidator", () => ({
  __esModule: true,
  default: () => <div data-testid="step-validator">validator-content</div>,
}));

jest.mock("../steps/StepDeviceDelegation", () => ({
  __esModule: true,
  default: (props: {
    onOperationBroadcasted: (op: ReturnType<typeof createMockOperation>) => void;
    transitionTo: (id: StepId) => void;
    onTransactionError: (e: Error) => void;
    account?: { id?: string };
  }) => (
    <div data-testid="step-device-delegation">
      <button
        type="button"
        data-testid="device-delegation-broadcast"
        onClick={() => {
          props.onOperationBroadcasted(createMockOperation(props.account?.id));
          props.transitionTo("amount");
        }}
      >
        broadcast
      </button>
    </div>
  ),
}));

jest.mock("../steps/StepAmount", () => ({
  __esModule: true,
  default: () => <div data-testid="step-amount">amount-content</div>,
  StepAmountFooter: () => null,
}));

jest.mock("../steps/StepDeviceStaking", () => ({
  __esModule: true,
  default: (props: {
    transitionTo: (id: StepId) => void;
    onOperationBroadcasted: (op: ReturnType<typeof createMockOperation>) => void;
    account?: { id?: string };
  }) => (
    <div data-testid="step-device-staking">
      <button
        type="button"
        data-testid="device-staking-broadcast"
        onClick={() => {
          props.onOperationBroadcasted(createMockOperation(props.account?.id));
          props.transitionTo("confirmation");
        }}
      >
        broadcast
      </button>
    </div>
  ),
}));

jest.mock("../steps/StepConfirmation", () => ({
  __esModule: true,
  default: () => <div data-testid="step-confirmation">confirmation-content</div>,
  StepConfirmationFooter: () => null,
}));

import Body from "../Body";

beforeEach(() => {
  stakingInfoMock.mockReturnValue({
    ...defaultStakingInfo,
    availableBalance: new BigNumber(1_000_000),
  });
});

const ControlledBody = ({
  initialStep,
  skipDelegation,
}: {
  initialStep: StepId;
  skipDelegation: boolean;
}) => {
  const [stepId, setStepId] = useState<StepId>(initialStep);
  return (
    <Body
      stepId={stepId}
      onClose={jest.fn()}
      onChangeStepId={setStepId}
      params={{ account: createMockAccount("tezos-stake-integ"), skipDelegation }}
    />
  );
};

describe("Tezos stake flow (integration)", () => {
  describe("breadcrumb for the full flow (skipDelegation=false)", () => {
    it("renders all 5 step labels visible in the breadcrumb", async () => {
      await act(async () => {
        render(<ControlledBody initialStep="validator" skipDelegation={false} />);
      });

      expect(screen.getByText("Validator")).toBeInTheDocument();
      expect(screen.getByText("Confirm Delegation")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("Confirm Staking")).toBeInTheDocument();
      expect(screen.getByText("Confirmation")).toBeInTheDocument();
    });

    it("walks the breadcrumb step-by-step: validator → device-delegation → amount", async () => {
      const { user } = render(
        <ControlledBody initialStep="device-delegation" skipDelegation={false} />,
      );

      expect(screen.getByTestId("step-device-delegation")).toBeInTheDocument();

      await act(async () => {
        await user.click(screen.getByTestId("device-delegation-broadcast"));
      });

      expect(screen.getByTestId("step-amount")).toBeInTheDocument();
      // breadcrumb still shows all 5 labels for the full flow
      expect(screen.getByText("Validator")).toBeInTheDocument();
      expect(screen.getByText("Confirm Staking")).toBeInTheDocument();
    });
  });

  describe("breadcrumb for the stake-only flow (skipDelegation=true)", () => {
    it("hides the validator and Confirm Delegation steps when skipDelegation is true", async () => {
      await act(async () => {
        render(<ControlledBody initialStep="amount" skipDelegation={true} />);
      });

      expect(screen.queryByText("Validator")).not.toBeInTheDocument();
      expect(screen.queryByText("Confirm Delegation")).not.toBeInTheDocument();

      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("Confirm Staking")).toBeInTheDocument();
      expect(screen.getByText("Confirmation")).toBeInTheDocument();
    });

    it("starts on Amount and reaches Confirmation after the device-staking broadcast", async () => {
      const { user } = render(
        <ControlledBody initialStep="device-staking" skipDelegation={true} />,
      );

      expect(screen.getByTestId("step-device-staking")).toBeInTheDocument();

      await act(async () => {
        await user.click(screen.getByTestId("device-staking-broadcast"));
      });

      expect(screen.getByTestId("step-confirmation")).toBeInTheDocument();
    });
  });

  it("auto-corrects an invalid initial stepId to the first available step when skipDelegation flips off the validator step", async () => {
    const onChangeStepId = jest.fn();
    await act(async () => {
      render(
        <Body
          stepId="validator"
          onClose={jest.fn()}
          onChangeStepId={onChangeStepId}
          params={{ account: createMockAccount("tezos-stake-integ"), skipDelegation: true }}
        />,
      );
    });

    expect(onChangeStepId).toHaveBeenCalledWith("amount");
  });
});
