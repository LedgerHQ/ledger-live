/**
 * @jest-environment jsdom
 */
import React, { useState } from "react";
import { render, screen } from "tests/testUtils";
import { CoinControlModal } from "../Ordinals/components/CoinControlModal";
import { MockedbtcAccount, MockedTransaction, getMockedTxStatus } from "./shared";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { checkAccountSupported } from "@ledgerhq/live-common/account/support";
import { Button } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import * as walletSelectors from "~/renderer/reducers/wallet";
import { setHasProtectedOrdinalsAssets } from "~/renderer/actions/settings";
import { useDispatch } from "react-redux";

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

jest.mock("@ledgerhq/live-common/account/support");
const mockedCheckAccount = jest.mocked(checkAccountSupported);

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

beforeAll(() => {
  mockedCheckAccount.mockImplementation(() => null);
});

afterAll(() => {
  mockedCheckAccount.mockReset();
});

jest.mock("~/renderer/reducers/wallet", () => ({
  ...jest.requireActual("~/renderer/reducers/wallet"),
  useMaybeAccountName: jest.fn(),
}));

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: jest.fn(),
}));

const MockedCoinControlModal = ({ withErrors = false }: { withErrors?: boolean }) => {
  const [isOpened, setIsOpened] = useState(false);
  return (
    <>
      <div id="modals" />
      <Button onClick={() => setIsOpened(true)}>Open Coin Control</Button>
      <CoinControlModal
        isOpened={isOpened}
        onClose={() => setIsOpened(false)}
        account={MockedbtcAccount}
        transaction={MockedTransaction}
        onChange={() => {}}
        updateTransaction={() => {}}
        status={getMockedTxStatus({ withErrors })}
      />
    </>
  );
};

const Settings = {
  ...INITIAL_STATE_SETTINGS,
  overriddenFeatureFlags: {
    lldnewArchOrdinals: {
      enabled: true,
    },
  },
};

describe("BTCCoinControl", () => {
  it("should display Bitcoin coin control modal without footer", async () => {
    const { user } = render(<MockedCoinControlModal withErrors />, {
      initialState: {
        settings: {
          ...Settings,
        },
      },
    });

    await user.click(screen.getByText(/Open Coin Control/i));

    expect(screen.getByText(/select the utxo you want to use/i)).toBeVisible();
    expect(screen.getByText(/0\.05 btc/i)).toBeVisible();
    expect(screen.getByText(/exclude ordinals assets/i)).toBeVisible();
    expect(screen.queryByText(/learn more about this setting/i)).not.toBeInTheDocument();
  });

  it("should display Bitcoin coin control modal with footer", async () => {
    const { user } = render(<MockedCoinControlModal />, {
      initialState: {
        settings: {
          ...Settings,
        },
      },
    });

    await user.click(screen.getByText(/Open Coin Control/i));

    expect(screen.getByText(/select the utxo you want to use/i)).toBeVisible();
    expect(screen.getByText(/0\.05 btc/i)).toBeVisible();
    expect(screen.getByText(/exclude ordinals assets/i)).toBeVisible();
    expect(screen.getByText(/learn more about this setting/i)).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: /confirm/i,
      }),
    ).toBeVisible();
    await user.click(screen.getByText(/learn more about this setting/i));
    expect(openURL).toHaveBeenCalledWith("https://support.ledger.com/article/360015996580-zd");
  });

  it("should display Bitcoin coin control modal and the details for normal utxo", async () => {
    const { user } = render(<MockedCoinControlModal />, {
      initialState: {
        settings: {
          ...Settings,
        },
      },
    });
    await user.click(screen.getByText(/Open Coin Control/i));

    expect(screen.getAllByTestId("chevron")).toHaveLength(2);
    await user.click(screen.getAllByTestId("chevron")[0]);
    expect(screen.getByText(/address/i)).toBeVisible();
    await user.click(screen.getAllByTestId("chevron")[0]);
    expect(screen.queryByText(/address/i)).not.toBeInTheDocument();
  });

  it("should display Bitcoin coin control modal with custom account name", async () => {
    (walletSelectors.useMaybeAccountName as jest.Mock).mockImplementation(
      () => "Special Account Name",
    );

    const { user } = render(<MockedCoinControlModal />, {
      initialState: {
        settings: {
          ...Settings,
        },
      },
    });
    await user.click(screen.getByText(/Open Coin Control/i));

    expect(screen.getByText(/Special Account Name/i)).toBeVisible();
  });

  it("should display Bitcoin coin control and user can protect or not assets", async () => {
    const dispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(dispatch);

    const { user } = render(<MockedCoinControlModal />, {
      initialState: {
        settings: {
          ...Settings,
          hasProtectedOrdinalsAssets: false,
        },
      },
    });
    await user.click(screen.getByText(/Open Coin Control/i));

    expect(screen.getByTestId(/ordinals-protect-switch/i)).toBeVisible();
    await user.click(screen.getByTestId(/ordinals-protect-switch/i));
    expect(dispatch).toHaveBeenCalledWith(setHasProtectedOrdinalsAssets(true));
  });

  it("should display Bitcoin coin control modal and user can select his strategy", async () => {
    (walletSelectors.useMaybeAccountName as jest.Mock).mockImplementation(
      () => "Special Account Name",
    );

    const { user } = render(<MockedCoinControlModal />, {
      initialState: {
        settings: {
          ...Settings,
        },
      },
    });

    const keyDownEvent = new KeyboardEvent("keydown", { keyCode: 37 });
    const enterEvent = new KeyboardEvent("keydown", { keyCode: 13 });

    await user.click(screen.getByText(/Open Coin Control/i));
    expect(screen.getByText(/oldest coins first/i)).toBeVisible();
    await user.click(screen.getByText(/oldest coins first/i));

    // necessary to simulate the keydown event since the component is using a custom dropdown and click is not suficient
    window.dispatchEvent(keyDownEvent);
    window.dispatchEvent(enterEvent);

    // we check if there is the 2 other options
    expect(screen.getByText(/minimize fees/i)).toBeVisible();
    expect(screen.getByText(/minimize future fees/i)).toBeVisible();
  });
});
