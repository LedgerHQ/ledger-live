import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { keepScreenAwake } from "./keepScreenAwake";

jest.mock("expo-keep-awake", () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));

let tagCounter = 0;
jest.mock("uuid", () => ({
  v4: jest.fn(() => `tag-${++tagCounter}`),
}));

describe("keepScreenAwake", () => {
  beforeEach(() => {
    tagCounter = 0;
    jest.clearAllMocks();
  });

  it("keeps the screen awake under its own tag until released", () => {
    const release = keepScreenAwake();

    expect(activateKeepAwakeAsync).toHaveBeenCalledWith("tag-1");
    expect(deactivateKeepAwake).not.toHaveBeenCalled();

    release();

    expect(deactivateKeepAwake).toHaveBeenCalledWith("tag-1");
  });

  it("gives each caller its own lock", () => {
    const releaseFirst = keepScreenAwake();
    keepScreenAwake();

    releaseFirst();

    expect(deactivateKeepAwake).toHaveBeenCalledTimes(1);
    expect(deactivateKeepAwake).toHaveBeenCalledWith("tag-1");
  });
});
