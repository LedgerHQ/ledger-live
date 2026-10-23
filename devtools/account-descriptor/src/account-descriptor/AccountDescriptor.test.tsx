import React from "react";
import { render, screen } from "@testing-library/react";
import AccountDescriptor from "./AccountDescriptor";

describe("AccountDescriptor", () => {
  it("shows one row per account, a dash for a remote-only one", () => {
    render(
      <AccountDescriptor
        accounts={[
          {
            accountUUID: "uuid-1",
            legacyId: "js:2:ethereum:0xabc:",
            purpose: "account",
            type: "address",
            network: "ethereum (main)",
            path: "m/44h/60h/0h/0/0",
            key: "0xabc",
          },
          {
            accountUUID: "uuid-2",
            purpose: "mock",
            type: "utxo",
            network: "bitcoin (main)",
            path: "m/84h/0h/0h",
            key: "xpub6",
          },
        ]}
      />,
    );
    expect(screen.getByText("2 accounts")).toBeVisible();
    expect(screen.getByText("js:2:ethereum:0xabc:")).toBeVisible();
    expect(screen.getByText("xpub6")).toBeVisible();
    expect(screen.getByText("—")).toBeVisible();
    expect(screen.getByText("mock")).toHaveClass("text-warning");
    expect(screen.getByText("mock").closest("tr")).toHaveClass("bg-warning-transparent");
    expect(screen.getByText("account").closest("tr")).not.toHaveClass("bg-warning-transparent");
  });
});
