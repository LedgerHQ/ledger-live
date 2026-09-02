import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { renderWithStyle } from "../../../__tests__/renderWithStyle.web";
import { ContactAddressPickerView } from "../ContactAddressPickerView.web";
import type { ContactAddressPickerProps } from "../../../types";

const contact = mockContact({ id: "contact-ada", name: "Ada" });

const defaultProps: ContactAddressPickerProps = {
  isOpen: true,
  contact,
  onClose: jest.fn(),
  onSelectAddress: jest.fn(),
};

describe("ContactAddressPickerView (Web)", () => {
  it("should render the dialog with the contact name when open", () => {
    renderWithStyle(<ContactAddressPickerView {...defaultProps} />);

    expect(screen.getByTestId("pay-contact-address-picker")).toBeVisible();
    expect(screen.getByText("Ada")).toBeVisible();
  });

  it("should not render anything when it is closed", () => {
    renderWithStyle(<ContactAddressPickerView {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("pay-contact-address-picker")).not.toBeInTheDocument();
  });

  it("should not render anything when there is no contact", () => {
    renderWithStyle(<ContactAddressPickerView {...defaultProps} contact={null} />);

    expect(screen.queryByTestId("pay-contact-address-picker")).not.toBeInTheDocument();
  });

  it("should call onClose when the dialog close button is pressed", () => {
    const onClose = jest.fn();
    renderWithStyle(<ContactAddressPickerView {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
