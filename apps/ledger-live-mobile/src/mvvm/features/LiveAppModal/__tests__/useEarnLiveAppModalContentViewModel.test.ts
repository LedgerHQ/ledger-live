import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import useEarnLiveAppModalContentViewModel from "../useEarnLiveAppModalContentViewModel";

jest.mock("LLM/hooks/useStake/useVersionedStakePrograms", () => ({
  useVersionedStakePrograms: jest.fn(),
}));

const mockedUseVersionedStakePrograms = jest.mocked(useVersionedStakePrograms);

describe("useEarnLiveAppModalContentViewModel (mobile)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns serialized params and enabled values when wallet 40 is enabled", () => {
    mockedUseVersionedStakePrograms.mockReturnValue({
      enabled: true,
      params: {
        list: ["ethereum", "bitcoin"],
        redirects: {
          ethereum: {
            platform: "earn",
            name: "",
            queryParams: { ethDepositCohort: "cohort-a" },
          },
          bitcoin: {
            platform: "stakekit",
            name: "",
          },
        },
      },
    } as never);

    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
        lwmWallet40: { enabled: true },
      }),
    });

    expect(result.current.extraInputs).toEqual({
      uiVersion: "v2",
      lw40enabled: "true",
      ethDepositCohort: "cohort-a",
      stakeProgramsParam: JSON.stringify({ ethereum: "earn", bitcoin: "stakekit" }),
      stakeCurrenciesParam: JSON.stringify(["ethereum", "bitcoin"]),
    });
  });

  it("omits empty stakeCurrencies and falls back to v1 when wallet 40 is disabled", () => {
    mockedUseVersionedStakePrograms.mockReturnValue({
      enabled: true,
      params: { list: [], redirects: {} },
    } as never);

    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
        lwmWallet40: { enabled: false },
      }),
    });

    expect(result.current.extraInputs?.uiVersion).toBe("v1");
    expect(result.current.extraInputs?.lw40enabled).toBe("false");
    expect(result.current.extraInputs?.stakeProgramsParam).toBeUndefined();
    expect(result.current.extraInputs?.stakeCurrenciesParam).toBeUndefined();
  });

  it("returns v3 when earn upselling is enabled", () => {
    mockedUseVersionedStakePrograms.mockReturnValue({
      enabled: true,
      params: {
        list: [],
        redirects: {},
      },
    } as never);

    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v1" } },
        lwmWallet40: { enabled: true, params: { earnUpselling: true } as never },
      }),
    });

    expect(result.current.extraInputs?.uiVersion).toBe("v3");
    expect(result.current.extraInputs?.lw40enabled).toBe("true");
  });

  it("returns v4 when earn simulator is enabled", () => {
    mockedUseVersionedStakePrograms.mockReturnValue({
      enabled: true,
      params: {
        list: [],
        redirects: {},
      },
    } as never);

    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      overrideInitialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v1" } },
        lwmWallet40: { enabled: true, params: { earnSimulator: true } as never },
      }),
    });

    expect(result.current.extraInputs?.uiVersion).toBe("v4");
    expect(result.current.extraInputs?.lw40enabled).toBe("true");
  });
});
