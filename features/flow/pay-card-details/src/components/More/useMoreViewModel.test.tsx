jest.mock("@features/flow-pay-card-auth/hooks", () => ({
  useIsCardSignedIn: jest.fn(),
  useCardLogout: jest.fn(),
}));
jest.mock("@domain/api-card-management", () => ({ useGetUserQuery: jest.fn() }));

import { mapUserToViewModel } from "./useMoreViewModel";
import { MORE_ROW_TITLES } from "./fixtures";
import type { MoreLabels } from "./useMoreViewModel";

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

const onLogoutPress = jest.fn();
const onMorePress = jest.fn();
const onSheetClose = jest.fn();

const labels: MoreLabels = {
  more: "More",
  sheetTitle: "More",
  rows: MORE_ROW_TITLES,
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
    expect(mapWith({ isSignedIn: false })).toBeNull();
  });

  it("shows nothing while the signed-in user is still on its way", () => {
    expect(mapWith({ user: undefined })).toBeNull();
  });
});
