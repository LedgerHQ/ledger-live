import type { ContentCard } from "@braze/react-native-sdk";
import Braze from "@braze/react-native-sdk";
import { renderHook } from "@tests/test-renderer";
import { track } from "~/analytics";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { ContentCardLocation, type WalletContentCard } from "~/dynamicContent/types";
import { useBrazeContentCard } from "./brazeContentCard";

jest.mock("@braze/react-native-sdk", () => ({
  __esModule: true,
  default: {
    logContentCardImpression: jest.fn(),
    logContentCardClicked: jest.fn(),
    logContentCardDismissed: jest.fn(),
    requestContentCardsRefresh: jest.fn(),
  },
}));

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

const mockedTrack = jest.mocked(track);
const mockedLogContentCardImpression = jest.mocked(Braze.logContentCardImpression);

const brazeWalletCard = (id: string): ContentCard =>
  ({
    id,
    created: 1_690_112_400,
    viewed: false,
    extras: { location: ContentCardLocation.Wallet, title: "Promo", order: "1" },
  }) as unknown as ContentCard;

const localWalletCard = (id: string): WalletContentCard => ({
  id,
  location: ContentCardLocation.Wallet,
  createdAt: 1_690_112_400,
  viewed: false,
  title: "Local promo",
  extras: { source: "local-debug" },
});

describe("useBrazeContentCard logImpressionCard - wallet placement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs an impression for a real (Braze-fetched) wallet card", () => {
    const { result } = renderHook(() => useBrazeContentCard([brazeWalletCard("wallet-card-1")]), {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, analyticsEnabled: true },
      }),
    });

    result.current.logImpressionCard("wallet-card-1", 0);

    expect(mockedLogContentCardImpression).toHaveBeenCalledWith("wallet-card-1");
    expect(mockedTrack).toHaveBeenCalledWith(
      ContentCardEvent.Impression,
      expect.objectContaining({ location: ContentCardLocation.Wallet, displayedPosition: 0 }),
    );
  });
  it("logs a Segment impression (but skips the Braze SDK call) for a local wallet card", () => {
    const { result } = renderHook(() => useBrazeContentCard([]), {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, analyticsEnabled: true },
        dynamicContent: {
          ...state.dynamicContent,
          localWalletCards: [localWalletCard("local-wallet-card-1")],
        },
      }),
    });

    result.current.logImpressionCard("local-wallet-card-1", 0);

    expect(mockedLogContentCardImpression).not.toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith(
      ContentCardEvent.Impression,
      expect.objectContaining({ displayedPosition: 0 }),
    );
  });
});
