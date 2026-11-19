import React from "react";
import BigNumber from "bignumber.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { trackPage } from "@shared/analytics";
import { abandonStakePosition, useShownStakePosition } from "@features/flow-stake-position";
import { act, render, renderHook, screen, withFlagOverrides } from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import Modals from "~/screens/Modals";
import AccountScreen from "../AccountScreen";

// The sheets render inline without their queue: how the row sheet hands over to the position sheet
// on a device is not covered here.
jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  ...jest.requireActual("@shared/ui-queued-bottom-sheet/testing/module-mock"),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
    BottomSheetScrollView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
    BottomSheetHeader: ({ title }: { title?: string }) => (
      <RN.Text accessibilityRole="header">{title}</RN.Text>
    ),
  };
});

// A sibling of the sheet in the app-level modals, off by default, whose webview cannot load here.
jest.mock("~/screens/RatingsModal", () => ({ __esModule: true, default: () => null }));

const SOL = 1_000_000_000;
const VALIDATOR = "FakeVote1111111111111111111111111111111111";
const STAKE_ACCOUNT = "FakeStake111111111111111111111111111111111";
const STAKES_URL = "https://earn.api.live.ledger.com/v3/stakes";
const VALIDATORS_URL = "https://earn.api.live.ledger.com/v0/network/solana/validator-details";
const VALIDATORS_SUMMARY_URL = "https://earn.api.live.ledger.com/figment/solana/validators_summary";
const ROW = `delegation-row-${STAKE_ACCOUNT}`;
const ROW_SHEET = "account-detail-solana-delegations-sheet";
const POSITION_SHEET = "stake-position-sheet";

const account: SolanaAccount = {
  ...genAccount("account-detail-stake-position", {
    currency: getCryptoCurrencyById("solana"),
    operationsSize: 2,
  }),
  balance: new BigNumber(5 * SOL),
  spendableBalance: new BigNumber(5 * SOL),
  lastSyncDate: new Date(),
  stakingResources: {
    delegations: [
      {
        positionId: STAKE_ACCOUNT,
        validatorAddress: VALIDATOR,
        amount: new BigNumber(10 * SOL),
        activeAmount: new BigNumber(10 * SOL),
        inactiveAmount: new BigNumber(0),
        withdrawableAmount: new BigNumber(0),
        canStake: true,
        canWithdraw: true,
        pendingRewards: new BigNumber(0),
        status: "bonded",
      },
    ],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber(10 * SOL),
    pendingRewardsBalance: new BigNumber(0),
    unbondingBalance: new BigNumber(0),
  },
};

/** A `/v3/stakes` row of the requested wallet, shaped like the Earn backend's. */
const stakeRow = (address: string) => ({
  type: "BatchStakeViewV1",
  id: { network: "solana", address },
  stake: {
    currency: "solana",
    status: "activated",
    protocol_name: "Ledger by Figment",
    staked_balance: String(10 * SOL),
    rewards: [{ currency: "solana", total: String(SOL) }],
    details: {
      type: "SolanaDetailsView",
      stake_account: STAKE_ACCOUNT,
      validator_address: VALIDATOR,
    },
  },
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccount() {
  return render(
    <>
      <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={ScreenName.Account}
          component={AccountScreen}
          initialParams={{ accountId: account.id }}
        />
      </Stack.Navigator>
      <Modals />
    </>,
    {
      overrideInitialState: (state: State): State => {
        const withFlags = withFlagOverrides({
          accountDetail: { enabled: true },
          earnNativeStakePosition: { enabled: true, params: { accountPage: true } },
        })(state);
        return { ...withFlags, accounts: { ...withFlags.accounts, active: [account] } };
      },
    },
  );
}

const isOpen = (testID: string) =>
  screen.queryByTestId(testID)?.props.accessibilityState?.expanded === true;

describe("AccountDetail stake position entry", () => {
  beforeAll(async () => {
    await getAccountBridge(account);
  });

  beforeEach(() => {
    server.use(
      http.get(VALIDATORS_URL, () => HttpResponse.json([])),
      http.get(VALIDATORS_SUMMARY_URL, () => HttpResponse.json([])),
      http.post(STAKES_URL, async ({ request }) => {
        const body = (await request.json()) as { address: string }[];
        return HttpResponse.json({
          data: body.map(({ address }) => stakeRow(address)),
          meta: { is_stale: false },
        });
      }),
    );
  });

  afterEach(() => {
    const { result, unmount } = renderHook(() => useShownStakePosition());
    const id = result.current.request?.id;
    if (id !== undefined) act(() => abandonStakePosition(id));
    unmount();
  });

  it("opens a delegation in the stake position sheet from its View details action", async () => {
    const { user } = renderAccount();

    await user.press(await screen.findByTestId(ROW));
    expect(isOpen(ROW_SHEET)).toBe(true);
    await user.press(screen.getByRole("button", { name: "View details" }));

    expect(isOpen(ROW_SHEET)).toBe(false);
    expect(isOpen(POSITION_SHEET)).toBe(true);
    expect(await screen.findByTestId("stake-position-details")).toBeVisible();
    expect(screen.getByRole("header", { name: "Earning Solana" })).toBeVisible();
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Stake position",
        name: "Details",
        props: expect.objectContaining({ source: "account" }),
      }),
    );
  });
});
