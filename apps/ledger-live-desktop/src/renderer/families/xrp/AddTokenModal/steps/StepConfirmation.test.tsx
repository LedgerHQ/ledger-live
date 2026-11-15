import React from "react";
import type { Operation } from "@ledgerhq/types-live";
import { fireEvent, render, screen } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import type { StepProps } from "../types";
import StepConfirmation, { StepConfirmationFooter } from "./StepConfirmation";
import { makeStepProps } from "../../__mocks__/stepProps.mock";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncOneAccountOnMount: () => null,
}));
jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

const operation = { id: "op-1", accountId: "xrp-1" } as Operation;

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
    const { onClose, account } = renderConfirmation({ optimisticOperation: operation });

    expect(screen.getByText("RLUSD token successfully added")).toBeVisible();
    fireEvent.click(screen.getByText("View details"));

    expect(onClose).toHaveBeenCalled();
    expect(setDrawer).toHaveBeenCalledWith(expect.anything(), {
      operationId: operation.id,
      accountId: account?.id,
      parentId: undefined,
    });
    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("confirms an edited trust limit", () => {
    renderConfirmation({ optimisticOperation: operation, action: "edit" });

    expect(screen.getByText("RLUSD trust limit updated")).toBeVisible();
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
