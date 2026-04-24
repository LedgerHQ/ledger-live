import { renderHook } from "tests/testSetup";
import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";
import { useUserAvatarViewModel } from "../useUserAvatarViewModel";
import type { UserAvatarProps, UserAvatarViewProps } from "../types";

jest.mock("LLD/components/TopBar/hooks/useNotificationIndicator");

const mockedUseNotificationIndicator = jest.mocked(useNotificationIndicator);

const mockNotificationIndicator = (totalNotifCount: number) =>
  mockedUseNotificationIndicator.mockReturnValue({
    totalNotifCount,
    tooltip: "",
    onClick: jest.fn(),
    icon: Object.assign(jest.fn(), { displayName: "MockIcon" }),
    isInteractive: true,
  });

type TestCase = {
  name: string;
  notifCount: number;
  props?: UserAvatarProps;
  expected: UserAvatarViewProps;
};

const cases: TestCase[] = [
  {
    name: "hides when there are no unseen notifications",
    notifCount: 0,
    expected: { showNotification: false, unseenCount: 0 },
  },
  {
    name: "auto-shows when there are unseen notifications",
    notifCount: 2,
    expected: { showNotification: true, unseenCount: 2 },
  },
  {
    name: "is force-hidden when showNotification=false",
    notifCount: 4,
    props: { showNotification: false },
    expected: { showNotification: false, unseenCount: 0 },
  },
];

describe("useUserAvatarViewModel", () => {
  it.each(cases)("$name", ({ notifCount, props = {}, expected }) => {
    mockNotificationIndicator(notifCount);

    const { result } = renderHook(() => useUserAvatarViewModel(props));

    expect(result.current).toEqual(expected);
  });
});
