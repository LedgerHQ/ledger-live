import { act, renderHook, waitFor } from "@tests/test-renderer";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import type { State } from "~/reducers/types";
import { useDeviceOnboarding } from "../hooks/useDeviceOnboarding";
import { createTestDevice, knownStax } from "../testing/testDevice";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
    reset: jest.fn(),
    getParent: () => undefined,
    addListener: jest.fn(() => jest.fn()),
  }),
}));

jest.mock("../hooks/useFirmwareUpdateHandover", () => ({
  useFirmwareUpdateHandover: jest.fn(() => ({ close: jest.fn() })),
}));

describe("seeded onboarding completion", () => {
  it("should leave read-only in place when the user quits before a genuine verdict", async () => {
    const device = createTestDevice();
    const { result, store } = renderHook(
      () =>
        useDeviceOnboarding({
          dmk: device.dmk,
          knownDevices: [knownStax],
          offerSync: false,
          navigateOnExit: true,
          wasReadOnlyAtEntry: true,
        }),
      {
        innerWrapper: NotificationsPromptProvider,
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            readOnlyModeEnabled: true,
            hasCompletedOnboarding: false,
            hasBeenRedirectedToPostOnboarding: true,
          },
        }),
      },
    );

    device.show();
    act(() => result.current.connect());
    await waitFor(() => expect(result.current.status).toBe("running"));

    act(() => result.current.send({ type: "QUIT" }));
    await waitFor(() => expect(result.current.exit?.reason).toBe("userQuit"));

    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(true);
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
  });
});
