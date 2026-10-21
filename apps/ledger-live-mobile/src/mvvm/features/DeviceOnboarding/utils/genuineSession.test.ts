import { isCurrentSessionGenuine } from "./genuineSession";

const session = "session-1";

describe("isCurrentSessionGenuine", () => {
  it("should accept a genuine verdict from the current session", () => {
    expect(
      isCurrentSessionGenuine({
        sessionId: session,
        genuineVerdict: { sessionId: session, isGenuine: true },
      }),
    ).toBe(true);
  });

  it("should ignore a genuine verdict from the previous session", () => {
    expect(
      isCurrentSessionGenuine({
        sessionId: "session-2",
        genuineVerdict: { sessionId: session, isGenuine: true },
      }),
    ).toBe(false);
  });

  it("should stay false when the current session is not genuine", () => {
    expect(isCurrentSessionGenuine(null)).toBe(false);
    expect(
      isCurrentSessionGenuine({
        sessionId: session,
        genuineVerdict: { sessionId: session, isGenuine: false },
      }),
    ).toBe(false);
    expect(isCurrentSessionGenuine({ sessionId: session, genuineVerdict: null })).toBe(false);
  });
});
