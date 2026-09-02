import React from "react";
import { screen } from "@testing-library/react";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { renderWithStyle } from "../../../__tests__/renderWithStyle.web";
import { ContactAddressPicker } from "../ContactAddressPicker.web";
import type { ContactAddressPickerProps } from "../../../types";

const contact = mockContact({ id: "contact-ada", name: "Ada" });

const defaultProps: ContactAddressPickerProps = {
  isOpen: true,
  contact,
  onClose: jest.fn(),
  onSelectAddress: jest.fn(),
};

describe("ContactAddressPicker (Web)", () => {
  it("should render the address picker view", () => {
    renderWithStyle(<ContactAddressPicker {...defaultProps} />);

    expect(screen.getByTestId("pay-contact-address-picker")).toBeVisible();
    expect(screen.getByText("Ada")).toBeVisible();
  });
});
