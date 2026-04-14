import useNftsEntryPointViewModel from "../useNftsEntryPointViewModel";
import { AnalyticsPage, Entry } from "../types";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { INITIAL_STATE } from "~/reducers/settings";

describe("useNftsEntryPointViewModel", () => {
  it("should return isFeatureNftEntryPointEnabled as false if feature is disabled", () => {
    const { result } = renderHook(
      () =>
        useNftsEntryPointViewModel({ accountId: "testAccountId", currencyId: "testCurrencyId" }),
      {
        overrideInitialState: withFlagOverrides({ llNftEntryPoint: { enabled: false } }, state => ({
          ...state,
          settings: {
            ...INITIAL_STATE,
          },
        })),
      },
    );

    expect(result.current.isFeatureNftEntryPointEnabled).toBe(false);
  });

  it("should return isFeatureNftEntryPointEnabled as true if feature is enabled", () => {
    const { result } = renderHook(
      () =>
        useNftsEntryPointViewModel({ accountId: "testAccountId", currencyId: "testCurrencyId" }),
      {
        overrideInitialState: withFlagOverrides(
          {
            llNftEntryPoint: {
              enabled: true,
              params: {
                [Entry.magiceden]: true,
                [Entry.opensea]: true,
              },
            },
          },
          state => ({
            ...state,
            settings: {
              ...INITIAL_STATE,
            },
          }),
        ),
      },
    );

    expect(result.current.isFeatureNftEntryPointEnabled).toBe(true);
  });

  it("should correctly configure entryPoints for magiceden", () => {
    const { result } = renderHook(
      () =>
        useNftsEntryPointViewModel({ accountId: "testAccountId", currencyId: "testCurrencyId" }),
      {
        overrideInitialState: withFlagOverrides(
          {
            llNftEntryPoint: {
              enabled: true,
              params: {
                [Entry.magiceden]: true,
                [Entry.opensea]: true,
              },
            },
          },
          state => ({
            ...state,
            settings: {
              ...INITIAL_STATE,
            },
          }),
        ),
      },
    );
    const magicedenEntry = result.current.entryPoints[Entry.magiceden];

    expect(magicedenEntry.enabled).toBe(true);
    expect(magicedenEntry.page).toBe(AnalyticsPage.Account);
  });

  it("should correctly configure entryPoints for opensea", () => {
    const { result } = renderHook(
      () =>
        useNftsEntryPointViewModel({ accountId: "testAccountId", currencyId: "testCurrencyId" }),
      {
        overrideInitialState: withFlagOverrides(
          {
            llNftEntryPoint: {
              enabled: true,
              params: {
                [Entry.magiceden]: true,
                [Entry.opensea]: true,
              },
            },
          },
          state => ({
            ...state,
            settings: {
              ...INITIAL_STATE,
            },
          }),
        ),
      },
    );
    const openseaEntry = result.current.entryPoints[Entry.opensea];

    expect(openseaEntry.enabled).toBe(true);
    expect(openseaEntry.page).toBe(AnalyticsPage.Account);
  });
});
