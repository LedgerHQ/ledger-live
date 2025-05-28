import React from "react";
import { render, screen } from "tests/testSetup";
import { Header, HeaderProps } from "..";
import { FlowStep, NavigationDirection } from "../navigation";

describe("Header", () => {
  it("should render Header component correctly in asset selection step", () => {
    const props: HeaderProps = {
      showBackButton: false,
      title: "asset",
      navKey: FlowStep.SELECT_ASSET_TYPE,

      navDirection: NavigationDirection.FORWARD,
      onBackClick: jest.fn(),
    };

    render(<Header {...props} />);

    expect(screen.getByText(/select/i)).toBeVisible();
    expect(screen.getByTestId("select-asset-drawer-title-dynamic")).toHaveTextContent(/asset/i);
  });

  it("should render Header component correctly in network selection step", () => {
    const props: HeaderProps = {
      showBackButton: true,
      title: "network",
      navKey: FlowStep.SELECT_NETWORK,
      navDirection: NavigationDirection.FORWARD,
      onBackClick: jest.fn(),
    };

    render(<Header {...props} />);

    expect(screen.getByText(/select/i)).toBeVisible();
    expect(screen.getByTestId("select-asset-drawer-title-dynamic")).toHaveTextContent(/network/i);
    expect(screen.getByTestId("mad-back-button")).toBeVisible();
  });

  it("should call onBackClick when back button is clicked", async () => {
    const onBackClick = jest.fn();
    const props: HeaderProps = {
      showBackButton: true,
      title: "network",
      navKey: FlowStep.SELECT_NETWORK,
      navDirection: NavigationDirection.FORWARD,
      onBackClick,
    };

    const { user } = render(<Header {...props} />);

    const backButton = screen.getByTestId("mad-back-button");
    await user.click(backButton);

    expect(onBackClick).toHaveBeenCalled();
  });
});
