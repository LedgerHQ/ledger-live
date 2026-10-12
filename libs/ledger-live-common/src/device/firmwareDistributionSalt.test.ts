import { identitiesSlice, initialIdentitiesState } from "@domain/entity-client-identity";
import { getFirmwareDistributionSaltUserId, setIdentitiesStore } from "./firmwareDistributionSalt";

function createIdentitiesStore() {
  let state = { identities: initialIdentitiesState };
  return {
    getState: () => state,
    importUser: (userId: string) => {
      state = {
        identities: identitiesSlice.reducer(
          state.identities,
          identitiesSlice.actions.importFromLegacy({ userId }),
        ),
      };
    },
  };
}

describe("getFirmwareDistributionSaltUserId", () => {
  it("is empty when no store is set", () => {
    jest.isolateModules(() => {
      const { getFirmwareDistributionSaltUserId: getUserId } = jest.requireActual<
        typeof import("./firmwareDistributionSalt")
      >("./firmwareDistributionSalt");

      expect(getUserId()).toBe("");
    });
  });

  it("is empty while the user ID is the dummy one", () => {
    setIdentitiesStore(createIdentitiesStore());

    expect(getFirmwareDistributionSaltUserId()).toBe("");
  });

  it("reads the user ID of the store at call time", () => {
    const store = createIdentitiesStore();
    setIdentitiesStore(store);

    store.importUser("user-1");

    expect(getFirmwareDistributionSaltUserId()).toBe("user-1");
  });
});
