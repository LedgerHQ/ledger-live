import { mapUserToViewModel, runLogout } from "../useCardLogoutViewModel";
import type { CardLogoutPorts } from "../../../state/types";

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

const onLogoutPress = jest.fn();

type Ports = { [K in keyof CardLogoutPorts]: jest.Mock };

function stubPorts(overrides: Partial<Ports> = {}): Ports {
  return {
    logout: jest.fn(async () => undefined),
    clearSession: jest.fn(async () => undefined),
    clearAttempt: jest.fn(async () => undefined),
    forgetUser: jest.fn(),
    setSignedIn: jest.fn(),
    ...overrides,
  };
}

describe("runLogout", () => {
  it("tells the provider before it clears the session", async () => {
    const order: string[] = [];
    const ports = stubPorts({
      logout: jest.fn(async () => {
        order.push("logout");
      }),
      clearSession: jest.fn(async () => {
        order.push("clearSession");
      }),
    });

    await runLogout(ports as unknown as CardLogoutPorts);

    // The provider call carries the Bearer, so it cannot run after the session is gone.
    expect(order).toEqual(["logout", "clearSession"]);
    expect(ports.clearAttempt).toHaveBeenCalled();
    expect(ports.forgetUser).toHaveBeenCalledTimes(1);
    expect(ports.setSignedIn).toHaveBeenCalledWith(false);
  });

  it("logs the user out on this device even when the provider cannot be reached", async () => {
    const ports = stubPorts({ logout: jest.fn(async () => Promise.reject(new Error("offline"))) });

    await expect(runLogout(ports as unknown as CardLogoutPorts)).resolves.toBeUndefined();

    expect(ports.clearSession).toHaveBeenCalledTimes(1);
    expect(ports.forgetUser).toHaveBeenCalledTimes(1);
    expect(ports.setSignedIn).toHaveBeenCalledWith(false);
  });

  it("finishes the local cleanup even when the session store refuses to forget", async () => {
    const ports = stubPorts({
      clearSession: jest.fn(async () => Promise.reject(new Error("keychain locked"))),
    });

    await expect(runLogout(ports as unknown as CardLogoutPorts)).resolves.toBeUndefined();

    // A user left in the Card cache would keep every other screen showing whoever just logged out.
    expect(ports.clearAttempt).toHaveBeenCalled();
    expect(ports.forgetUser).toHaveBeenCalledTimes(1);
    // The flag is the one thing that ends the session for this process, so it must land either way.
    expect(ports.setSignedIn).toHaveBeenCalledWith(false);
  });

  it("never rejects, so the button has nothing to handle", async () => {
    const ports = stubPorts({
      logout: jest.fn(async () => Promise.reject(new Error("offline"))),
      clearSession: jest.fn(async () => Promise.reject(new Error("keychain locked"))),
      clearAttempt: jest.fn(async () => Promise.reject(new Error("keychain locked"))),
    });

    await expect(runLogout(ports as unknown as CardLogoutPorts)).resolves.toBeUndefined();
  });
});

describe("mapUserToViewModel", () => {
  it("shows the card holder and the logout action", () => {
    expect(mapUserToViewModel(true, user, false, onLogoutPress)).toMatchObject({
      userId: user.id,
      verificationValue: "Verified",
      logoutLabel: "Log out",
      isLoading: false,
    });
  });

  it("keeps the logout action busy while the logout runs", () => {
    expect(mapUserToViewModel(true, user, true, onLogoutPress)?.isLoading).toBe(true);
  });

  it("shows nothing while nobody is signed in", () => {
    // `CardLogin` holds the screen then, and it reads the same flag to know it.
    expect(mapUserToViewModel(false, user, false, onLogoutPress)).toBeNull();
  });

  it("shows nothing while the signed-in user is still on its way", () => {
    // An empty cache would otherwise show an account with no id.
    expect(mapUserToViewModel(true, undefined, false, onLogoutPress)).toBeNull();
  });

  it.each([
    ["UNVERIFIED", "Not verified"],
    ["PENDING", "In review"],
    ["VERIFIED", "Verified"],
    ["REJECTED", "Rejected"],
  ] as const)("reads %s as %s", (verificationState, expected) => {
    const logout = mapUserToViewModel(true, { ...user, verificationState }, false, onLogoutPress);

    expect(logout?.verificationValue).toBe(expected);
  });
});
