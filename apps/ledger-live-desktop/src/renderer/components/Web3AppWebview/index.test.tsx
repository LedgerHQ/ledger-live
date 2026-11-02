import React from "react";
import { render } from "@testing-library/react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Web3AppWebview } from "./index";

const mockMounted = jest.fn();
let mockDomainCheckEnabled = true;

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => ({ enabled: mockDomainCheckEnabled }),
}));

jest.mock("./WalletAPIWebview", () => ({
  WalletAPIWebview: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => mockMounted(), []);
    return null;
  },
}));

jest.mock("./PlatformAPIWebview", () => ({
  PlatformAPIWebview: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => mockMounted(), []);
    return null;
  },
}));

const makeManifest = (overrides: Partial<LiveAppManifest> = {}): LiveAppManifest =>
  ({
    id: "app",
    name: "App",
    url: "https://app.example.com",
    domains: ["https://app.example.com"],
    apiVersion: "2.0.0",
    ...overrides,
  }) as LiveAppManifest;

describe("Web3AppWebview", () => {
  beforeEach(() => {
    mockMounted.mockClear();
    mockDomainCheckEnabled = true;
  });

  it("keeps the guest when the manifest is refreshed with the same id and domains", () => {
    const { rerender } = render(<Web3AppWebview manifest={makeManifest()} />);
    rerender(<Web3AppWebview manifest={makeManifest({ name: "Renamed" })} />);

    expect(mockMounted).toHaveBeenCalledTimes(1);
  });

  it("recreates the guest when the same manifest id declares other domains", () => {
    const { rerender } = render(<Web3AppWebview manifest={makeManifest()} />);
    rerender(
      <Web3AppWebview
        manifest={makeManifest({ domains: ["https://app.example.com", "https://cdn.example.com"] })}
      />,
    );

    expect(mockMounted).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])(
    "recreates the guest when the domain check is toggled (initially %s)",
    initiallyEnabled => {
      mockDomainCheckEnabled = initiallyEnabled;
      const { rerender } = render(<Web3AppWebview manifest={makeManifest()} />);

      mockDomainCheckEnabled = !initiallyEnabled;
      rerender(<Web3AppWebview manifest={makeManifest()} />);

      expect(mockMounted).toHaveBeenCalledTimes(2);
    },
  );
});
