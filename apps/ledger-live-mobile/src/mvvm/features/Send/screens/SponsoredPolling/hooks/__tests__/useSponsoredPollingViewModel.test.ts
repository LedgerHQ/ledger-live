import { act, renderHook } from "@testing-library/react-native";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSponsoredPollingViewModel } from "../useSponsoredPollingViewModel";

let mockPhase: string = SPONSORED_PHASE.POLLING;

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key} ${JSON.stringify(params)}` : key,
  }),
}));
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: { phase: mockPhase }, providerName: "Provider" }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockPhase = SPONSORED_PHASE.POLLING;
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useSponsoredPollingViewModel", () => {
  it("names the provider and counts the elapsed time while polling", () => {
    const { result } = renderHook(() => useSponsoredPollingViewModel());

    expect(result.current.title).toBe("send.newSendFlow.sponsoredPolling.title");
    expect(result.current.message).toContain('"provider":"Provider"');
    expect(result.current.elapsedLabel).toContain('"time":"00:00"');

    act(() => {
      jest.advanceTimersByTime(65_000);
    });

    expect(result.current.elapsedLabel).toContain('"time":"01:05"');
  });

  it("doesn't count outside the polling phase", () => {
    mockPhase = SPONSORED_PHASE.TRANSFER;
    const { result } = renderHook(() => useSponsoredPollingViewModel());

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(result.current.elapsedLabel).toContain('"time":"00:00"');
  });
});
