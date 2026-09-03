import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { SendFlowTrackingProvider, useSendFlowTracking } from "../SendFlowTrackingContext";

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <SendFlowTrackingProvider>{children}</SendFlowTrackingProvider>;
}

describe("SendFlowTrackingContext", () => {
  it("keeps recipient resolution metadata for the whole Send flow", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });

    expect(result.current).toMatchObject({
      inputMethod: "manual",
      resultType: null,
      recipientType: null,
      savedContactDuringFlow: false,
    });

    act(() => {
      result.current.setInputMethod("paste");
      result.current.setRecipientResolution("contact address match", "contact");
      result.current.markContactSaved();
    });

    expect(result.current).toMatchObject({
      inputMethod: "paste",
      resultType: "contact address match",
      recipientType: "contact",
      savedContactDuringFlow: true,
    });
  });

  it("clears the recipient resolution without losing the other tracking metadata", () => {
    const { result } = renderHook(() => useSendFlowTracking(), { wrapper });

    act(() => {
      result.current.setInputMethod("paste");
      result.current.setRecipientResolution("contact address match", "contact");
      result.current.markContactSaved();
    });

    act(() => {
      result.current.resetRecipientResolution();
    });

    expect(result.current).toMatchObject({
      inputMethod: "paste",
      resultType: null,
      recipientType: null,
      savedContactDuringFlow: true,
    });
  });
});
