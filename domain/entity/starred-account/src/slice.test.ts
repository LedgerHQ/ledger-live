import { configureStore } from "@reduxjs/toolkit";
import { initStarredFromIds, setAccountStarred, starredAccountsSlice } from "./slice";
import { isStarredAccountSelector } from "./selectors";

function makeStore() {
  const store = configureStore({
    reducer: { starred: starredAccountsSlice.reducer },
    // mirrors the apps: this slice holds a Set, which RTK's serializable check rejects
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
  });
  return {
    dispatch: store.dispatch,
    starred: () => store.getState().starred,
    isStarred: (accountId: string) =>
      isStarredAccountSelector(store.getState().starred, { accountId }),
  };
}

describe("starredAccountsSlice", () => {
  it("starts empty", () => {
    expect(makeStore().starred().size).toBe(0);
  });

  it.each([
    ["stars an account", true, true],
    ["unstars an unknown account without throwing", false, false],
  ])("setAccountStarred %s", (_name, starred, expected) => {
    const store = makeStore();
    store.dispatch(setAccountStarred({ accountId: "a1", starred }));
    expect(store.isStarred("a1")).toBe(expected);
  });

  it("setAccountStarred toggles back to unstarred", () => {
    const store = makeStore();
    store.dispatch(setAccountStarred({ accountId: "a1", starred: true }));
    store.dispatch(setAccountStarred({ accountId: "a1", starred: false }));
    expect(store.isStarred("a1")).toBe(false);
  });

  it("setAccountStarred is idempotent", () => {
    const store = makeStore();
    store.dispatch(setAccountStarred({ accountId: "a1", starred: true }));
    store.dispatch(setAccountStarred({ accountId: "a1", starred: true }));
    expect(store.starred().size).toBe(1);
  });

  it("setAccountStarred leaves other accounts untouched", () => {
    const store = makeStore();
    store.dispatch(initStarredFromIds(["a1", "a2"]));
    store.dispatch(setAccountStarred({ accountId: "a1", starred: false }));
    expect([...store.starred()]).toEqual(["a2"]);
  });

  it("setAccountStarred returns a new Set rather than mutating the frozen state", () => {
    const store = makeStore();
    const before = store.starred();
    store.dispatch(setAccountStarred({ accountId: "a1", starred: true }));
    expect(store.starred()).not.toBe(before);
    expect(before.size).toBe(0);
  });

  it("initStarredFromIds replaces the whole set and dedupes", () => {
    const store = makeStore();
    store.dispatch(setAccountStarred({ accountId: "old", starred: true }));
    store.dispatch(initStarredFromIds(["a1", "a1", "a2"]));
    expect([...store.starred()]).toEqual(["a1", "a2"]);
    expect(store.isStarred("old")).toBe(false);
  });

  it("initStarredFromIds with an empty list clears everything", () => {
    const store = makeStore();
    store.dispatch(initStarredFromIds(["a1"]));
    store.dispatch(initStarredFromIds([]));
    expect(store.starred().size).toBe(0);
  });
});
