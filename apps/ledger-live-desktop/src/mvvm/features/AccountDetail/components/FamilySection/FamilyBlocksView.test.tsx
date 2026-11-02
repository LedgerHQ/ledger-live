import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { render, screen } from "tests/testSetup";
import { FamilyBlocksView } from "./FamilyBlocksView";
import type { FamilyBlocksViewModel } from "./useFamilyBlocksViewModel";

const block = (testId: string) => {
  return () => {
    return <div data-testid={testId} />;
  };
};

const family: FamilyBlocksViewModel["family"] = {
  AccountSubHeader: block("sub-header"),
  PendingTransferProposals: block("pending-transfer-proposals"),
  AccountBodyHeader: block("body-header"),
  AccountBalanceSummaryFooter: block("balance-summary-footer"),
};

const renderView = (overrides: Partial<FamilyBlocksViewModel> = {}) => {
  return render(
    <FamilyBlocksView
      account={genAccount("family-blocks", { currency: getCryptoCurrencyById("ethereum") })}
      family={family}
      counterValue={getFiatCurrencyByTicker("USD")}
      discreetMode={false}
      showBalanceSummaryFooter
      showBodyBlocks
      {...overrides}
    />,
  );
};

describe("FamilyBlocksView", () => {
  it("renders every family block of a used account, in order", () => {
    const { container } = renderView();

    expect(
      Array.from(container.children, child => {
        return child.getAttribute("data-testid");
      }),
    ).toEqual([
      "pending-transfer-proposals",
      "sub-header",
      "balance-summary-footer",
      "body-header",
    ]);
  });

  it("keeps only the sub header and pending proposals for an empty account", () => {
    renderView({ showBalanceSummaryFooter: false, showBodyBlocks: false });

    expect(screen.getByTestId("sub-header")).toBeInTheDocument();
    expect(screen.getByTestId("pending-transfer-proposals")).toBeInTheDocument();
    expect(screen.queryByTestId("body-header")).toBeNull();
    expect(screen.queryByTestId("balance-summary-footer")).toBeNull();
  });

  it("drops the balance summary footer when delegation is disabled", () => {
    renderView({ showBalanceSummaryFooter: false });

    expect(screen.getByTestId("body-header")).toBeInTheDocument();
    expect(screen.queryByTestId("balance-summary-footer")).toBeNull();
  });

  it("renders the Account Detail delegations last, instead of the legacy body header", () => {
    const { container } = renderView({
      family: { ...family, AccountDetailDelegations: block("detail-delegations") },
    });

    expect(
      Array.from(container.children, child => {
        return child.getAttribute("data-testid");
      }),
    ).toEqual([
      "pending-transfer-proposals",
      "sub-header",
      "balance-summary-footer",
      "detail-delegations",
    ]);
  });

  it("renders nothing for a family without blocks", () => {
    const { container } = renderView({ family: {} });

    expect(container).toBeEmptyDOMElement();
  });
});
