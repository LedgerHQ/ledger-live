import React from "react";
import { render, screen } from "tests/testSetup";
import { Header, type HeaderProps } from "../components";
import { NavigationDirection } from "../../SelectAssetFlow/useSelectAssetFlow";
import { MockedList } from "./Shared";

jest.mock("@ledgerhq/react-ui/pre-ldls", () => {
  const actual = jest.requireActual("@ledgerhq/react-ui/pre-ldls");
  return {
    ...actual,
    get AssetList() {
      return MockedList;
    },
    get NetworkList() {
      return MockedList;
    },
  };
});

describe("SelectAssetFlow Components", () => {
  describe("Header", () => {
    it("should render Header component correctly", () => {
      const props: HeaderProps = {
        ticker: "BTC",
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
        ticker: "BTC",
        navDirection: NavigationDirection.FORWARD,
        onBackClick,
      };

      const { user } = render(<Header {...props} />);

      const backButton = screen.getByTestId("mad-back-button");
      await user.click(backButton);

      expect(onBackClick).toHaveBeenCalled();
    });
  });
});
