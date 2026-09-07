import React from "react";
import { render, screen } from "@tests/test-renderer";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import { DelegationStatusModal } from "../DelegationStatusModal";

describe("DelegationStatusModal", () => {
  it("shows the status title and tooltip when there is no fetch error", () => {
    render(
      <DelegationStatusModal
        status={HEDERA_DELEGATION_STATUS.Active}
        error={false}
        isOpen
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Active")).toBeVisible();
    expect(screen.getByText("Delegated amount generates rewards")).toBeVisible();
  });

  it("shows the fetch error title and tooltip when error is set", () => {
    render(
      <DelegationStatusModal
        status={HEDERA_DELEGATION_STATUS.Active}
        error
        isOpen
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Unable to load")).toBeVisible();
    expect(screen.getByText("Couldn't load validator data. Please try again.")).toBeVisible();
  });
});
