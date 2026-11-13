import React from "react";
import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Operation } from "@ledgerhq/types-live";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { MAX_TRUST_LIMIT_VALUE } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { act, render, screen } from "tests/testSetup";
import logger from "~/renderer/logger";
import Body, { type Data } from "./Body";
import type { StepId, StepProps } from "./types";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT } from "../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => {
  const bridge = {
    createTransaction: () => ({ family: "xrp" }),
    updateTransaction: (transaction: object, patch: object) => ({ ...transaction, ...patch }),
  };
  return { useAccountBridge: () => bridge };
});
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: (_bridge: unknown, init: () => { transaction: object; account: object }) => {
    const { useState } = jest.requireActual("react");
    const [{ transaction: initial, account }] = useState(init);
    const [transaction, setTransaction] = useState(initial);

    return {
      transaction,
      updateTransaction: setTransaction,
      account,
      parentAccount: undefined,
      status: { errors: {}, warnings: {} },
      bridgeError: null,
      bridgePending: false,
    };
  },
}));
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncSkipUnderPriority: () => "sync paused",
}));
jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  Track: () => null,
}));

type StepperProps = Omit<StepProps, "transitionTo"> & {
  errorSteps: number[];
  children: React.ReactNode;
};

const mockStepper = jest.fn<null, [StepperProps]>(() => null);
jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: (props: StepperProps) => {
    mockStepper(props);
    return props.children;
  },
}));

const stepper = () => mockStepper.mock.lastCall![0];
const pick = (token: TokenCurrency) => act(() => stepper().onChangeToken(token));

const rlusd = xrpIouToken;

function renderBody(params: Partial<Data> = {}, stepId: StepId = "token") {
  const onChangeStepId = jest.fn<void, [StepId]>();
  render(
    <Body
      stepId={stepId}
      onClose={jest.fn()}
      onChangeStepId={onChangeStepId}
      params={{ account: XRP_ACCOUNT, ...params }}
    />,
  );

  return { onChangeStepId };
}

describe("xrp AddTokenModal Body", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, "critical").mockImplementation(() => {});
  });

  it("puts the picked token and its Max in the transaction", async () => {
    renderBody();

    await pick(rlusd);

    expect(stepper().transaction).toMatchObject({
      assetReference: rlusd.tokenIdentifier,
      assetOwner: rlusd.contractAddress,
      amount: MAX_TRUST_LIMIT_VALUE,
    });
  });

  it("asks no Max for an MPT", async () => {
    renderBody();

    await pick(xrpMptToken);

    expect(stepper().transaction?.amount).toEqual(new BigNumber(0));
  });

  it("applies a preselected token on open", async () => {
    renderBody({ token: rlusd });

    await act(async () => {});

    expect(stepper().token).toBe(rlusd);
    expect(stepper().transaction?.assetReference).toBe(rlusd.tokenIdentifier);
  });

  it("keeps the current limit of an edited token", async () => {
    renderBody({ tokenAccount: XRP_IOU_TOKEN_ACCOUNT });

    await act(async () => {});

    expect(stepper().action).toBe("edit");
    expect(stepper().transaction?.amount).toEqual(new BigNumber(1000));
  });

  it("puts the rippling switch in the transaction", () => {
    renderBody();

    expect(stepper().isRippling).toBe(false);

    act(() => stepper().onChangeRippling(true));

    expect(stepper().transaction?.noRipple).toBe(false);
    expect(stepper().isRippling).toBe(true);

    act(() => stepper().onChangeRippling(false));

    expect(stepper().transaction?.noRipple).toBe(true);
    expect(stepper().isRippling).toBe(false);
  });

  it("goes back to the first step on retry", () => {
    const add = renderBody();
    act(() => stepper().onRetry());
    expect(add.onChangeStepId).toHaveBeenCalledWith("token");

    const edit = renderBody({ tokenAccount: XRP_IOU_TOKEN_ACCOUNT });
    act(() => stepper().onRetry());
    expect(edit.onChangeStepId).toHaveBeenCalledWith("settings");
  });

  it("pauses background syncs until the confirmation, which syncs the account", () => {
    renderBody({}, "review");
    expect(screen.getByText("sync paused")).toBeInTheDocument();

    renderBody({}, "confirmation");
    expect(screen.getAllByText("sync paused")).toHaveLength(1);
  });

  it("forgets the previous signature on retry", () => {
    renderBody();

    act(() => stepper().setSigned(true));
    act(() => stepper().onRetry());

    expect(stepper().signed).toBe(false);
  });

  it("logs a failed transaction, except a refusal on the device", () => {
    renderBody();

    act(() => stepper().onTransactionError(new UserRefusedOnDevice()));
    expect(logger.critical).not.toHaveBeenCalled();

    const error = new Error("broadcast failed");
    act(() => stepper().onTransactionError(error));

    expect(logger.critical).toHaveBeenCalledWith(error);
    expect(stepper().error).toBe(error);
    expect(stepper().errorSteps).toEqual([4]);
  });

  it("shows the broadcast operation and clears the error", () => {
    renderBody();
    const operation = { id: "op-1", accountId: XRP_ACCOUNT.id } as Operation;

    act(() => stepper().onTransactionError(new Error("first try")));
    act(() => stepper().onOperationBroadcasted(operation));

    expect(stepper().optimisticOperation).toBe(operation);
    expect(stepper().error).toBeUndefined();
  });
});
