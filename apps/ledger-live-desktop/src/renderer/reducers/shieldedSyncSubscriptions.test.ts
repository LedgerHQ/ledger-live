import { Subscription } from "rxjs";
import reducer, {
  removeShieldedSubscription,
  selectShieldedSubscriptions,
  upsertShieldedSubscription,
  type ShieldedSyncSubscriptionsState,
} from "./shieldedSyncSubscriptions";

describe("shieldedSyncSubscriptions reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual([]);
  });

  it("should add a subscription when accountId does not exist", () => {
    const firstSubscription = new Subscription();

    const state = reducer(
      [],
      upsertShieldedSubscription({
        accountId: "js:2:zcash:addr-1",
        subscription: firstSubscription,
      }),
    );

    expect(state).toEqual([{ accountId: "js:2:zcash:addr-1", subscription: firstSubscription }]);
  });

  it("should replace existing subscription when accountId already exists", () => {
    const previousSubscription = new Subscription();
    const nextSubscription = new Subscription();
    const initialState: ShieldedSyncSubscriptionsState = [
      { accountId: "js:2:zcash:addr-1", subscription: previousSubscription },
      { accountId: "js:2:zcash:addr-2", subscription: new Subscription() },
    ];

    const state = reducer(
      initialState,
      upsertShieldedSubscription({
        accountId: "js:2:zcash:addr-1",
        subscription: nextSubscription,
      }),
    );

    expect(state).toHaveLength(2);
    expect(state[0]).toEqual({ accountId: "js:2:zcash:addr-1", subscription: nextSubscription });
    expect(state[1]).toEqual(initialState[1]);
  });

  it("should remove a subscription by accountId", () => {
    const remainingSubscription = new Subscription();
    const initialState: ShieldedSyncSubscriptionsState = [
      { accountId: "js:2:zcash:addr-1", subscription: new Subscription() },
      { accountId: "js:2:zcash:addr-2", subscription: remainingSubscription },
    ];

    const state = reducer(initialState, removeShieldedSubscription("js:2:zcash:addr-1"));

    expect(state).toEqual([
      { accountId: "js:2:zcash:addr-2", subscription: remainingSubscription },
    ]);
  });

  it("should keep state unchanged when removing an unknown accountId", () => {
    const existingSubscription = new Subscription();
    const initialState: ShieldedSyncSubscriptionsState = [
      { accountId: "js:2:zcash:addr-1", subscription: existingSubscription },
    ];

    const state = reducer(initialState, removeShieldedSubscription("js:2:zcash:missing"));

    expect(state).toEqual(initialState);
  });
});

describe("selectShieldedSubscriptions", () => {
  it("should return shielded subscriptions slice", () => {
    const subscriptions: ShieldedSyncSubscriptionsState = [
      { accountId: "js:2:zcash:addr-1", subscription: new Subscription() },
    ];

    expect(
      selectShieldedSubscriptions({
        shieldedSyncSubscriptions: subscriptions,
      }),
    ).toBe(subscriptions);
  });
});
