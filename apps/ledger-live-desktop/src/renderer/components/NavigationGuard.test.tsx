import React from "react";
import { act, render, screen } from "@testing-library/react";
import { Location, Navigator, UNSAFE_NavigationContext } from "react-router";
import NavigationGuard from "./NavigationGuard";

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock("LLD/hooks/redux", () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useLocation: () => ({ pathname: "/test", search: "", state: null }),
  useNavigate: () => mockNavigate,
}));

jest.mock("~/renderer/modals/ConfirmModal", () => ({
  __esModule: true,
  default: ({ isOpened }: { isOpened: boolean }) =>
    isOpened ? <div data-testid="confirm-modal" /> : null,
}));

describe("NavigationGuard", () => {
  afterEach(() => {
    mockDispatch.mockClear();
    mockNavigate.mockClear();
  });

  it("does not render the modal when guard is disabled", () => {
    render(<NavigationGuard when={false} />);

    act(() => {
      window.location.hash = "#/next";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });

  it("renders the modal when guard is enabled and navigation is attempted", () => {
    render(<NavigationGuard when />);

    act(() => {
      window.location.hash = "#/next";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });

  it("does not render the modal when navigation is allowed by shouldBlockNavigation", () => {
    render(<NavigationGuard when shouldBlockNavigation={() => false} />);

    act(() => {
      window.location.hash = "#/next";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });

  it("does not render the modal when noModal is enabled", () => {
    render(<NavigationGuard when noModal />);

    act(() => {
      window.location.hash = "#/next";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(screen.queryByTestId("confirm-modal")).toBeNull();
  });

  it("blocks navigation when history blocker is triggered", () => {
    const unblockMock = jest.fn();
    const blockMock = jest.fn();
    let capturedBlocker: ((tx: { location: Location; retry: () => void }) => void) | undefined;

    blockMock.mockImplementation(blocker => {
      capturedBlocker = blocker;
      return unblockMock;
    });

    const navigatorBase: Navigator = {
      createHref: () => "",
      go: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
    };
    const navigatorWithBlock = Object.assign(navigatorBase, { block: blockMock });

    const navigationContextValue = {
      basename: "",
      navigator: navigatorWithBlock,
      static: false,
      unstable_useTransitions: false,
      future: {},
    };

    render(
      <UNSAFE_NavigationContext.Provider value={navigationContextValue}>
        <NavigationGuard when />
      </UNSAFE_NavigationContext.Provider>,
    );

    const retryMock = jest.fn();
    act(() => {
      capturedBlocker?.({
        location: {
          pathname: "/next",
          search: "",
          hash: "",
          state: null,
          key: "next",
        },
        retry: retryMock,
      });
    });

    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
  });
});
