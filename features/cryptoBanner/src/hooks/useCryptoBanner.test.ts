import React from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useCryptoBanner } from "./useCryptoBanner";
import { cryptoBannerApi } from "../data-layer/api/cryptoBanner.api";

const createWrapper = () => {
  const store = configureStore({
    reducer: {
      [cryptoBannerApi.reducerPath]: cryptoBannerApi.reducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cryptoBannerApi.middleware),
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return Wrapper;
};

describe("useCryptoBanner", () => {
  it("should return initial state", () => {
    const { result } = renderHook(() => useCryptoBanner({ product: "llm", version: "1.0.0" }), {
      wrapper: createWrapper(),
    });

    expect(result.current.topCryptos).toEqual([]);
    expect(result.current.isLoading).toBeDefined();
  });
});

