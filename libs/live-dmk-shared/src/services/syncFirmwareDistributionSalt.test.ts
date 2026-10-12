import { identitiesSlice, initialIdentitiesState } from "@domain/entity-client-identity";
import { UserHashService } from "./UserHashService";
import { syncFirmwareDistributionSalt } from "./syncFirmwareDistributionSalt";

function createIdentitiesStore() {
  let state = { identities: initialIdentitiesState };
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch: (action: Parameters<typeof identitiesSlice.reducer>[1]) => {
      state = { identities: identitiesSlice.reducer(state.identities, action) };
      listeners.forEach(listener => listener());
    },
  };
}

const importUser = (userId: string) => identitiesSlice.actions.importFromLegacy({ userId });

describe("syncFirmwareDistributionSalt", () => {
  it("does not set a salt while the user ID is the dummy one", () => {
    const store = createIdentitiesStore();
    const setSalt = jest.fn();

    syncFirmwareDistributionSalt(store, setSalt);

    expect(setSalt).not.toHaveBeenCalled();
  });

  it("sets the user's salt once identities are initialized", () => {
    const store = createIdentitiesStore();
    const setSalt = jest.fn();
    syncFirmwareDistributionSalt(store, setSalt);

    store.dispatch(importUser("user-1"));

    expect(setSalt).toHaveBeenCalledTimes(1);
    expect(setSalt).toHaveBeenCalledWith(UserHashService.compute("user-1").firmwareSalt);
  });

  it("sets the salt right away when identities are already initialized", () => {
    const store = createIdentitiesStore();
    store.dispatch(importUser("user-1"));
    const setSalt = jest.fn();

    syncFirmwareDistributionSalt(store, setSalt);

    expect(setSalt).toHaveBeenCalledTimes(1);
    expect(setSalt).toHaveBeenCalledWith(UserHashService.compute("user-1").firmwareSalt);
  });

  it("does not set it again when the user ID does not change", () => {
    const store = createIdentitiesStore();
    const setSalt = jest.fn();
    syncFirmwareDistributionSalt(store, setSalt);
    store.dispatch(importUser("user-1"));

    store.dispatch({ type: "UNRELATED_ACTION" });

    expect(setSalt).toHaveBeenCalledTimes(1);
  });

  it("sets the new salt when the user ID changes", () => {
    const store = createIdentitiesStore();
    const setSalt = jest.fn();
    syncFirmwareDistributionSalt(store, setSalt);
    store.dispatch(importUser("user-1"));

    store.dispatch(importUser("user-2"));

    expect(setSalt).toHaveBeenCalledTimes(2);
    expect(setSalt).toHaveBeenLastCalledWith(UserHashService.compute("user-2").firmwareSalt);
  });

  it("stops syncing once unsubscribed", () => {
    const store = createIdentitiesStore();
    const setSalt = jest.fn();
    const unsubscribe = syncFirmwareDistributionSalt(store, setSalt);

    unsubscribe();
    store.dispatch(importUser("user-1"));

    expect(setSalt).not.toHaveBeenCalled();
  });
});
