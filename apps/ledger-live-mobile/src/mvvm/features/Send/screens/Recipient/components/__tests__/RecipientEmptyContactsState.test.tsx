import React from "react";
import { render, screen } from "@testing-library/react-native";
import { RecipientEmptyContactsState } from "../RecipientEmptyContactsState";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "send.newSendFlow.contactsWillAppear" ? "Contacts will appear here" : key,
  }),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const Container = ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
    <RN.View testID={testID}>{children}</RN.View>
  );
  const Label = ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>;

  return {
    Box: Container,
    Spot: () => null,
    Text: Label,
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => ({
  Contact: "Contact",
}));

describe("RecipientEmptyContactsState", () => {
  it("renders the empty contacts placeholder", () => {
    render(<RecipientEmptyContactsState />);

    expect(screen.getByTestId("send-recipient-empty-contacts-state")).toBeOnTheScreen();
    expect(screen.getByText("Contacts will appear here")).toBeOnTheScreen();
  });
});
