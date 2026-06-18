import reducer, {
  closeBackupHubFeatureIntro,
  openBackupHubFeatureIntro,
  tickBackupHubFeatureIntroDeeplink,
} from "../backupHubFeatureIntro";

const INITIAL_STATE = {
  isOpen: false,
  deeplinkNonce: 0,
};

describe("backupHubFeatureIntro reducer", () => {
  it("should open the feature intro drawer", () => {
    const nextState = reducer(INITIAL_STATE, openBackupHubFeatureIntro());

    expect(nextState.isOpen).toBe(true);
    expect(nextState.deeplinkNonce).toBe(0);
  });

  it("should close the feature intro drawer", () => {
    const openState = reducer(INITIAL_STATE, openBackupHubFeatureIntro());
    const nextState = reducer(openState, closeBackupHubFeatureIntro());

    expect(nextState.isOpen).toBe(false);
  });

  it("should increment deeplink nonce when deeplink is ticked", () => {
    const nextState = reducer(INITIAL_STATE, tickBackupHubFeatureIntroDeeplink());

    expect(nextState.isOpen).toBe(false);
    expect(nextState.deeplinkNonce).toBe(1);
  });
});
