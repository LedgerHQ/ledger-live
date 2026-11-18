import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { HttpResponse, http, server } from "@tests/server";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import ManageToken from "../ManageToken";
import type { XrpManageTokenFlowParamList } from "../types";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
  overrideWithAccounts,
} from "../../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../../__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const EDIT_BUTTON = `xrp-manage-asset-edit-${xrpIouToken.id}`;
const DELETE_BUTTON = `xrp-manage-asset-delete-${xrpIouToken.id}`;

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

const Stack = createNativeStackNavigator<XrpManageTokenFlowParamList>();

const endpoints = { node: jest.fn<Response, [{ request: Request }]>() };

function mockTransferRate(transferRate?: number) {
  endpoints.node.mockImplementation(() => {
    const node = { LedgerEntryType: "AccountRoot", Flags: 0, TransferRate: transferRate };

    return HttpResponse.json({ result: { node, account_data: node, status: "success" } });
  });
}

// coin-xrp caches each issuer's account root: a test that reads a fee needs its own issuer
function makeAccountWithIssuer(contractAddress: string): Account {
  const tokenAccount = {
    ...XRP_IOU_TOKEN_ACCOUNT,
    token: { ...XRP_IOU_TOKEN_ACCOUNT.token, contractAddress },
  };

  return { ...XRP_ACCOUNT, subAccounts: [tokenAccount] };
}

function renderManageToken(account: Account) {
  return render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.XrpManageTokenList}
        component={ManageToken}
        initialParams={{ accountId: account.id }}
      />
    </Stack.Navigator>,
    { overrideInitialState: overrideWithAccounts(account) },
  );
}

describe("XRP Manage assets", () => {
  beforeEach(() => {
    jest.mocked(getXrpEnabledTokenStandards).mockReturnValue(["iou", "mpt"]);
    endpoints.node.mockReset();
    mockTransferRate();
    server.use(http.post(XRPL_TESTNET_NODE, endpoints.node));
  });

  it("lists a held token with its limit and rippling", async () => {
    renderManageToken(XRP_ACCOUNT_WITH_TOKEN);

    const tokenName = await screen.findByText("RLUSD");

    expect(tokenName).toBeVisible();
    expect(screen.getByText("Trust Line (IOU)")).toBeVisible();
    expect(screen.getByText("1,000 RLUSD")).toBeVisible();
    expect(screen.getByText("Deactivated")).toBeVisible();
  });

  it("shows the issuer's transfer fee and the locked owner reserve", async () => {
    mockTransferRate(1_005_000_000);
    renderManageToken(makeAccountWithIssuer("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"));

    const transferFee = await screen.findByText("0.5%");

    expect(transferFee).toBeVisible();
    expect(screen.getByText(/0\.2 XRP/)).toBeVisible();
  });

  it("shows the transfer fee as not available when it can't be fetched", async () => {
    endpoints.node.mockImplementation(() => HttpResponse.error());
    renderManageToken(makeAccountWithIssuer("rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf"));

    const feeError = await screen.findByText("Not available");

    expect(feeError).toBeVisible();
  });

  it("shows Maximum for a limit at the maximum", async () => {
    const atMaximum = {
      ...XRP_IOU_TOKEN_ACCOUNT,
      xrpResources: {
        ...XRP_IOU_TOKEN_ACCOUNT.xrpResources,
        limit: MAX_TRUST_LIMIT,
        isRippling: true,
      },
    };
    renderManageToken({ ...XRP_ACCOUNT, subAccounts: [atMaximum] });

    const limit = await screen.findByText("Maximum");

    expect(limit).toBeVisible();
    expect(screen.getByText("Activated")).toBeVisible();
  });

  it("shows Edit and Delete disabled on an IOU card", async () => {
    renderManageToken(XRP_ACCOUNT_WITH_TOKEN);

    const editButton = await screen.findByTestId(EDIT_BUTTON);

    expect(editButton).toBeDisabled();
    expect(screen.getByTestId(DELETE_BUTTON)).toBeDisabled();
  });

  it("lists an MPT token with Delete only, without limit, rippling or Edit", async () => {
    renderManageToken({ ...XRP_ACCOUNT, subAccounts: [XRP_MPT_TOKEN_ACCOUNT] });

    const tokenType = await screen.findByText("Multi Purpose Token");

    expect(tokenType).toBeVisible();
    expect(screen.queryByText("Rippling")).toBeNull();
    expect(screen.queryByTestId(`xrp-manage-asset-edit-${xrpMptToken.id}`)).toBeNull();
    expect(screen.getByTestId(`xrp-manage-asset-delete-${xrpMptToken.id}`)).toBeDisabled();
  });

  it("leaves out a removed token and shows the empty state", async () => {
    renderManageToken({ ...XRP_ACCOUNT, subAccounts: [XRP_REMOVED_TOKEN_ACCOUNT] });

    const emptyMessage = await screen.findByText("This account has no tokens yet.");

    expect(emptyMessage).toBeVisible();
    expect(screen.queryByTestId(EDIT_BUTTON)).toBeNull();
  });
});
