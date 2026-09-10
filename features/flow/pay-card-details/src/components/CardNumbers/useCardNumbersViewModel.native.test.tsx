import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  CARD_DETAILS,
  CARD_DETAILS_IMAGE_URL,
  CARD_DETAILS_TOKEN,
  CARD_DETAILS_TOKEN_URL,
  CardApiStoreProvider,
  makeCardApiStore,
} from "../../__tests__/cardApiStore";
import { useCardNumbersViewModel } from "./useCardNumbersViewModel";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

beforeEach(() => {
  server.use(http.post(CARD_DETAILS_TOKEN_URL, () => HttpResponse.json(CARD_DETAILS)));
});

afterEach(() => {
  server.resetHandlers();
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(next => {
    resolve = next;
  });
  return { promise, resolve };
}

function renderNumbers(unlock: () => Promise<boolean>) {
  const store = makeCardApiStore();

  function Wrapper({ children }: PropsWithChildren) {
    return <CardApiStoreProvider store={store}>{children}</CardApiStoreProvider>;
  }

  return {
    store,
    ...renderHook(() => useCardNumbersViewModel({ unlock }), { wrapper: Wrapper }),
  };
}

async function reveal(unlock: () => Promise<boolean> = () => Promise.resolve(true)) {
  const rendered = renderNumbers(unlock);
  await act(async () => {
    await rendered.result.current.onReveal();
  });
  return rendered;
}

describe("useCardNumbersViewModel", () => {
  it("reveals the image after unlock succeeds", async () => {
    const { result, store } = await reveal();

    await waitFor(() => expect(result.current.status).toBe("revealed"));
    expect(result.current.imageUrl).toBe(CARD_DETAILS_IMAGE_URL);
    const state = JSON.stringify(store.getState());
    expect(state).not.toContain(CARD_DETAILS_TOKEN);
    expect(state).not.toContain("details-image");
  });

  it("stays idle when unlock is cancelled", async () => {
    const { result } = await reveal(() => Promise.resolve(false));

    expect(result.current.status).toBe("idle");
    expect(result.current.imageUrl).toBeUndefined();
  });

  it("shows loading while unlock is pending", async () => {
    const unlockWait = deferred<boolean>();
    const { result } = renderNumbers(() => unlockWait.promise);

    act(() => {
      void result.current.onReveal();
    });

    expect(result.current.status).toBe("loading");

    await act(async () => {
      unlockWait.resolve(true);
    });

    await waitFor(() => expect(result.current.status).toBe("revealed"));
    expect(result.current.imageUrl).toBe(CARD_DETAILS_IMAGE_URL);
  });

  it("sets failed when the token request fails", async () => {
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, () =>
        HttpResponse.json({ message: "mint failed" }, { status: 500 }),
      ),
    );
    const { result } = await reveal();

    await waitFor(() => expect(result.current.status).toBe("failed"));
    expect(result.current.imageUrl).toBeUndefined();
  });

  it("hides the numbers", async () => {
    const { result } = await reveal();
    await waitFor(() => expect(result.current.status).toBe("revealed"));

    act(() => {
      result.current.onHide();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.imageUrl).toBeUndefined();
  });

  it("stays hidden if hide happens before the image arrives", async () => {
    const tokenWait = deferred<void>();
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, async () => {
        await tokenWait.promise;
        return HttpResponse.json(CARD_DETAILS);
      }),
    );
    const { result } = renderNumbers(() => Promise.resolve(true));

    act(() => {
      void result.current.onReveal();
    });
    await waitFor(() => expect(result.current.status).toBe("loading"));

    act(() => {
      result.current.onHide();
    });

    await act(async () => {
      tokenWait.resolve();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.imageUrl).toBeUndefined();
  });

  it("sets failed when the details image errors", async () => {
    const { result } = await reveal();
    await waitFor(() => expect(result.current.status).toBe("revealed"));

    act(() => {
      result.current.onImageError();
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.imageUrl).toBeUndefined();
  });
});
