import { countRoutesBackTo, type RouteLike } from "../countRoutesBackTo";

const isAccountA = (route: RouteLike) =>
  route.name === "AccountDetail" && (route.params as { accountId?: string })?.accountId === "a";

describe("countRoutesBackTo", () => {
  it("counts the routes back to the matching screen right before", () => {
    const state = {
      routes: [
        {
          key: "account",
          state: { index: 0, routes: [{ name: "AccountDetail", params: { accountId: "a" } }] },
        },
        { key: "operation", name: "OperationDetails" },
      ],
    };

    expect(countRoutesBackTo(state, "operation", isAccountA)).toBe(1);
  });

  it("skips the screens in between, like the history list", () => {
    const state = {
      routes: [
        {
          key: "account",
          state: { index: 0, routes: [{ name: "AccountDetail", params: { accountId: "a" } }] },
        },
        { key: "history", name: "OperationsHistory" },
        { key: "operation", name: "OperationDetails" },
      ],
    };

    expect(countRoutesBackTo(state, "operation", isAccountA)).toBe(2);
  });

  it("looks at the focused screen of a previous nested navigator", () => {
    const state = {
      routes: [
        {
          key: "main",
          state: {
            index: 0,
            routes: [
              {
                state: {
                  index: 1,
                  routes: [
                    { name: "Accounts" },
                    { name: "AccountDetail", params: { accountId: "a" } },
                  ],
                },
              },
            ],
          },
        },
        { key: "operation", name: "OperationDetails" },
      ],
    };

    expect(countRoutesBackTo(state, "operation", isAccountA)).toBe(1);
  });

  it("finds the route inside nested navigators", () => {
    const state = {
      routes: [
        {
          key: "main",
          state: {
            routes: [
              { key: "account", name: "AccountDetail", params: { accountId: "a" } },
              { key: "operation", name: "OperationDetails" },
            ],
          },
        },
      ],
    };

    expect(countRoutesBackTo(state, "operation", isAccountA)).toBe(1);
  });

  it("returns nothing when no earlier screen matches", () => {
    const state = {
      routes: [
        { key: "account", name: "AccountDetail", params: { accountId: "b" } },
        { key: "operation", name: "OperationDetails" },
      ],
    };

    expect(countRoutesBackTo(state, "operation", isAccountA)).toBeUndefined();
  });
});
