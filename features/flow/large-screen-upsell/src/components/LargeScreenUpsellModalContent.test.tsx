import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LargeScreenUpsellModalContent } from "./LargeScreenUpsellModalContent";

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

const baseProps = {
  imageSrc: "hero.webp",
  title: "Upgrade your device",
  subtitle: "Get a larger screen",
  primaryButtonLabel: "Learn more",
  onCtaPress: jest.fn(),
};

describe("LargeScreenUpsellModalContent", () => {
  it("should render the hero image, copy and primary button", () => {
    const markup = renderToStaticMarkup(<LargeScreenUpsellModalContent {...baseProps} />);

    expect(markup).toContain('src="hero.webp"');
    expect(markup).toContain("Upgrade your device");
    expect(markup).toContain("Get a larger screen");
    expect(markup).toContain("<button>Learn more</button>");
  });

  it("should render a placeholder instead of the hero image when there is no image", () => {
    const markup = renderToStaticMarkup(
      <LargeScreenUpsellModalContent {...baseProps} imageSrc="" />,
    );

    expect(markup).not.toContain("<img");
    expect(markup).toContain('aria-hidden="true"');
  });

  it("should hide the primary button when its label is blank", () => {
    const markup = renderToStaticMarkup(
      <LargeScreenUpsellModalContent {...baseProps} primaryButtonLabel="  " />,
    );

    expect(markup).not.toContain("<button");
  });
});
