import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ContactsAddContactHeaderButton } from "./ContactsAddContactHeaderButton.native";

describe("ContactsAddContactHeaderButton (Native)", () => {
  it("delegates the add-contact action", () => {
    const onPress = jest.fn();

    render(<ContactsAddContactHeaderButton addContactLabel="Add contact" onPress={onPress} />);

    fireEvent.press(screen.getByTestId("contacts-add-contact-header"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
