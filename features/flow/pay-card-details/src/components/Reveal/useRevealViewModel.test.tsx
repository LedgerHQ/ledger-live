import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
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
  revealCardDetailsImageHandler,
} from "@support/msw-features-flow-pay-card";
import { useRevealViewModel } from "./useRevealViewModel";

const server = listenToCardApi();

beforeEach(() => {
  server.use(revealCardDetailsHandler, revealCardDetailsImageHandler);
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(next => {
    resolve = next;
  });
  return { promise, resolve };
}

function renderReveal() {
  const store = makeCardApiStore();

  function Wrapper({ children }: PropsWithChildren) {
    return <CardApiStoreProvider store={store}>{children}</CardApiStoreProvider>;
  }

  const { result } = renderHook(() => useRevealViewModel(), { wrapper: Wrapper });

  function reveal() {
    return result.current;
  }

  return { store, result, reveal };
}

async function renderRevealed() {
  const rendered = renderReveal();
  await act(async () => {
    await rendered.reveal().onReveal();
  });
  await waitFor(() => expect(rendered.reveal().imageUrl).toMatch(/^data:image\/png;base64,/));
  act(() => {
    rendered.reveal().onImageLoad();
  });
  return rendered;
}

describe("useRevealViewModel", () => {
  it("keeps loading until the details image loads", async () => {
    const { reveal } = renderReveal();

    await act(async () => {
      await reveal().onReveal();
    });

    await waitFor(() => expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/));
    expect(reveal().status).toBe("loading");
    expect(reveal().isRevealed).toBe(false);

    act(() => {
      reveal().onImageLoad();
    });

    expect(reveal().status).toBe("revealed");
    expect(reveal().isRevealed).toBe(true);
    expect(reveal().canHide).toBe(true);
  });

  it("reveals the image after the token request succeeds", async () => {
    const { reveal, store } = await renderRevealed();

    expect(reveal().status).toBe("revealed");
    expect(reveal().isRevealed).toBe(true);
    expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/);
    const state = JSON.stringify(store.getState());
    expect(state).not.toContain(CARD_DETAILS_TOKEN);
    expect(state).not.toContain("details-image");
  });

  it("shows loading while the token request is pending", async () => {
    const tokenWait = deferred<void>();
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, async () => {
        await tokenWait.promise;
        return HttpResponse.json(CARD_DETAILS);
      }),
    );
    const { reveal } = renderReveal();

    act(() => {
      void reveal().onReveal();
    });

    expect(reveal().status).toBe("loading");

    await act(async () => {
      tokenWait.resolve();
    });

    await waitFor(() => expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/));
    act(() => {
      reveal().onImageLoad();
    });
    expect(reveal().status).toBe("revealed");
    expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("sets failed when the details image cannot be read", async () => {
    server.use(
      revealCardDetailsHandler,
      http.get(CARD_DETAILS_IMAGE_URL, () => HttpResponse.json({}, { status: 410 })),
    );
    const { reveal } = renderReveal();

    await act(async () => {
      await reveal().onReveal();
    });

    expect(reveal().status).toBe("failed");
    expect(reveal().imageUrl).toBeUndefined();
  });

  it("sets failed when the token request fails", async () => {
    server.use(revealCardDetailsFailureHandler);
    const { reveal } = renderReveal();

    await act(async () => {
      await reveal().onReveal();
    });

    expect(reveal().status).toBe("failed");
    expect(reveal().imageUrl).toBeUndefined();
  });

  it("hides the numbers, keeping the spent image for the flip back", async () => {
    const { reveal } = await renderRevealed();

    act(() => {
      reveal().onHide();
    });

    expect(reveal().status).toBe("idle");
    expect(reveal().isRevealed).toBe(false);
    expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("clears the spent image the moment the next reveal starts", async () => {
    const { reveal } = await renderRevealed();
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
    const { reveal } = renderReveal();

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

  it("ignores a late image error after hide", async () => {
    const { reveal } = await renderRevealed();

    act(() => {
      reveal().onHide();
      reveal().onImageError();
    });

    expect(reveal().status).toBe("idle");
    expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("ignores a late image load after hide", async () => {
    const { reveal } = renderReveal();

    await act(async () => {
      await reveal().onReveal();
    });
    await waitFor(() => expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/));

    act(() => {
      reveal().onHide();
      reveal().onImageLoad();
    });

    expect(reveal().status).toBe("idle");
    expect(reveal().isRevealed).toBe(false);
  });

  it("sets failed when the details image errors while loading", async () => {
    const { reveal } = renderReveal();

    await act(async () => {
      await reveal().onReveal();
    });
    await waitFor(() => expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/));

    act(() => {
      reveal().onImageError();
    });

    expect(reveal().status).toBe("failed");
    expect(reveal().imageUrl).toBeUndefined();
  });

  it("stays revealed if the details image errors after a successful load", async () => {
    const { reveal } = await renderRevealed();

    act(() => {
      reveal().onImageError();
    });

    expect(reveal().status).toBe("revealed");
    expect(reveal().isRevealed).toBe(true);
    expect(reveal().imageUrl).toMatch(/^data:image\/png;base64,/);
  });
});
