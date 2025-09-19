/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

// Mock theme (unused but kept for potential future use)
const _mockTheme = {
  colors: {
    neutral: { c100: "#ffffff", c30: "#cccccc" },
    primary: { c80: "#0066ff" },
  },
};

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

// Mock the viewModel hooks
const mockWelcomeNewViewModelReturn = {
  t: jest.fn((key: string) => key),
  accessSettings: jest.fn(),
  openTermsAndConditions: jest.fn(),
  openPrivacyPolicy: jest.fn(),
  isFeatureFlagsSettingsButtonDisplayed: false,
  handleOpenFeatureFlagsDrawer: jest.fn(),
  skipOnboarding: jest.fn(),
  handleGetStarted: jest.fn(),
  handleBuyNew: jest.fn(),
  handleSetupLedgerSync: jest.fn(),
  isFeatureFlagsAnalyticsPrefDisplayed: false,
  extendedAnalyticsOptInPromptProps: {},
  closeDrawer: jest.fn(),
};

const mockUseVideoCarouselViewModel = {
  currentSlide: 0,
  isVisible: true,
  videoDurations: [5, 6, 7],
  VIDEO_SLIDES: [
    { video: "mock-video-1.webm", title: "Video 1", id: "video-1" },
    { video: "mock-video-2.webm", title: "Video 2", id: "video-2" },
    { video: "mock-video-3.webm", title: "Video 3", id: "video-3" },
  ],
  videoRefs: { current: [null, null, null] },
  containerRef: { current: null },
  handleVideoLoadedMetadata: jest.fn(),
  handleVideoEnded: jest.fn(),
};

jest.mock("../useWelcomeNewViewModel");

jest.mock("../useVideoCarouselViewModel", () => ({
  useVideoCarouselViewModel: () => mockUseVideoCarouselViewModel,
}));

// Types for mock components
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  "data-testid"?: string;
  [key: string]: unknown;
}

interface FlexProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

interface BoxProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

interface LogoProps {
  color?: string;
}

// Mock all UI components to avoid styled-components issues
jest.mock("@ledgerhq/react-ui", () => ({
  Button: ({ children, onClick, "data-testid": testId, ...props }: ButtonProps) => (
    <button onClick={onClick} data-testid={testId} {...props}>
      {children}
    </button>
  ),
  Flex: ({ children, ...props }: FlexProps) => <div {...props}>{children}</div>,
  Box: ({ children, ...props }: BoxProps) => <div {...props}>{children}</div>,
  Logos: {
    LedgerLiveRegular: ({ color: _color }: LogoProps) => <div data-testid="ledger-logo">Logo</div>,
  },
}));

// Mock styled-components
jest.mock("styled-components", () => ({
  useTheme: () => ({ colors: { neutral: { c100: "#ffffff" } } }),
}));

// Types for other mock components
interface AnalyticsPromptProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

interface LedgerSyncProps {
  onPress?: () => void;
  [key: string]: unknown;
}

interface WalletSyncDrawerProps {
  onClose?: () => void;
  [key: string]: unknown;
}

// Mock other components
const AnalyticsPromptMock = ({ children, ..._props }: AnalyticsPromptProps) => (
  <div data-testid="analytics-prompt">{children}</div>
);
AnalyticsPromptMock.displayName = "AnalyticsPromptMock";

const LedgerSyncMock = ({ onPress, ..._props }: LedgerSyncProps) => (
  <button onClick={onPress} data-testid="ledger-sync">
    Ledger Sync
  </button>
);
LedgerSyncMock.displayName = "LedgerSyncMock";

const WalletSyncDrawerMock = ({ onClose: _onClose, ..._props }: WalletSyncDrawerProps) => (
  <div data-testid="wallet-sync-drawer">Drawer</div>
);
WalletSyncDrawerMock.displayName = "WalletSyncDrawerMock";

jest.mock("LLD/features/AnalyticsOptInPrompt/screens", () => AnalyticsPromptMock);
jest.mock("LLD/features/LedgerSyncEntryPoints", () => LedgerSyncMock);
jest.mock("LLD/features/WalletSync/components/Drawer", () => WalletSyncDrawerMock);

// Import after mocks
import { WelcomeNew } from "../index";
import { useWelcomeNewViewModel } from "../useWelcomeNewViewModel";

// Cast to jest mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseWelcomeNewViewModel = useWelcomeNewViewModel as jest.MockedFunction<
  typeof useWelcomeNewViewModel
>;

describe("WelcomeNew", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseWelcomeNewViewModel.mockReturnValue(mockWelcomeNewViewModelReturn as any);
  });

  it("should render the welcome new component", () => {
    render(<WelcomeNew />, { wrapper: TestWrapper });

    expect(screen.getByText("onboarding.screens.welcome.nextButton")).toBeInTheDocument();
    expect(screen.getByText("onboarding.screens.welcome.buyLink")).toBeInTheDocument();
  });

  it("should handle get started button click", () => {
    render(<WelcomeNew />, { wrapper: TestWrapper });

    const getStartedButton = screen.getByTestId("v3-onboarding-get-started-button");
    fireEvent.click(getStartedButton);

    expect(mockWelcomeNewViewModelReturn.handleGetStarted).toHaveBeenCalled();
  });

  it("should handle buy new button click", () => {
    render(<WelcomeNew />, { wrapper: TestWrapper });

    const buyButton = screen.getByText("onboarding.screens.welcome.buyLink");
    fireEvent.click(buyButton);

    expect(mockWelcomeNewViewModelReturn.handleBuyNew).toHaveBeenCalled();
  });

  it("should display feature flags settings button when enabled", () => {
    const mockViewModel = {
      ...mockWelcomeNewViewModelReturn,
      isFeatureFlagsSettingsButtonDisplayed: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseWelcomeNewViewModel.mockReturnValue(mockViewModel as any);

    render(<WelcomeNew />, { wrapper: TestWrapper });

    expect(screen.getByText("settings.title")).toBeInTheDocument();
  });

  it("should display dev skip button in development mode", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalWithDev = global as typeof globalThis & { __DEV__?: boolean };
    const originalDev = globalWithDev.__DEV__;
    globalWithDev.__DEV__ = true;

    render(<WelcomeNew />, { wrapper: TestWrapper });

    expect(screen.getByText("(DEV) skip onboarding")).toBeInTheDocument();

    globalWithDev.__DEV__ = originalDev;
  });

  it("should render video slides", () => {
    render(<WelcomeNew />, { wrapper: TestWrapper });

    // Check that videos are rendered
    const videos = screen.getAllByRole("presentation", { hidden: true });
    expect(videos).toHaveLength(3);
  });

  it("should display current video title when visible", () => {
    render(<WelcomeNew />, { wrapper: TestWrapper });

    expect(screen.getByText("Video 1")).toBeInTheDocument();
  });

  it("should render progress bars for each video", () => {
    const { container } = render(<WelcomeNew />, { wrapper: TestWrapper });

    // Progress bars are rendered as styled divs
    const progressBars = container.querySelectorAll('[id*="progress-bar"]');
    expect(progressBars).toHaveLength(3);
  });
});
