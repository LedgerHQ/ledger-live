import { act, renderHook } from "@testing-library/react";
import { trackPage } from "@shared/analytics";
import type { ReceiveServiceIncident } from "../../types";
import { useReceiveAddressServiceStatus } from "./useReceiveAddressServiceStatus";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const renderServiceStatus = (
  initialIncidents: readonly ReceiveServiceIncident[] | undefined,
  onOpenUrl?: (url: string) => void,
) =>
  renderHook(
    ({ incidents }) =>
      useReceiveAddressServiceStatus({
        serviceIncidents: incidents,
        continueLabel: "Continue",
        onOpenUrl,
      }),
    { initialProps: { incidents: initialIncidents } },
  );

describe("useReceiveAddressServiceStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the first incident, then lets the user continue to the address", () => {
    const { result } = renderServiceStatus([
      { title: "Stellar degraded", description: [{ text: "Investigating" }] },
      { title: "Explorer down" },
    ]);

    expect(result.current).toEqual(
      expect.objectContaining({
        title: "Stellar degraded",
        description: [{ text: "Investigating", onPress: undefined }],
        continueLabel: "Continue",
      }),
    );
    expect(trackPage).toHaveBeenCalledWith({
      category: "Receive - Infra Warning",
      props: { warning: "service incident", page: "Receive - Confirmation", flow: "receive" },
    });

    act(() => result.current?.onContinue());

    expect(result.current).toBeUndefined();
  });

  it("opens the links of the incident's text", () => {
    const onOpenUrl = jest.fn();
    const { result } = renderServiceStatus(
      [
        {
          title: "Stellar degraded",
          description: [{ text: "See " }, { text: "this article", url: "https://ledger.com/a" }],
        },
      ],
      onOpenUrl,
    );

    result.current?.description?.[1].onPress?.();

    expect(result.current?.description?.[0].onPress).toBeUndefined();
    expect(onOpenUrl).toHaveBeenCalledWith("https://ledger.com/a");
  });

  it("shows links as text when the app cannot open them", () => {
    const { result } = renderServiceStatus([
      {
        title: "Stellar degraded",
        description: [{ text: "this article", url: "https://ledger.com/a" }],
      },
    ]);

    expect(result.current?.description).toEqual([{ text: "this article", onPress: undefined }]);
  });

  it("shows nothing without incident", () => {
    const { result } = renderServiceStatus([]);

    expect(result.current).toBeUndefined();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("shows incidents known after the screen opened", () => {
    const { result, rerender } = renderServiceStatus(undefined);

    rerender({ incidents: [{ title: "Stellar degraded" }] });

    expect(result.current?.title).toBe("Stellar degraded");
  });

  it("does not come back once the user continued, and sends its page event once", () => {
    const { result, rerender } = renderServiceStatus([{ title: "Stellar degraded" }]);

    rerender({ incidents: [{ title: "Stellar degraded" }] });
    act(() => result.current?.onContinue());
    rerender({ incidents: [{ title: "Stellar partially degraded" }] });

    expect(result.current).toBeUndefined();
    expect(trackPage).toHaveBeenCalledTimes(1);
  });
});
