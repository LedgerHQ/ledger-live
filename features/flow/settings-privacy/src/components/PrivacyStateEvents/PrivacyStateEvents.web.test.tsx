import React from "react";
import { render } from "@testing-library/react";
import { Track } from "@shared/analytics-react";
import { PrivacyStateEvents } from "./PrivacyStateEvents";

jest.mock("@shared/analytics-react", () => ({ Track: jest.fn(() => null) }));

describe("PrivacyStateEvents", () => {
  it("tracks each event on update, mandatory when the event is", () => {
    render(
      <PrivacyStateEvents
        events={[
          { id: "bugReports", event: "ReportBugsEnabled" },
          { id: "analytics", event: "AnalyticsDisabled", mandatory: true },
        ]}
      />,
    );

    const props = jest.mocked(Track).mock.calls.map(([trackProps]) => trackProps);
    expect(props).toEqual([
      { onUpdate: true, event: "ReportBugsEnabled", mandatory: undefined },
      { onUpdate: true, event: "AnalyticsDisabled", mandatory: true },
    ]);
  });
});
