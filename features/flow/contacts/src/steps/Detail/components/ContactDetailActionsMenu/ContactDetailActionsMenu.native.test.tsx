import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nTestProvider, type I18nTestProviderProps } from "@shared/i18n/testing";
import { ContactDetailActionsMenu } from "./ContactDetailActionsMenu.native";

const resources: I18nTestProviderProps["resources"] = {
  en: {
    translation: {
      contacts: {
        detailActions: {
          editName: "Edit name",
          deleteContact: "Delete contact",
        },
      },
    },
  },
};

const defaultProps = {
  isOpen: true,
  canDelete: true,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

function renderMenu(
  props: React.ComponentProps<typeof ContactDetailActionsMenu>,
): ReturnType<typeof render> {
  return render(
    <I18nTestProvider resources={resources}>
      <ContactDetailActionsMenu {...props} />
    </I18nTestProvider>,
  );
}

describe("ContactDetailActionsMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render edit and delete actions when delete is allowed", () => {
    renderMenu(defaultProps);

    expect(screen.getByTestId("contacts-detail-actions-menu")).toBeVisible();
    expect(screen.getByTestId("contacts-detail-edit-action")).toHaveTextContent("Edit name");
    expect(screen.getByTestId("contacts-detail-delete-action")).toHaveTextContent("Delete contact");
  });

  it("should hide the delete action for Me contacts", () => {
    renderMenu({ ...defaultProps, canDelete: false });

    expect(screen.getByTestId("contacts-detail-edit-action")).toBeVisible();
    expect(screen.queryByTestId("contacts-detail-delete-action")).toBeNull();
  });

  it("should not render menu content when closed", () => {
    renderMenu({ ...defaultProps, isOpen: false });

    expect(screen.queryByTestId("contacts-detail-actions-menu")).toBeNull();
  });

  it("should call action handlers when menu items are pressed", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    renderMenu({ ...defaultProps, onEdit, onDelete });

    fireEvent.press(screen.getByTestId("contacts-detail-edit-action"));
    fireEvent.press(screen.getByTestId("contacts-detail-delete-action"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
