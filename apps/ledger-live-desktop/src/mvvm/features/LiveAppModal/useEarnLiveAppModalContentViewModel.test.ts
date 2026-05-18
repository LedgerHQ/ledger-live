import { renderHook, withFlagOverrides } from "tests/testSetup";
import useEarnLiveAppModalContentViewModel from "./useEarnLiveAppModalContentViewModel";

const makeStakeProgramsFeature = (
  redirects: Record<
    string,
    {
      platform: "stakekit" | "kiln-widget" | "earn";
      name: string;
      queryParams?: Record<string, string>;
    }
  >,
  list: string[],
) =>
  ({
    enabled: true,
    params: {
      list,
      redirects,
    },
  }) as unknown as Parameters<typeof withFlagOverrides>[0]["stakePrograms"];

describe("useEarnLiveAppModalContentViewModel (desktop)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns computed uiVersion and lw40enabled=true when wallet 40 is enabled", () => {
    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      initialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
        lwdWallet40: { enabled: true },
        stakePrograms: makeStakeProgramsFeature(
          {
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
          ["ethereum", "bitcoin"],
        ),
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

  it("returns fallback v1 and lw40enabled=false when wallet 40 is disabled", () => {
    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      initialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v2" } },
        lwdWallet40: { enabled: false },
        stakePrograms: makeStakeProgramsFeature({}, []),
      }),
    });

    expect(result.current.extraInputs?.uiVersion).toBe("v1");
    expect(result.current.extraInputs?.lw40enabled).toBe("false");
  });

  it("returns v3 when earn upselling is enabled", () => {
    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      initialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v1" } },
        lwdWallet40: { enabled: true, params: { earnUpselling: true } as never },
        stakePrograms: makeStakeProgramsFeature({}, []),
      }),
    });

    expect(result.current.extraInputs?.uiVersion).toBe("v3");
    expect(result.current.extraInputs?.lw40enabled).toBe("true");
  });

  it("returns v4 when earn simulator is enabled", () => {
    const { result } = renderHook(() => useEarnLiveAppModalContentViewModel(), {
      initialState: withFlagOverrides({
        ptxEarnUi: { enabled: true, params: { value: "v1" } },
        lwdWallet40: { enabled: true, params: { earnSimulator: true } as never },
        stakePrograms: makeStakeProgramsFeature({}, []),
      }),
    });

    expect(result.current.extraInputs?.uiVersion).toBe("v4");
    expect(result.current.extraInputs?.lw40enabled).toBe("true");
  });
});
