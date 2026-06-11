import { renderHook } from "@testing-library/react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useKeepScreenAwake } from "./useKeepScreenAwake";

jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));

let tagCounter = 0;
jest.mock("uuid", () => ({
  v4: jest.fn(() => `tag-${++tagCounter}`),
}));

const mockedActivate = jest.mocked(activateKeepAwakeAsync);
const mockedDeactivate = jest.mocked(deactivateKeepAwake);

describe("useKeepScreenAwake", () => {
  beforeEach(() => {
    tagCounter = 0;
    jest.clearAllMocks();
  });

  it("GIVEN enabled is true WHEN mounting THEN it activates keep awake with a tag", () => {
    // WHEN
    renderHook(() => useKeepScreenAwake(true));

    // THEN
    expect(mockedActivate).toHaveBeenCalledTimes(1);
    expect(mockedActivate).toHaveBeenCalledWith("tag-1");
    expect(mockedDeactivate).not.toHaveBeenCalled();
  });

  it("GIVEN enabled is false WHEN mounting THEN it does not activate keep awake", () => {
    // WHEN
    renderHook(() => useKeepScreenAwake(false));

    // THEN
    expect(mockedActivate).not.toHaveBeenCalled();
    expect(mockedDeactivate).not.toHaveBeenCalled();
  });

  it("GIVEN an active keep awake WHEN unmounting THEN it deactivates the same tag", () => {
    // GIVEN
    const { unmount } = renderHook(() => useKeepScreenAwake(true));

    // WHEN
    unmount();

    // THEN
    expect(mockedDeactivate).toHaveBeenCalledTimes(1);
    expect(mockedDeactivate).toHaveBeenCalledWith("tag-1");
  });

  it("GIVEN an active keep awake WHEN enabled flips to false THEN it deactivates the same tag", () => {
    // GIVEN
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useKeepScreenAwake(enabled),
      { initialProps: { enabled: true } },
    );

    // WHEN
    rerender({ enabled: false });

    // THEN
    expect(mockedActivate).toHaveBeenCalledTimes(1);
    expect(mockedDeactivate).toHaveBeenCalledTimes(1);
    expect(mockedDeactivate).toHaveBeenCalledWith("tag-1");
  });

  it("GIVEN keep awake was disabled WHEN enabled flips to true THEN it activates with a fresh tag", () => {
    // GIVEN
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useKeepScreenAwake(enabled),
      { initialProps: { enabled: true } },
    );
    rerender({ enabled: false });

    // WHEN
    rerender({ enabled: true });

    // THEN
    expect(mockedActivate).toHaveBeenCalledTimes(2);
    expect(mockedActivate).toHaveBeenLastCalledWith("tag-2");
  });
});
