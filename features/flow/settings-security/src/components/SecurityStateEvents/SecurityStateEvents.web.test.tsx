import React from "react";
import { render } from "@testing-library/react";
import { Track } from "@shared/analytics-react";
import { SecurityStateEvents } from "./SecurityStateEvents";

jest.mock("@shared/analytics-react", () => ({ Track: jest.fn(() => null) }));

describe("SecurityStateEvents", () => {
  it("tracks each event on update", () => {
    render(
      <SecurityStateEvents
        events={[
          { id: "appLock", event: "PasswordEnabled" },
          { id: "mevProtection", event: "mev_activated" },
        ]}
      />,
    );

    const props = jest.mocked(Track).mock.calls.map(([trackProps]) => trackProps);
    expect(props).toEqual([
      { onUpdate: true, event: "PasswordEnabled" },
      { onUpdate: true, event: "mev_activated" },
    ]);
  });
});
