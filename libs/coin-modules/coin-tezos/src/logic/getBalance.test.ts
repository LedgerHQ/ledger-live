import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import coinConfig, { TezosCoinConfig } from "../config";
import type { APITokenBalance } from "../network/types";
import { getBalance } from "./getBalance";

const mockTokensBalancesWithAllInfo: APITokenBalance[] = [
  {
    id: 2398642347442177,
    account: { address: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8" },
    token: {
      id: 113484097388545,
      contract: { alias: "BTCtz", address: "KT1T87QbpXEVgkwsNPzz8iRoah3SS3D1MDmh" },
      tokenId: "0",
      standard: "fa2",
      metadata: {
        name: "BTCtez",
        symbol: "BTCtz",
        decimals: "8",
      },
    },
    balance: "2000",
    transfersCount: 2,
    firstLevel: 11909116,
    firstTime: "2026-02-12T14:16:16Z",
    lastLevel: 11969607,
    lastTime: "2026-02-16T20:05:40Z",
  },
];

const mockTokensBalancesWithMissingInfo: APITokenBalance[] = [
  {
    id: 2398642347442177,
    account: { address: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM" },
    token: {
      id: 113484097388545,
      contract: { alias: "BTCtz", address: "KT1T87QbpXEVgkwsNPzz8iRoah3SS3D1MDmh" },
      tokenId: "0",
      standard: "fa2",
    },
    balance: "2000",
    transfersCount: 2,
    firstLevel: 11909116,
    firstTime: "2026-02-12T14:16:16Z",
    lastLevel: 11969607,
    lastTime: "2026-02-16T20:05:40Z",
  },
];

describe("getBalance", () => {
  const mockServer = setupServer();

  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    mockServer.close();
  });

  coinConfig.setCoinConfig(
    () =>
      ({
        status: { type: "active" },
        explorer: { url: "http://tezos.explorer.com" },
      }) as unknown as TezosCoinConfig,
  );
  it("gets the balance of a Tezos account", async () => {
    mockServer.use(
      http.get("http://tezos.explorer.com/v1/accounts/tz1WvvbEGpBXGeTVbLiR6DYBe1izmgiYuZbq", () =>
        HttpResponse.json({ type: "empty" }),
      ),
      http.get("http://tezos.explorer.com/v1/accounts/tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8", () =>
        HttpResponse.json({ type: "user", balance: 25 }),
      ),
      http.get("http://tezos.explorer.com/v1/accounts/tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM", () =>
        HttpResponse.json({
          type: "user",
          balance: 15,
          delegate: { address: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM" },
        }),
      ),
      http.get("http://tezos.explorer.com/v1/tokens/balances", ({ request }) => {
        const url = new URL(request.url);
        const account = url.searchParams.get("account");

        // Return a mocked JSON response when the "account"
        // search parameter equals a specific address.
        if (account === "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8") {
          return HttpResponse.json(mockTokensBalancesWithAllInfo);
        } else if (account === "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM") {
          return HttpResponse.json(mockTokensBalancesWithMissingInfo);
        } else {
          return HttpResponse.json([]);
        }
      }),
    );

    expect(await getBalance("tz1WvvbEGpBXGeTVbLiR6DYBe1izmgiYuZbq")).toEqual([
      {
        value: 0n,
        asset: { type: "native" },
      },
    ]);
    expect(await getBalance("tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8")).toEqual([
      {
        value: BigInt(25),
        asset: { type: "native" },
      },
      {
        value: BigInt("2000"),
        asset: {
          type: "fa2",
          assetReference: "KT1T87QbpXEVgkwsNPzz8iRoah3SS3D1MDmh:0",
          assetOwner: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8",
          name: "BTCtz",
          unit: { magnitude: 8, name: "BTCtez", code: "BTCtz" },
        },
      },
    ]);
    expect(await getBalance("tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM")).toEqual([
      {
        value: 15n,
        asset: { type: "native" },
      },
      {
        value: 15n,
        asset: { type: "native" },
        stake: {
          uid: "delegation-tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM",
          address: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM",
          delegate: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM",
          state: "active",
          asset: {
            type: "native",
          },
          amount: 15n,
          actions: [],
        },
      },
      {
        value: 2000n,
        asset: {
          type: "fa2",
          assetReference: "KT1T87QbpXEVgkwsNPzz8iRoah3SS3D1MDmh:0",
          assetOwner: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM",
          name: "BTCtz",
          unit: {
            code: "BTCtz",
            magnitude: 0,
            name: "BTCtz",
          },
        },
      },
    ]);
  });

  describe("staking positions (Paris upgrade)", () => {
    const address = "tz1StakingAddr";
    const delegateAddress = "tz1BakerAddr";

    function mockAccount(account: Record<string, unknown>) {
      mockServer.use(
        http.get(`http://tezos.explorer.com/v1/accounts/${address}`, () =>
          HttpResponse.json({ type: "user", ...account }),
        ),
        http.get("http://tezos.explorer.com/v1/tokens/balances", () => HttpResponse.json([])),
        http.get("http://tezos.explorer.com/v1/staking/unstake_requests", () =>
          HttpResponse.json([]),
        ),
      );
    }

    it("attaches a delegation Stake when only delegate is set", async () => {
      mockAccount({ balance: 100, delegate: { address: delegateAddress } });

      expect(await getBalance(address)).toEqual([
        { value: 100n, asset: { type: "native" } },
        {
          value: 100n,
          asset: {
            type: "native",
          },
          stake: {
            uid: `delegation-${address}`,
            address,
            delegate: delegateAddress,
            state: "active",
            asset: {
              type: "native",
            },
            amount: 100n,
            actions: [],
          },
        },
      ]);
    });

    it("attaches a stake Stake when stakedBalance > 0 (no delegate)", async () => {
      mockAccount({ balance: 100, stakedBalance: 30 });

      expect(await getBalance(address)).toEqual([
        { value: 100n, asset: { type: "native" }, locked: 30n },
        {
          value: 30n,
          asset: {
            type: "native",
          },
          stake: {
            uid: `stake-${address}`,
            address,
            state: "active",
            asset: {
              type: "native",
            },
            amount: 30n,
            actions: [],
          },
        },
      ]);
    });

    it("splits delegation and stake amounts when both delegate and stakedBalance are set", async () => {
      mockAccount({
        balance: 100,
        stakedBalance: 30,
        delegate: { address: delegateAddress },
      });

      expect(await getBalance(address)).toEqual([
        { value: 100n, asset: { type: "native" }, locked: 30n },
        {
          value: 70n,
          asset: {
            type: "native",
          },
          stake: {
            uid: `delegation-${address}`,
            address,
            delegate: delegateAddress,
            state: "active",
            asset: {
              type: "native",
            },
            amount: 70n,
            actions: [],
          },
        },
        {
          value: 30n,
          asset: {
            type: "native",
          },
          stake: {
            uid: `stake-${address}`,
            address,
            delegate: delegateAddress,
            state: "active",
            asset: {
              type: "native",
            },
            amount: 30n,
            actions: [],
          },
        },
      ]);
    });

    it("attaches an unstaking Stake with state 'deactivating' when a pending request exists", async () => {
      mockServer.use(
        http.get(`http://tezos.explorer.com/v1/accounts/${address}`, () =>
          HttpResponse.json({
            type: "user",
            balance: 100,
            stakedBalance: 30,
            unstakedBalance: 10,
            delegate: { address: delegateAddress },
          }),
        ),
        http.get("http://tezos.explorer.com/v1/staking/unstake_requests", () =>
          HttpResponse.json([
            {
              id: 77,
              cycle: 100,
              baker: { address: delegateAddress },
              staker: { address },
              firstTime: "2026-05-01T00:00:00Z",
              status: "pending",
              actualAmount: 10,
            },
          ]),
        ),
        http.get("http://tezos.explorer.com/v1/tokens/balances", () => HttpResponse.json([])),
      );

      const result = await getBalance(address);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ value: 100n, asset: { type: "native" }, locked: 40n });
      expect(result[3]).toEqual({
        value: 10n,
        asset: { type: "native" },
        stake: {
          uid: "unstaking-77",
          address,
          delegate: delegateAddress,
          state: "deactivating",
          createdAt: new Date("2026-05-01T00:00:00Z"),
          asset: { type: "native" },
          amount: 10n,
          actions: [],
        },
      });
    });

    it("emits per-request unstaking and finalizable Stakes when both statuses are present", async () => {
      mockServer.use(
        http.get(`http://tezos.explorer.com/v1/accounts/${address}`, () =>
          HttpResponse.json({
            type: "user",
            balance: 100,
            unstakedBalance: 50,
            delegate: { address: delegateAddress },
          }),
        ),
        http.get("http://tezos.explorer.com/v1/staking/unstake_requests", () =>
          HttpResponse.json([
            {
              id: 1,
              cycle: 100,
              baker: { address: delegateAddress },
              staker: { address },
              firstTime: "2026-05-01T00:00:00Z",
              status: "pending",
              actualAmount: 20,
            },
            {
              id: 2,
              cycle: 99,
              baker: { address: delegateAddress },
              staker: { address },
              firstTime: "2026-04-25T00:00:00Z",
              status: "finalizable",
              actualAmount: 30,
            },
          ]),
        ),
        http.get("http://tezos.explorer.com/v1/tokens/balances", () => HttpResponse.json([])),
      );

      const result = await getBalance(address);

      expect(result[0]).toEqual({ value: 100n, asset: { type: "native" }, locked: 50n });

      const stakes = result.filter(b => b.stake).map(b => b.stake);
      expect(stakes).toEqual([
        {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 50n,
          actions: [],
        },
        {
          uid: `unstaking-1`,
          address,
          delegate: delegateAddress,
          state: "deactivating",
          createdAt: new Date("2026-05-01T00:00:00Z"),
          asset: { type: "native" },
          amount: 20n,
          actions: [],
        },
        {
          uid: `finalizable-2`,
          address,
          delegate: delegateAddress,
          state: "inactive",
          createdAt: new Date("2026-04-25T00:00:00Z"),
          asset: { type: "native" },
          amount: 30n,
          actions: [],
        },
      ]);
    });

    it("returns only the primary native Balance when no staking activity", async () => {
      mockAccount({ balance: 50 });

      expect(await getBalance(address)).toEqual([{ value: 50n, asset: { type: "native" } }]);
    });

    it("still excludes unstaked-frozen funds from spendable when the unstake_requests endpoint fails", async () => {
      mockServer.use(
        http.get(`http://tezos.explorer.com/v1/accounts/${address}`, () =>
          HttpResponse.json({
            type: "user",
            balance: 100,
            unstakedBalance: 10,
            delegate: { address: delegateAddress },
          }),
        ),
        http.get("http://tezos.explorer.com/v1/staking/unstake_requests", () =>
          HttpResponse.json({ error: "internal" }, { status: 500 }),
        ),
        http.get("http://tezos.explorer.com/v1/tokens/balances", () => HttpResponse.json([])),
      );

      const result = await getBalance(address);

      // Breakdown rows are lost, but locked/delegated still derive from the account-level unstakedBalance.
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ value: 100n, asset: { type: "native" }, locked: 10n });
      expect(result[1]).toEqual({
        value: 90n,
        asset: { type: "native" },
        stake: {
          uid: `delegation-${address}`,
          address,
          delegate: delegateAddress,
          state: "active",
          asset: { type: "native" },
          amount: 90n,
          actions: [],
        },
      });
    });
  });
});
