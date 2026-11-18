import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import type { StepProps } from "../types";
import StepConfirmation, { StepConfirmationFooter } from "./StepConfirmation";
import { makeStepProps } from "../../__mocks__/stepProps.mock";
import { xrpOperation } from "../../__mocks__/transaction.mock";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncOneAccountOnMount: () => null,
}));
jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

function renderConfirmation(overrides: Partial<StepProps> = {}) {
  const props = makeStepProps(overrides);
  render(
    <>
      <StepConfirmation {...props} />
      <StepConfirmationFooter {...props} />
    </>,
  );
  return props;
}

describe("StepConfirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("confirms an added token and opens its operation", () => {
    const { onClose, account } = renderConfirmation({ optimisticOperation: xrpOperation });

    expect(screen.getByText("Request to add RLUSD sent")).toBeVisible();
    expect(screen.getByText("It applies once the network confirms the transaction.")).toBeVisible();
    fireEvent.click(screen.getByText("View details"));

    expect(onClose).toHaveBeenCalled();
    expect(setDrawer).toHaveBeenCalledWith(expect.anything(), {
      operationId: xrpOperation.id,
      accountId: account?.id,
      parentId: undefined,
    });
    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("confirms a sent settings update", () => {
    renderConfirmation({ optimisticOperation: xrpOperation, action: "edit" });

    expect(screen.getByText("Request to update RLUSD sent")).toBeVisible();
    expect(screen.getByText("It applies once the network confirms the transaction.")).toBeVisible();
  });

  it("confirms a sent removal", () => {
    renderConfirmation({ optimisticOperation: xrpOperation, action: "remove" });

    expect(screen.getByText("Request to remove RLUSD sent")).toBeVisible();
    expect(screen.getByText("It applies once the network confirms the transaction.")).toBeVisible();
  });

  it("offers a retry after an error", () => {
    const { onRetry } = renderConfirmation({ error: new Error("device disconnected") });

    expect(screen.queryByText("View details")).toBeNull();
    fireEvent.click(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalled();
  });

  it("warns the transaction may have gone through when the error comes after signing", () => {
    renderConfirmation({ error: new Error("broadcast failed"), signed: true });

    expect(screen.getByText(/Your transaction may have failed/)).toBeVisible();
  });

  it("shows only Close while nothing happened yet", () => {
    renderConfirmation();

    expect(screen.getByRole("button")).toHaveTextContent("Close");
  });
});
