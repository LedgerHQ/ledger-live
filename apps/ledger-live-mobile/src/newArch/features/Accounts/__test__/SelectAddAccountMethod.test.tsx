import React from "react";
import { render } from "@testing-library/react-native";
import SelectAddAccountMethod from "../screens/AddAccount/components/SelectAddAccountMethod";
import useSelectAddAccountMethodViewModel from "../screens/AddAccount/components/SelectAddAccountMethod/useSelectAddAccountMethodViewModel";
import ForceTheme from "~/components/theme/ForceTheme";

jest.mock(
  "../screens/AddAccount/components/SelectAddAccountMethod/useSelectAddAccountMethodViewModel",
);

describe("SelectAddAccountMethod", () => {
  it("renders the correct cards when isReadOnlyModeEnabled is false and isWalletSyncEnabled is true", () => {
    (useSelectAddAccountMethodViewModel as jest.Mock).mockReturnValue({
      isReadOnlyModeEnabled: false,
      isWalletSyncEnabled: true,
      onClickAdd: () => {},
      onClickImport: () => {},
    });

    const { queryByTestId } = render(
      <ForceTheme selectedPalette="light">
        <SelectAddAccountMethod />
      </ForceTheme>,
    );

    const importWithLedgerCard = queryByTestId("add-accounts-modal-add-button");
    const walletSyncCard = queryByTestId("add-accounts-modal-wallet-sync-button");
    const importFromDesktopCard = queryByTestId("add-accounts-modal-import-button");

    expect(importWithLedgerCard).toBeTruthy();
    expect(walletSyncCard).toBeTruthy();
    expect(importFromDesktopCard).toBeNull();
  });
  it("renders the correct card when isReadOnlyModeEnabled is true and isWalletSyncEnabled is true", () => {
    (useSelectAddAccountMethodViewModel as jest.Mock).mockReturnValue({
      isReadOnlyModeEnabled: true,
      isWalletSyncEnabled: true,
      onClickAdd: () => {},
      onClickImport: () => {},
    });

    const { queryByTestId } = render(
      <ForceTheme selectedPalette="light">
        <SelectAddAccountMethod />
      </ForceTheme>,
    );

    const importWithLedgerCard = queryByTestId("add-accounts-modal-add-button");
    const walletSyncCard = queryByTestId("add-accounts-modal-wallet-sync-button");
    const importFromDesktopCard = queryByTestId("add-accounts-modal-import-button");

    expect(importWithLedgerCard).toBeNull();
    expect(walletSyncCard).toBeTruthy();
    expect(importFromDesktopCard).toBeNull();
  });
  it("renders the correct card when isReadOnlyModeEnabled is false and isWalletSyncEnabled is false", () => {
    (useSelectAddAccountMethodViewModel as jest.Mock).mockReturnValue({
      isReadOnlyModeEnabled: false,
      isWalletSyncEnabled: false,
      onClickAdd: () => {},
      onClickImport: () => {},
    });

    const { queryByTestId } = render(
      <ForceTheme selectedPalette="light">
        <SelectAddAccountMethod />
      </ForceTheme>,
    );

    const importWithLedgerCard = queryByTestId("add-accounts-modal-add-button");
    const walletSyncCard = queryByTestId("add-accounts-modal-wallet-sync-button");
    const importFromDesktopCard = queryByTestId("add-accounts-modal-import-button");

    expect(importWithLedgerCard).toBeTruthy();
    expect(walletSyncCard).toBeNull();
    expect(importFromDesktopCard).toBeTruthy();
  });
});
