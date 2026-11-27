import React from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { xrpApi } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import {
  MAX_TRUST_LIMIT,
  getNetworkReservesForCurrency,
} from "@ledgerhq/live-common/families/xrp/logicPublic";
import { HttpResponse, delay, http, server } from "@tests/server";
import { act, render, screen } from "@tests/test-renderer";
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

// coin-xrp caches a fetched server_info: a test sets the reserves here instead of on the node
jest.mock("@ledgerhq/live-common/families/xrp/logicPublic", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/families/xrp/logicPublic");

  return {
    ...actual,
    getNetworkReservesForCurrency: jest.fn(actual.getNetworkReservesForCurrency),
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
    const info = { validated_ledger: { reserve_base_xrp: 1, reserve_inc_xrp: 0.3 } };

    return HttpResponse.json({ result: { node, account_data: node, info, status: "success" } });
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

function EditDetailsStub(props: Readonly<{ route: { params: object } }>) {
  return <Text testID="edit-details-params">{JSON.stringify(props.route.params)}</Text>;
}

function renderManageToken(account: Account) {
  return render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.XrpManageTokenList}
        component={ManageToken}
        initialParams={{ accountId: account.id }}
      />
      <Stack.Screen name={ScreenName.XrpManageTokenSettings} component={EditDetailsStub} />
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
    expect(screen.getByText("Trust Line")).toBeVisible();
    expect(screen.getByText("1,000 RLUSD")).toBeVisible();
    expect(screen.getByText("Deactivated")).toBeVisible();
  });

  it("shows the issuer's transfer fee and the locked owner reserve", async () => {
    mockTransferRate(1_005_000_000);
    renderManageToken(makeAccountWithIssuer("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"));

    const transferFee = await screen.findByText("0.5%");

    expect(transferFee).toBeVisible();
    expect(await screen.findByText(/0\.3 XRP/)).toBeVisible();
  });

  it("shows a skeleton until the transfer fee loads", async () => {
    server.use(http.post(XRPL_TESTNET_NODE, () => delay("infinite")));
    renderManageToken(makeAccountWithIssuer("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"));

    const skeleton = await screen.findByTestId("xrp-manage-asset-transfer-fee-loading");

    expect(skeleton).toBeVisible();
  });

  it("shows a skeleton until the locked amount loads", async () => {
    jest.mocked(getNetworkReservesForCurrency).mockReturnValueOnce(new Promise(() => {}));
    renderManageToken(XRP_ACCOUNT_WITH_TOKEN);

    const skeleton = await screen.findByTestId("xrp-manage-asset-locked-amount-loading");

    expect(skeleton).toBeVisible();
  });

  it("shows an error for the locked amount when the reserves can't be fetched", async () => {
    jest.mocked(getNetworkReservesForCurrency).mockRejectedValueOnce(new Error("timeout"));
    renderManageToken(makeAccountWithIssuer("rDMRUxGcahf3YYZUd4BDHukwFRaRR3F8Tp"));

    const lockedAmount = await screen.findByText("Couldn't load");

    expect(lockedAmount).toBeVisible();
  });

  it("shows an error instead of the last locked amount when a refetch fails", async () => {
    const { store } = renderManageToken(makeAccountWithIssuer("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"));
    expect(await screen.findByText(/0\.3 XRP/)).toBeVisible();

    jest.mocked(getNetworkReservesForCurrency).mockRejectedValueOnce(new Error("timeout"));
    await act(async () => {
      await store.dispatch(
        xrpApi.endpoints.getNetworkReserves.initiate(XRP_ACCOUNT.currency.id, {
          forceRefetch: true,
        }),
      );
    });

    const lockedAmount = await screen.findByText("Couldn't load");

    expect(lockedAmount).toBeVisible();
    expect(screen.queryByText(/0\.3 XRP/)).toBeNull();
  });

  it("shows an error for the transfer fee when it can't be fetched", async () => {
    jest
      .mocked(getNetworkReservesForCurrency)
      .mockResolvedValueOnce({ base: "1000000", increment: "300000" });
    endpoints.node.mockImplementation(() => HttpResponse.error());
    renderManageToken(makeAccountWithIssuer("rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf"));

    const feeError = await screen.findByText("Couldn't load");

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

  it("shows Edit and Delete enabled on an IOU card", async () => {
    renderManageToken(XRP_ACCOUNT_WITH_TOKEN);

    const editButton = await screen.findByTestId(EDIT_BUTTON);

    expect(editButton).toBeEnabled();
    expect(screen.getByTestId(DELETE_BUTTON)).toBeEnabled();
  });

  it("opens Edit details for the token account on Edit", async () => {
    const { user } = renderManageToken(XRP_ACCOUNT_WITH_TOKEN);

    const editButton = await screen.findByTestId(EDIT_BUTTON);
    await user.press(editButton);

    const params = await screen.findByTestId("edit-details-params");
    expect(JSON.parse(params.props.children)).toEqual({
      accountId: XRP_IOU_TOKEN_ACCOUNT.id,
      parentId: XRP_ACCOUNT_WITH_TOKEN.id,
    });
  });

  it("lists an MPT token with Delete only, without limit, rippling or Edit", async () => {
    renderManageToken({ ...XRP_ACCOUNT, subAccounts: [XRP_MPT_TOKEN_ACCOUNT] });

    const tokenType = await screen.findByText("Multi-Purpose Token (MPT)");

    expect(tokenType).toBeVisible();
    expect(screen.queryByText("Rippling")).toBeNull();
    expect(screen.queryByTestId(`xrp-manage-asset-edit-${xrpMptToken.id}`)).toBeNull();
    expect(screen.getByTestId(`xrp-manage-asset-delete-${xrpMptToken.id}`)).toBeEnabled();
  });

  it("leaves out a removed token and shows the empty state", async () => {
    renderManageToken({ ...XRP_ACCOUNT, subAccounts: [XRP_REMOVED_TOKEN_ACCOUNT] });

    const emptyMessage = await screen.findByText("This account has no tokens yet.");

    expect(emptyMessage).toBeVisible();
    expect(screen.queryByTestId(EDIT_BUTTON)).toBeNull();
  });
});
