import React, { type ReactNode } from "react";
import { Linking } from "react-native";
import { track } from "@shared/analytics";
import { useOpenLink } from "@shared/linking";
import { renderHook } from "@tests/test-renderer";
import { LinkingProviderWrapper } from "../LinkingProviderWrapper";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));

const renderOpenLink = () =>
  renderHook(() => useOpenLink(), {
    innerWrapper: ({ children }: { children?: ReactNode }) => (
      <LinkingProviderWrapper>{children}</LinkingProviderWrapper>
    ),
  });

describe("LinkingProviderWrapper", () => {
  it("opens the link outside the app and tracks it", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderOpenLink();

    result.current("https://support.ledger.com/article");

    expect(openURL).toHaveBeenCalledWith("https://support.ledger.com/article");
    expect(track).toHaveBeenCalledWith("OpenURL", { url: "https://support.ledger.com/article" });
  });

  it("carries on when the system cannot open the link", async () => {
    jest.useRealTimers();
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no handler"));
    const onUnhandledRejection = jest.fn();
    process.on("unhandledRejection", onUnhandledRejection);
    const { result } = renderOpenLink();

    result.current("https://support.ledger.com/article");
    await new Promise(resolve => setTimeout(resolve, 0));

    process.off("unhandledRejection", onUnhandledRejection);
    expect(onUnhandledRejection).not.toHaveBeenCalled();
  });
});
