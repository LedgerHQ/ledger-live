import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SponsoredFlowHost } from "../SponsoredFlowHost";
import { SignatureOverlayHost } from "../SignatureOverlayHost";

let mockPhase: SponsoredPhase;
let mockSponsoredSelected: boolean;
let mockIsSigning: boolean;

jest.mock("../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: { phase: mockPhase } }),
  useIsSponsoredSelected: () => mockSponsoredSelected,
}));
jest.mock("../../context/SendSignatureContext", () => ({
  useSendSignature: () => ({ isSigning: mockIsSigning }),
}));
jest.mock("../../screens/SponsoredRentSignature/SponsoredRentSignatureScreen", () => ({
  SponsoredRentSignatureScreen: () => <Text>rent-signature</Text>,
}));
jest.mock("../../screens/SponsoredPolling/SponsoredPollingScreen", () => ({
  SponsoredPollingScreen: () => <Text>polling</Text>,
}));
jest.mock("../../screens/SponsoredFailure/SponsoredFailureScreen", () => ({
  SponsoredFailureScreen: () => <Text>failure</Text>,
}));
jest.mock("../../screens/Signature", () => ({
  SignatureScreen: () => <Text>transfer-signature</Text>,
}));

const renderHosts = () =>
  render(
    <>
      <SponsoredFlowHost />
      <SignatureOverlayHost />
    </>,
  );

beforeEach(() => {
  mockPhase = SPONSORED_PHASE.IDLE;
  mockSponsoredSelected = true;
  mockIsSigning = true;
});

describe("the sponsored overlay hosts", () => {
  it.each<[SponsoredPhase, string]>([
    [SPONSORED_PHASE.IDLE, "rent-signature"],
    [SPONSORED_PHASE.RENT_SIGNING, "rent-signature"],
    [SPONSORED_PHASE.POLLING, "polling"],
    [SPONSORED_PHASE.FAILED, "failure"],
    [SPONSORED_PHASE.TRANSFER, "transfer-signature"],
  ])("show only the %s screen of a sponsored send", (phase, screen) => {
    mockPhase = phase;

    const { queryAllByText } = renderHosts();

    const shown = ["rent-signature", "polling", "failure", "transfer-signature"].filter(
      text => queryAllByText(text).length > 0,
    );
    expect(shown).toEqual([screen]);
  });

  it("show the plain transfer signature when the sponsored fee isn't picked", () => {
    mockSponsoredSelected = false;

    const { queryByText } = renderHosts();

    expect(queryByText("transfer-signature")).toBeTruthy();
    expect(queryByText("rent-signature")).toBeNull();
  });

  // Only the sponsored path leaves IDLE, e.g. a gasSponsorship flip mustn't bring TX-C back mid-flow.
  it.each<[SponsoredPhase, string]>([
    [SPONSORED_PHASE.RENT_SIGNING, "rent-signature"],
    [SPONSORED_PHASE.POLLING, "polling"],
    [SPONSORED_PHASE.FAILED, "failure"],
  ])("keep the %s screen and TX-C hidden once the pick changed", (phase, screen) => {
    mockPhase = phase;
    mockSponsoredSelected = false;

    const { queryAllByText } = renderHosts();

    const shown = ["rent-signature", "polling", "failure", "transfer-signature"].filter(
      text => queryAllByText(text).length > 0,
    );
    expect(shown).toEqual([screen]);
  });

  it.each([SPONSORED_PHASE.IDLE, SPONSORED_PHASE.RENT_SIGNING])(
    "show no rent screen at %s outside a Review",
    phase => {
      mockPhase = phase;
      mockIsSigning = false;

      const { queryByText } = renderHosts();

      expect(queryByText("rent-signature")).toBeNull();
    },
  );

  it("show nothing before Review", () => {
    mockIsSigning = false;

    const { toJSON } = renderHosts();

    expect(toJSON()).toBeNull();
  });
});
