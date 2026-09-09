import { runLogout, startLogout } from "./cardLogout";
import type { CardLogoutPorts } from "./types";

type Ports = { [K in keyof CardLogoutPorts]: jest.Mock };

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

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

describe("startLogout", () => {
  it("tells the provider once, whatever the number of presses in one turn", async () => {
    const ports = stubPorts();

    startLogout(ports as unknown as CardLogoutPorts);
    startLogout(ports as unknown as CardLogoutPorts);
    await settle();

    expect(ports.logout).toHaveBeenCalledTimes(1);
  });

  it("is ready again once the logout settles", async () => {
    const ports = stubPorts();

    startLogout(ports as unknown as CardLogoutPorts);
    await settle();
    startLogout(ports as unknown as CardLogoutPorts);
    await settle();

    expect(ports.logout).toHaveBeenCalledTimes(2);
  });
});
