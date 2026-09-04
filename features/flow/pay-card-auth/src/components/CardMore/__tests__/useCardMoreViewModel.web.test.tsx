import { mapUserToViewModel, runLogout, startLogout } from "../useCardMoreViewModel";
import type { CardMoreLabels } from "../useCardMoreViewModel";
import type { CardLogoutPorts } from "../../../state/types";

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

const onLogoutPress = jest.fn();
const onMorePress = jest.fn();
const onSheetClose = jest.fn();

const labels: CardMoreLabels = {
  more: "More",
  sheetTitle: "More",
  rows: {
    managePin: "Manage PIN Code",
    accessBaanx: "Access to Baanx",
    help: "Help",
    logout: "Logout",
  },
};

function mapWith(overrides: Partial<Parameters<typeof mapUserToViewModel>[0]> = {}) {
  return mapUserToViewModel({
    isSignedIn: true,
    user,
    labels,
    isSheetOpen: false,
    onMorePress,
    onSheetClose,
    handlers: { logout: onLogoutPress },
    ...overrides,
  });
}

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

describe("mapUserToViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the More tile and the sheet it opens", () => {
    expect(mapWith()).toMatchObject({
      moreLabel: "More",
      sheetTitle: "More",
      isSheetOpen: false,
      onMorePress,
      onSheetClose,
    });
  });

  it("returns the four rows in the design order with their ids and titles", () => {
    const rows = mapWith()?.rows ?? [];

    expect(rows.map(row => row.id)).toEqual(["managePin", "accessBaanx", "help", "logout"]);
    expect(rows.map(row => row.title)).toEqual([
      "Manage PIN Code",
      "Access to Baanx",
      "Help",
      "Logout",
    ]);
  });

  it("gives a real handler only to the logout row", () => {
    const rows = mapWith()?.rows ?? [];

    for (const row of rows) {
      row.onPress();
    }

    expect(rows.find(row => row.id === "logout")?.onPress).toBe(onLogoutPress);
    expect(onLogoutPress).toHaveBeenCalledTimes(1);
  });

  it("shows nothing while nobody is signed in", () => {
    // `CardLogin` holds the screen then, and it reads the same flag to know it.
    expect(mapWith({ isSignedIn: false })).toBeNull();
  });

  it("shows nothing while the signed-in user is still on its way", () => {
    // An empty cache would otherwise show a tile that opens a sheet with no session behind it.
    expect(mapWith({ user: undefined })).toBeNull();
  });
});
