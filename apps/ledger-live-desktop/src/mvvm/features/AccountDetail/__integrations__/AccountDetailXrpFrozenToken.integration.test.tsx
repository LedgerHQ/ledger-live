import React from "react";
import BigNumber from "bignumber.js";
import { Route, Routes } from "react-router";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import { importLLDCoinFamily } from "~/renderer/families";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "~/renderer/families/xrp/__mocks__/account.mock";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: () => ["iou", "mpt"],
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({ data: [] }),
}));

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeCurrency: () => false,
    getCanStakeUsingLedgerLive: () => false,
    getRouteToPlatformApp: () => null,
  }),
}));

const funded = <T extends Account | XrpTokenAccount>(account: T): T => ({
  ...account,
  balance: new BigNumber(100),
  spendableBalance: new BigNumber(100),
});

const unfrozenToken = funded(XRP_IOU_TOKEN_ACCOUNT);
const frozenToken = { ...makeXrpTokenAccount({ isLocked: true }), id: `${XRP_ACCOUNT.id}|frozen` };

function renderAccountPage(account: Account) {
  return render(
    <Routes>
      <Route path="/account/:id/*" element={<AccountDetailRoute />} />
    </Routes>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts: [account],
      },
    },
  );
}

beforeAll(async () => {
  await importLLDCoinFamily("xrp");
});

beforeEach(() => {
  jest.mocked(useRampCatalog).mockReturnValue({
    isCurrencyAvailable: () => false,
    getSupportedCryptoCurrencyIds: () => [],
  } as unknown as ReturnType<typeof useRampCatalog>);
});

describe("XRP frozen token on Account Detail", () => {
  const account = funded({
    ...XRP_ACCOUNT,
    operationsCount: 1,
    subAccounts: [unfrozenToken, funded(frozenToken)],
  });

  it("shows the frozen banner on the XRP account page", async () => {
    renderAccountPage(account);

    expect(await screen.findByText("Your RLUSD has been frozen")).toBeVisible();
  });

  it("leaves the frozen token out of the Send picker", async () => {
    const { user } = renderAccountPage(account);

    await user.click(await screen.findByTestId("account-detail-hero-actions-send"));

    const picker = await screen.findByTestId("account-detail-asset-picker");
    expect(
      within(picker).getByTestId(`account-detail-asset-picker-${unfrozenToken.token.id}`),
    ).toBeVisible();
    expect(
      within(picker).queryByTestId(`account-detail-asset-picker-${frozenToken.token.id}`),
    ).not.toBeInTheDocument();
  });
});
