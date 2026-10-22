import { pruneAccountRoutes, type NavigatorStateLike } from "../pruneAccountRoutes";

const accountId = "btc-1";
const accountRoute = (key: string) => ({ key, params: { accountId } });

describe("pruneAccountRoutes", () => {
  it("removes account routes from a stack and focuses the last remaining one", () => {
    const state = {
      type: "stack",
      index: 2,
      routes: [{ key: "previous" }, accountRoute("account"), accountRoute("operation")],
    };

    expect(pruneAccountRoutes(state, accountId)).toEqual({
      type: "stack",
      index: 0,
      routes: [{ key: "previous" }],
    });
  });

  it("prunes account routes inside retained nested navigators", () => {
    const accountsList = { key: "accounts-list" };
    const state: NavigatorStateLike = {
      type: "stack",
      index: 2,
      routes: [
        {
          key: "main",
          state: {
            type: "tab",
            index: 0,
            routes: [
              {
                key: "portfolio",
                state: {
                  type: "stack",
                  index: 1,
                  routes: [
                    { key: "portfolio-home" },
                    {
                      key: "portfolio-accounts",
                      state: { type: "stack", index: 1, routes: [accountsList, accountRoute("a")] },
                    },
                  ],
                },
              },
            ],
          },
        },
        accountRoute("operation-details"),
        { key: "accounts", state: { type: "stack", index: 0, routes: [accountRoute("a-2")] } },
      ],
    };

    const pruned = pruneAccountRoutes(state, accountId);

    expect(pruned?.index).toBe(0);
    expect(pruned?.routes.map(route => route.key)).toEqual(["main"]);
    const portfolioAccounts = pruned?.routes[0].state?.routes[0].state?.routes[1].state;
    expect(portfolioAccounts).toEqual({ type: "stack", index: 0, routes: [accountsList] });
  });

  it("prunes inside an initialized navigator targeted by nested params and keeps its list", () => {
    const accountsList = { key: "accounts-list" };
    const state: NavigatorStateLike = {
      type: "stack",
      index: 1,
      routes: [
        { key: "portfolio" },
        {
          key: "accounts",
          params: { screen: "Account", params: { accountId: "token", parentId: accountId } },
          state: { type: "stack", index: 1, routes: [accountsList, accountRoute("a")] },
        },
      ],
    };

    const pruned = pruneAccountRoutes(state, accountId);

    expect(pruned?.routes.map(route => route.key)).toEqual(["portfolio", "accounts"]);
    expect(pruned?.index).toBe(1);
    expect(pruned?.routes[1].params).toBeUndefined();
    expect(pruned?.routes[1].state).toEqual({ type: "stack", index: 0, routes: [accountsList] });
  });

  it("removes a not yet initialized navigator targeting the account", () => {
    const state = {
      type: "stack",
      index: 1,
      routes: [
        { key: "portfolio" },
        { key: "accounts", params: { screen: "Account", params: { accountId } } },
      ],
    };

    expect(pruneAccountRoutes(state, accountId)?.routes).toEqual([{ key: "portfolio" }]);
  });

  it("matches token routes through their parent account", () => {
    const state = {
      type: "stack",
      index: 1,
      routes: [
        { key: "previous" },
        { key: "token", params: { accountId: "t", parentId: accountId } },
      ],
    };

    expect(pruneAccountRoutes(state, accountId)?.routes).toEqual([{ key: "previous" }]);
  });

  it("keeps a tab navigator's routes and index", () => {
    const state = {
      type: "tab",
      index: 1,
      routes: [
        { key: "portfolio" },
        {
          key: "discover",
          state: { type: "stack", index: 1, routes: [{ key: "x" }, accountRoute("a")] },
        },
      ],
    };

    const pruned = pruneAccountRoutes(state, accountId);

    expect(pruned?.index).toBe(1);
    expect(pruned?.routes[1].state).toEqual({ type: "stack", index: 0, routes: [{ key: "x" }] });
  });

  it("returns the same state when nothing is about the account", () => {
    const state = { type: "stack", index: 0, routes: [{ key: "previous" }] };

    expect(pruneAccountRoutes(state, accountId)).toBe(state);
  });

  it("returns nothing when every route is about the account", () => {
    const state = { type: "stack", index: 0, routes: [accountRoute("a")] };

    expect(pruneAccountRoutes(state, accountId)).toBeUndefined();
  });
});
