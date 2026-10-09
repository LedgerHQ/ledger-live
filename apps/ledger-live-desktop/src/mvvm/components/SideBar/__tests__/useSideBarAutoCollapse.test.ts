import { renderHook, act } from "tests/testSetup";
import { useSelector } from "LLD/hooks/redux";
import { INITIAL_STATE, sidebarCollapsedSelector } from "~/renderer/reducers/settings";
import { HIDE_BAR_THRESHOLD } from "~/renderer/screens/dashboard/AssetDistribution/constants";
import { useSideBarAutoCollapse } from "../useSideBarAutoCollapse";

const WIDE_VIEWPORT = HIDE_BAR_THRESHOLD + 1;
const NARROW_VIEWPORT = HIDE_BAR_THRESHOLD;

function useAutoCollapseHarness() {
  const collapsed = useSelector(sidebarCollapsedSelector);
  const setCollapsedByUser = useSideBarAutoCollapse(collapsed);
  return { collapsed, setCollapsedByUser };
}

function renderAutoCollapse(sidebarCollapsed = false) {
  return renderHook(() => useAutoCollapseHarness(), {
    initialState: {
      settings: {
        ...INITIAL_STATE,
        sidebarCollapsed,
      },
    },
  });
}

function resizeTo(width: number) {
  window.innerWidth = width;
  window.dispatchEvent(new Event("resize"));
}

describe("useSideBarAutoCollapse", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    window.innerWidth = WIDE_VIEWPORT;
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
  });

  it("should collapse when the viewport becomes narrow and reopen when it becomes wide", () => {
    const { result } = renderAutoCollapse();

    act(() => resizeTo(NARROW_VIEWPORT));
    expect(result.current.collapsed).toBe(true);

    act(() => resizeTo(WIDE_VIEWPORT));
    expect(result.current.collapsed).toBe(false);
  });

  it("should stay collapsed after a manual collapse when the viewport becomes wide again", () => {
    const { result } = renderAutoCollapse();

    act(() => result.current.setCollapsedByUser(true));

    act(() => resizeTo(NARROW_VIEWPORT));
    expect(result.current.collapsed).toBe(true);

    act(() => resizeTo(WIDE_VIEWPORT));
    expect(result.current.collapsed).toBe(true);
  });

  it("should stay collapsed when a persisted collapse starts on a narrow viewport that then becomes wide", () => {
    window.innerWidth = NARROW_VIEWPORT;
    const { result } = renderAutoCollapse(true);

    expect(result.current.collapsed).toBe(true);

    act(() => resizeTo(WIDE_VIEWPORT));
    expect(result.current.collapsed).toBe(true);
  });
});
