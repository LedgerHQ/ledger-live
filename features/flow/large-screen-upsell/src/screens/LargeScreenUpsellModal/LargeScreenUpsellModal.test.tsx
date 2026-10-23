import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LargeScreenUpsellModal, type LargeScreenUpsellModalProps } from "./LargeScreenUpsellModal";
import { useLargeScreenUpsellModalViewModel } from "./useLargeScreenUpsellModalViewModel";
import type { LargeScreenUpsellModalViewModel } from "./types";

jest.mock("./useLargeScreenUpsellModalViewModel", () => ({
  useLargeScreenUpsellModalViewModel: jest.fn(),
}));
jest.mock("./LargeScreenUpsellModalView.web", () => ({
  LargeScreenUpsellModalView: ({ title }: LargeScreenUpsellModalViewModel) => <p>{title}</p>,
}));

const mockUseViewModel = jest.mocked(useLargeScreenUpsellModalViewModel);

const props: LargeScreenUpsellModalProps = {
  seenNanoModelIds: ["nanoS"],
  hasSeenTouchscreenDevice: false,
  onboardingDate: null,
  variant: "opted_in",
  medium: "desktop",
  theme: "light",
  t: key => key,
  openUrl: jest.fn(),
};

function viewModel(isOpen: boolean): LargeScreenUpsellModalViewModel {
  return {
    isOpen,
    imageSrc: "hero.webp",
    title: "Upgrade your device",
    subtitle: "Get a larger screen",
    primaryButtonLabel: "Learn more",
    onDismiss: jest.fn(),
    onCtaPress: jest.fn(),
  };
}

describe("LargeScreenUpsellModal", () => {
  it("should render the view with the view model when the modal is open", () => {
    mockUseViewModel.mockReturnValue(viewModel(true));

    expect(renderToStaticMarkup(<LargeScreenUpsellModal {...props} />)).toBe(
      "<p>Upgrade your device</p>",
    );
    expect(mockUseViewModel).toHaveBeenCalledWith(props);
  });

  it("should render nothing when the modal is closed", () => {
    mockUseViewModel.mockReturnValue(viewModel(false));

    expect(renderToStaticMarkup(<LargeScreenUpsellModal {...props} />)).toBe("");
  });
});
