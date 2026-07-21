import React from "react";
import { render, screen } from "@testing-library/react";
import { ContactsSectionHeader } from "./ContactsSectionHeader.native";

jest.mock("@ledgerhq/lumen-ui-rnative", () => ({
  Box: ({
    children,
    lx,
    testID,
  }: React.PropsWithChildren<{ lx: { backgroundColor?: string }; testID?: string }>) => (
    <div data-background-color={lx.backgroundColor} data-testid={testID}>
      {children}
    </div>
  ),
  SectionHeader: ({ children, testID }: React.PropsWithChildren<{ testID?: string }>) => (
    <div data-testid={testID}>{children}</div>
  ),
  SectionHeaderTitle: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));

describe("ContactsSectionHeader", () => {
  it("should render an opaque background behind the section title", () => {
    render(<ContactsSectionHeader title="A" />);

    expect(screen.getByTestId("contacts-section-A-background")).toHaveAttribute(
      "data-background-color",
      "base",
    );
    expect(screen.getByTestId("contacts-section-A")).toBeVisible();
    expect(screen.getByText("A")).toBeVisible();
  });
});
