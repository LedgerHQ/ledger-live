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
          assetReference: "KT1T87QbpXEVgkwsNPzz8iRoah3SS3D1MDmh",
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
        stake: {
          uid: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM",
          address: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM",
          delegate: "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oMMM",
          state: "active",
          asset: {
            type: "native",
          },
          amount: 15n,
        },
      },
      {
        value: 2000n,
        asset: {
          type: "fa2",
          assetReference: "KT1T87QbpXEVgkwsNPzz8iRoah3SS3D1MDmh",
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
});
