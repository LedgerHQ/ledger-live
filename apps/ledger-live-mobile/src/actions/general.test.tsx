import { InteractionManager } from "react-native";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { State } from "~/reducers/types";
import {
  addExtraSessionTrackingPairs,
  useExtraSessionTrackingPair,
  useRefreshAccountsOrderingAfterInteractions,
  useTrackingPairs,
  useUserSettings,
} from "./general";

const mockDispatch = jest.fn();

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
}));

describe("useRefreshAccountsOrderingAfterInteractions", () => {
  let runAfterInteractionsSpy: jest.SpyInstance;
  let scheduledInteractions: { callback: () => void; cancelled: boolean }[];

  const flushScheduledInteractions = () => {
    scheduledInteractions.forEach(interaction => {
      if (!interaction.cancelled) {
        interaction.callback();
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    scheduledInteractions = [];
    runAfterInteractionsSpy = jest
      .spyOn(InteractionManager, "runAfterInteractions")
      .mockImplementation(
        (task?: Parameters<typeof InteractionManager.runAfterInteractions>[0]) => {
          const interactionTask = Promise.resolve() as unknown as ReturnType<
            typeof InteractionManager.runAfterInteractions
          >;
          interactionTask.done = jest.fn();

          if (typeof task === "function") {
            const interaction = {
              callback: task,
              cancelled: false,
            };
            scheduledInteractions.push(interaction);
            interactionTask.cancel = () => {
              interaction.cancelled = true;
            };
          } else {
            interactionTask.cancel = jest.fn();
          }

          return interactionTask;
        },
      );
  });

  afterEach(() => {
    runAfterInteractionsSpy.mockRestore();
  });

  it("should defer accounts ordering refresh until interactions finish", async () => {
    const { result } = renderHook(() => useRefreshAccountsOrderingAfterInteractions());

    act(() => {
      result.current();
    });

    expect(mockDispatch).not.toHaveBeenCalled();

    act(() => {
      flushScheduledInteractions();
    });

    await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
  });

  it("should not refresh accounts ordering when cleaning up before interactions finish", () => {
    const { result } = renderHook(() => useRefreshAccountsOrderingAfterInteractions());

    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current();
    });
    cleanup?.();

    act(() => {
      flushScheduledInteractions();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

function renderPairs() {
  let renders = 0;
  const rendered = renderHook(() => {
    renders += 1;
    return useExtraSessionTrackingPair();
  });
  return { ...rendered, rendersSoFar: () => renders };
}

describe("addExtraSessionTrackingPairs", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");

  it("dedupes by pair id rather than by currency reference, in one emission", () => {
    const { result, rendersSoFar } = renderPairs();
    const before = rendersSoFar();

    act(() => {
      addExtraSessionTrackingPairs([
        { from: bitcoin, to: usd, startDate: new Date() },
        { from: { ...bitcoin }, to: { ...usd }, startDate: new Date() },
        { from: ethereum, to: usd, startDate: new Date() },
      ]);
    });

    expect(result.current.map(pairId)).toEqual([
      pairId({ from: bitcoin, to: usd }),
      pairId({ from: ethereum, to: usd }),
    ]);
    expect(rendersSoFar() - before).toBe(1);
  });

  it("adds nothing when every pair is already registered", () => {
    const { result, rendersSoFar } = renderPairs();

    // Registered here, not leaned on from the test above: the subject is a module global.
    act(() => {
      addExtraSessionTrackingPairs([{ from: bitcoin, to: usd, startDate: new Date() }]);
    });
    const registered = result.current.length;
    expect(registered).toBeGreaterThan(0);
    const before = rendersSoFar();

    act(() => {
      addExtraSessionTrackingPairs([
        { from: { ...bitcoin }, to: { ...usd }, startDate: new Date() },
      ]);
    });

    expect(result.current).toHaveLength(registered);
    expect(rendersSoFar() - before).toBe(0);
  });
});

describe("useUserSettings tracking pairs", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const usd = getFiatCurrencyByTicker("USD");

  function withBitcoinAccount(state: State): State {
    return { ...state, accounts: { active: [genAccount("bitcoin-1", { currency: bitcoin })] } };
  }

  it("collapses an extra pair that repeats one the accounts already track", () => {
    const { result } = renderHook(
      () => ({ settings: useUserSettings(), raw: useTrackingPairs() }),
      { overrideInitialState: withBitcoinAccount },
    );

    act(() => {
      addExtraSessionTrackingPairs([{ from: bitcoin, to: usd, startDate: new Date() }]);
    });

    const wanted = pairId({ from: bitcoin, to: usd });
    // Asserted on the raw union too, so this cannot pass with no duplicate present.
    expect(result.current.raw.map(pairId).filter(id => id === wanted)).toHaveLength(2);

    const ids = result.current.settings.trackingPairs.map(pairId);
    expect(ids.filter(id => id === wanted)).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never stores a same-currency pair", () => {
    // On what was stored: the resolved list drops such a pair anyway.
    const { result } = renderHook(() => ({
      stored: useExtraSessionTrackingPair(),
      settings: useUserSettings(),
    }));

    act(() => {
      addExtraSessionTrackingPairs([{ from: usd, to: usd, startDate: new Date() }]);
    });

    expect(result.current.stored.some(pair => pair.from === pair.to)).toBe(false);
    expect(result.current.settings.trackingPairs.some(pair => pair.from === pair.to)).toBe(false);
  });
});
