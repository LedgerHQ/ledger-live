import React from "react";
import { Linking } from "react-native";
import { render, screen, waitFor } from "@tests/test-renderer";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import { LargeScreenUpsellModalContent } from "..";

const content: GenericAwarenessModalFeatureIntro = {
  id: "large-screen-upsell-modal",
  layout: GenericAwarenessModalLayout.FeatureIntro,
  imageUrlLight: "https://example.com/light.png",
  imageUrlDark: "https://example.com/dark.png",
  title: "See more. Tap less. Save 10%",
  subtitle: "Enjoy a larger screen and smarter transaction review.",
  primaryButtonLabel: "Claim offer",
  primaryButtonLink: "https://www.ledger.com",
  secondaryButtonLabel: "",
  secondaryButtonLink: "",
  items: [],
  isReady: true,
};

const renderLargeScreenUpsellModalContent = (
  contentOverrides?: Partial<GenericAwarenessModalFeatureIntro>,
) => {
  const onPrimaryPress = jest.fn();
  const viewModel: FeatureIntroViewModel = {
    content: {
      ...content,
      ...contentOverrides,
    },
    onPrimaryPress,
    onSecondaryPress: jest.fn(),
  };

  return {
    ...render(<LargeScreenUpsellModalContent viewModel={viewModel} />),
    onPrimaryPress,
  };
};

const renderAndPressPrimaryCta = async () => {
  const result = renderLargeScreenUpsellModalContent();

  await result.user.press(screen.getByTestId("large-screen-upsell-modal-primary-button"));

  return result;
};

describe("LargeScreenUpsellModalContent", () => {
  let canOpenURLSpy: jest.SpiedFunction<typeof Linking.canOpenURL>;
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    canOpenURLSpy = jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => {
    canOpenURLSpy.mockRestore();
    openURLSpy.mockRestore();
  });

  it("should render the primary CTA when label and link are provided", () => {
    renderLargeScreenUpsellModalContent();

    expect(screen.getByTestId("large-screen-upsell-modal-primary-button")).toBeOnTheScreen();
    expect(screen.getByText("Claim offer")).toBeOnTheScreen();
  });

  it("should open the primary CTA link when the platform can handle it", async () => {
    const { onPrimaryPress } = await renderAndPressPrimaryCta();

    await waitFor(() => {
      expect(canOpenURLSpy).toHaveBeenCalledWith("https://www.ledger.com");
      expect(openURLSpy).toHaveBeenCalledWith("https://www.ledger.com");
      expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    });
  });

  it("should not open the primary CTA link when the platform cannot handle it", async () => {
    canOpenURLSpy.mockResolvedValue(false);

    const { onPrimaryPress } = await renderAndPressPrimaryCta();

    await waitFor(() => expect(canOpenURLSpy).toHaveBeenCalledWith("https://www.ledger.com"));
    await expect(canOpenURLSpy.mock.results[0]?.value).resolves.toBe(false);
    expect(openURLSpy).not.toHaveBeenCalled();
    expect(onPrimaryPress).not.toHaveBeenCalled();
  });

  it("should not open the primary CTA link when canOpenURL rejects", async () => {
    canOpenURLSpy.mockRejectedValue(new Error("Unsupported URL"));

    const { onPrimaryPress } = await renderAndPressPrimaryCta();

    await waitFor(() => expect(canOpenURLSpy).toHaveBeenCalledWith("https://www.ledger.com"));
    await expect(canOpenURLSpy.mock.results[0]?.value).rejects.toThrow("Unsupported URL");
    expect(openURLSpy).not.toHaveBeenCalled();
    expect(onPrimaryPress).not.toHaveBeenCalled();
  });

  it("should not trigger onPrimaryPress when openURL rejects", async () => {
    openURLSpy.mockRejectedValue(new Error("Unable to open URL"));

    const { onPrimaryPress } = await renderAndPressPrimaryCta();

    await waitFor(() => expect(openURLSpy).toHaveBeenCalledWith("https://www.ledger.com"));
    await expect(openURLSpy.mock.results[0]?.value).rejects.toThrow("Unable to open URL");
    expect(onPrimaryPress).not.toHaveBeenCalled();
  });

  it("should ignore repeated CTA presses while URL opening is in flight", async () => {
    let resolveOpenURL: (() => void) | null = null;
    openURLSpy.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveOpenURL = resolve;
        }),
    );

    const { onPrimaryPress, user } = renderLargeScreenUpsellModalContent();
    const cta = screen.getByTestId("large-screen-upsell-modal-primary-button");

    await user.press(cta);
    await user.press(cta);

    await waitFor(() => {
      expect(canOpenURLSpy).toHaveBeenCalledTimes(1);
      expect(openURLSpy).toHaveBeenCalledTimes(1);
    });
    expect(onPrimaryPress).not.toHaveBeenCalled();

    resolveOpenURL?.();

    await waitFor(() => {
      expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    { primaryButtonLabel: "", primaryButtonLink: "https://www.ledger.com" },
    { primaryButtonLabel: "   ", primaryButtonLink: "https://www.ledger.com" },
    { primaryButtonLabel: "Claim offer", primaryButtonLink: "" },
    { primaryButtonLabel: "Claim offer", primaryButtonLink: "   " },
  ] as const)("should hide the primary CTA when action config is incomplete", patch => {
    renderLargeScreenUpsellModalContent(patch);

    expect(screen.queryByTestId("large-screen-upsell-modal-primary-button")).not.toBeOnTheScreen();
  });
});
