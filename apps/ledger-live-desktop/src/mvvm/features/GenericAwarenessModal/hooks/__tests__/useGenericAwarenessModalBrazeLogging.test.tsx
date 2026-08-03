import React from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import type { Card as BrazeCard } from "@braze/web-sdk";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { useGenericAwarenessModalBrazeLogging } from "../useGenericAwarenessModalBrazeLogging";

const mockLogContentCardImpressions = jest.fn();
const mockLogContentCardClick = jest.fn();
const mockLogCardDismissal = jest.fn();

jest.mock("@braze/web-sdk", () => ({
  logContentCardImpressions: (...args: unknown[]) => mockLogContentCardImpressions(...args),
  logContentCardClick: (...args: unknown[]) => mockLogContentCardClick(...args),
  logCardDismissal: (...args: unknown[]) => mockLogCardDismissal(...args),
}));

const CARD_ID = "awareness-modal-card";

const brazeCard = { id: CARD_ID, title: "Awareness modal" } as unknown as BrazeCard;

const createTestState = (overrides: Partial<State> = {}): State =>
  ({
    dynamicContent: {
      desktopCards: [brazeCard],
      portfolioCards: [],
      bottomPortfolioCards: [],
      actionCards: [],
      notificationsCards: [],
    },
    settings: {
      shareAnalytics: true,
      sharePersonalizedRecommandations: false,
    },
    ...overrides,
  }) as State;

type HookProps = {
  contentCardId: string | undefined;
  isOpen: boolean;
  stateOverrides?: Partial<State>;
};

const renderBrazeLoggingHook = ({ contentCardId, isOpen, stateOverrides = {} }: HookProps) => {
  const store = createStore({ state: createTestState(stateOverrides) });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(
    ({ contentCardId: cardId, isOpen: open }) => useGenericAwarenessModalBrazeLogging(cardId, open),
    {
      wrapper,
      initialProps: { contentCardId, isOpen },
    },
  );
};

describe("useGenericAwarenessModalBrazeLogging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log one Braze impression per open and not repeat on rerender", () => {
    const { rerender } = renderBrazeLoggingHook({ contentCardId: CARD_ID, isOpen: true });

    expect(mockLogContentCardImpressions).toHaveBeenCalledTimes(1);
    expect(mockLogContentCardImpressions).toHaveBeenCalledWith([brazeCard]);

    rerender({ contentCardId: CARD_ID, isOpen: true });
    expect(mockLogContentCardImpressions).toHaveBeenCalledTimes(1);
  });

  it("should reset impression dedup when isOpen toggles off and log again on reopen", () => {
    const { rerender } = renderBrazeLoggingHook({ contentCardId: CARD_ID, isOpen: true });

    expect(mockLogContentCardImpressions).toHaveBeenCalledTimes(1);

    rerender({ contentCardId: CARD_ID, isOpen: false });
    expect(mockLogContentCardImpressions).toHaveBeenCalledTimes(1);

    rerender({ contentCardId: CARD_ID, isOpen: true });
    expect(mockLogContentCardImpressions).toHaveBeenCalledTimes(2);
  });

  it("should skip impression logging when analytics tracking is disabled", () => {
    renderBrazeLoggingHook({
      contentCardId: CARD_ID,
      isOpen: true,
      stateOverrides: {
        settings: {
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
        } as State["settings"],
      },
    });

    expect(mockLogContentCardImpressions).not.toHaveBeenCalled();
  });

  it("should log click and dismiss when tracking is enabled", () => {
    const { result } = renderBrazeLoggingHook({ contentCardId: CARD_ID, isOpen: true });

    act(() => {
      result.current.logClick();
      result.current.logDismiss();
    });

    expect(mockLogContentCardClick).toHaveBeenCalledWith(brazeCard);
    expect(mockLogCardDismissal).toHaveBeenCalledWith(brazeCard);
  });
});
