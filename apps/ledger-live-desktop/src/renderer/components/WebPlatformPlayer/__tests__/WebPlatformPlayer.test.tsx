import React from "react";
import { BigNumber } from "bignumber.js";
import { act, render, renderHook, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useShownStakePosition, type StakePositionResult } from "@features/flow-stake-position";
import { importLLDCoinFamily } from "~/renderer/families";
import WebPlatformPlayer from "..";

const mockWebviewProps = jest.fn<void, [{ customHandlers: WalletAPICustomHandlers }]>();

jest.mock("~/renderer/components/Web3AppWebview", () => ({
  Web3AppWebview: (props: { customHandlers: WalletAPICustomHandlers }) => {
    mockWebviewProps(props);
    return <div data-testid="live-app-webview" />;
  },
}));
jest.mock("~/renderer/components/WebPlatformPlayer/TopBar", () => ({
  TopBar: () => null,
}));

const manifest = { id: "earn", name: "Earn", url: "https://earn.example" } as LiveAppManifest;

const solanaAccount = {
  ...genAccount("web-platform-player-solana", {
    currency: getCryptoCurrencyById("solana"),
    operationsSize: 0,
  }),
  stakingResources: {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber(0),
    pendingRewardsBalance: new BigNumber(0),
    unbondingBalance: new BigNumber(0),
  },
};

type OpenHandler = (request: { params: unknown }) => Promise<StakePositionResult>;

const lastCustomHandlers = () => mockWebviewProps.mock.calls.at(-1)?.[0].customHandlers ?? {};

describe("WebPlatformPlayer", () => {
  beforeAll(() => importLLDCoinFamily(solanaAccount.currency.family));

  it("should let the live app open a stake position", () => {
    render(<WebPlatformPlayer manifest={manifest} inputs={{}} />);

    expect(lastCustomHandlers()["custom.stake.position.open"]).toEqual(expect.any(Function));
  });

  it("should answer null to the stake position it opened when it unmounts", async () => {
    setWalletApiIdForAccountId(solanaAccount.id);
    const { unmount, store } = render(<WebPlatformPlayer manifest={manifest} inputs={{}} />, {
      initialState: { accounts: [solanaAccount] },
    });
    const shown = renderHook(() => useShownStakePosition(), { store });
    const open = lastCustomHandlers()["custom.stake.position.open"] as unknown as OpenHandler;

    let answer: Promise<StakePositionResult> = Promise.resolve({ action: "earnMore" });
    act(() => {
      answer = open({
        params: {
          accountId: getWalletApiIdFromAccountId(solanaAccount.id),
          positionId: "stake-account",
          validatorAddress: "vote-account",
        },
      });
    });
    await waitFor(() => expect(shown.result.current.phase).toBe("open"));
    unmount();

    await expect(answer).resolves.toEqual({ action: null });
  });
});
