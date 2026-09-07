import React from "react";
import { render, screen } from "@testing-library/react";
import type { CasperAccount, CasperOperation } from "@ledgerhq/live-common/families/casper/types";

jest.mock("react-i18next", () => ({
  Trans: ({ defaults, i18nKey }: { defaults?: string; i18nKey: string }) => (
    <span>{defaults ?? i18nKey}</span>
  ),
}));

jest.mock("~/renderer/drawers/OperationDetails/styledComponents", () => ({
  OpDetailsTitle: ({ children }: { children: React.ReactNode }) => <dt>{children}</dt>,
  OpDetailsData: ({ children }: { children: React.ReactNode }) => <dd>{children}</dd>,
  OpDetailsSection: ({ children }: { children: React.ReactNode }) => <dl>{children}</dl>,
}));

jest.mock("~/renderer/components/Ellipsis", () => ({ children }: { children: React.ReactNode }) => (
  <span>{children}</span>
));

import OperationDetailsModule from "./operationDetails";

const { OperationDetailsExtra } = OperationDetailsModule;

const makeOperation = (transferId?: string): CasperOperation =>
  ({
    extra: { ...(transferId !== undefined && { transferId }) },
  }) as unknown as CasperOperation;

describe("OperationDetailsExtra", () => {
  it("renders transferId section when transferId is present", () => {
    render(
      <OperationDetailsExtra
        operation={makeOperation("123456")}
        account={{} as CasperAccount}
        type="OUT"
      />,
    );

    expect(screen.getByText("transferId")).toBeVisible();
    expect(screen.getByText("123456")).toBeVisible();
  });

  it("renders nothing when transferId is absent", () => {
    const { container } = render(
      <OperationDetailsExtra
        operation={makeOperation()}
        account={{} as CasperAccount}
        type="OUT"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
