import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import {
  CARD_DETAILS,
  CARD_DETAILS_IMAGE_URL,
  CARD_DETAILS_TOKEN,
  CARD_DETAILS_TOKEN_URL,
  CardApiStoreProvider,
  listenToCardApi,
  makeCardApiStore,
  revealCardDetailsFailureHandler,
  revealCardDetailsHandler,
} from "@support/msw-features-flow-pay-card";
import { useRevealViewModel } from "./useRevealViewModel";

const server = listenToCardApi();

beforeEach(() => {
  server.use(revealCardDetailsHandler);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(next => {
    resolve = next;
  });
  return { promise, resolve };
}

function renderReveal(unlock?: () => Promise<boolean>) {
  const store = makeCardApiStore();

  function Wrapper({ children }: PropsWithChildren) {
    return <CardApiStoreProvider store={store}>{children}</CardApiStoreProvider>;
  }

  const { result } = renderHook(() => useRevealViewModel({ unlock }), { wrapper: Wrapper });

  function reveal() {
    if (!result.current) {
      throw new Error("the hook published no reveal view model");
    }
    return result.current;
  }

  return { store, result, reveal };
}

async function renderRevealed(unlock: () => Promise<boolean> = () => Promise.resolve(true)) {
  const rendered = renderReveal(unlock);
  await act(async () => {
    await rendered.reveal().onReveal();
  });
  return rendered;
}

describe("useRevealViewModel", () => {
  it("publishes no reveal when the host granted no unlock", () => {
    const { result } = renderReveal();

    expect(result.current).toBeNull();
  });

  it("reveals the image after unlock succeeds", async () => {
    const { reveal, store } = await renderRevealed();

    await waitFor(() => expect(reveal().status).toBe("revealed"));
    expect(reveal().isRevealed).toBe(true);
    expect(reveal().imageUrl).toBe(CARD_DETAILS_IMAGE_URL);
    const state = JSON.stringify(store.getState());
    expect(state).not.toContain(CARD_DETAILS_TOKEN);
    expect(state).not.toContain("details-image");
  });

  it("stays idle when unlock is cancelled", async () => {
    const { reveal } = await renderRevealed(() => Promise.resolve(false));

    expect(reveal().status).toBe("idle");
    expect(reveal().isRevealed).toBe(false);
    expect(reveal().imageUrl).toBeUndefined();
  });

  it("shows loading while unlock is pending", async () => {
    const unlockWait = deferred<boolean>();
    const { reveal } = renderReveal(() => unlockWait.promise);

    act(() => {
      void reveal().onReveal();
    });

    expect(reveal().status).toBe("loading");

    await act(async () => {
      unlockWait.resolve(true);
    });

    await waitFor(() => expect(reveal().status).toBe("revealed"));
    expect(reveal().imageUrl).toBe(CARD_DETAILS_IMAGE_URL);
  });

  it("sets failed when the token request fails", async () => {
    server.use(revealCardDetailsFailureHandler);
    const { reveal } = await renderRevealed();

    await waitFor(() => expect(reveal().status).toBe("failed"));
    expect(reveal().imageUrl).toBeUndefined();
  });

  it("hides the numbers, keeping the spent image for the flip back", async () => {
    const { reveal } = await renderRevealed();
    await waitFor(() => expect(reveal().status).toBe("revealed"));

    act(() => {
      reveal().onHide();
    });

    expect(reveal().status).toBe("idle");
    expect(reveal().isRevealed).toBe(false);
    expect(reveal().imageUrl).toBe(CARD_DETAILS_IMAGE_URL);
  });

  it("clears the spent image the moment the next reveal starts", async () => {
    const { reveal } = await renderRevealed();
    await waitFor(() => expect(reveal().status).toBe("revealed"));
    act(() => {
      reveal().onHide();
    });

    const tokenWait = deferred<void>();
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, async () => {
        await tokenWait.promise;
        return HttpResponse.json(CARD_DETAILS);
      }),
    );
    act(() => {
      void reveal().onReveal();
    });
    await waitFor(() => expect(reveal().status).toBe("loading"));

    expect(reveal().imageUrl).toBeUndefined();

    await act(async () => {
      tokenWait.resolve();
    });
  });

  it("stays hidden if hide happens before the image arrives", async () => {
    const tokenWait = deferred<void>();
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, async () => {
        await tokenWait.promise;
        return HttpResponse.json(CARD_DETAILS);
      }),
    );
    const { reveal } = renderReveal(() => Promise.resolve(true));

    act(() => {
      void reveal().onReveal();
    });
    await waitFor(() => expect(reveal().status).toBe("loading"));

    act(() => {
      reveal().onHide();
    });

    await act(async () => {
      tokenWait.resolve();
    });

    expect(reveal().status).toBe("idle");
    expect(reveal().imageUrl).toBeUndefined();
  });

  it("sets failed when the details image errors", async () => {
    const { reveal } = await renderRevealed();
    await waitFor(() => expect(reveal().status).toBe("revealed"));

    act(() => {
      reveal().onImageError();
    });

    expect(reveal().status).toBe("failed");
    expect(reveal().imageUrl).toBeUndefined();
  });
});
