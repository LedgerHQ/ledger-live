import reducer, {
  INITIAL_STATE,
  closePostOnboardingHubDrawer,
  openPostOnboardingHubDrawer,
  postOnboardingHubDrawerSelector,
} from "../postOnboardingHubDrawer";
import type { State } from "../types";

describe("postOnboardingHubDrawer reducer", () => {
  it("should expose a closed initial state", () => {
    expect(INITIAL_STATE).toEqual({ isOpen: false });
  });

  it("should open the drawer", () => {
    const state = reducer(INITIAL_STATE, openPostOnboardingHubDrawer());
    expect(state.isOpen).toBe(true);
  });

  it("should close the drawer", () => {
    const state = reducer({ isOpen: true }, closePostOnboardingHubDrawer());
    expect(state.isOpen).toBe(false);
  });

  it("should be idempotent when opening twice", () => {
    const opened = reducer(INITIAL_STATE, openPostOnboardingHubDrawer());
    const reopened = reducer(opened, openPostOnboardingHubDrawer());
    expect(reopened.isOpen).toBe(true);
  });
});

describe("postOnboardingHubDrawerSelector", () => {
  it("should return the slice from the state", () => {
    const state: State = {
      ...({} as State),
      postOnboardingHubDrawer: { isOpen: true },
    };
    expect(postOnboardingHubDrawerSelector(state)).toEqual({ isOpen: true });
  });
});
