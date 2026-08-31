import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ContactNameInput } from ".";

const mockFocus = jest.fn();

// The shared Lumen passthrough renders host elements whose refs stay null, so the focus call is
// unobservable. Override just TextInput to expose a controllable imperative handle.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual<Record<string, unknown>>("@ledgerhq/lumen-ui-rnative");
  const ReactActual = jest.requireActual<typeof import("react")>("react");

  return new Proxy(actual, {
    get(target, prop) {
      if (prop !== "TextInput") {
        return target[prop as string];
      }

      return ({ ref, ...props }: { ref?: React.Ref<{ focus: () => void }> }) => {
        ReactActual.useImperativeHandle(ref, () => ({ focus: mockFocus }));
        return ReactActual.createElement("TextInput", props);
      };
    },
  });
});

describe("ContactNameInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the name field with its character count", () => {
    render(<ContactNameInput value="Ada" placeholder="Contact name" onChangeText={jest.fn()} />);

    expect(screen.getByTestId("contacts-add-contact-name-input")).toHaveProp("value", "Ada");
    expect(screen.getByPlaceholderText("Contact name")).toBeVisible();
    expect(screen.getByText("3/32")).toBeVisible();
  });

  it("should leave the field unfocused unless a host asks for focus", () => {
    render(<ContactNameInput value="" placeholder="Contact name" onChangeText={jest.fn()} />);

    expect(mockFocus).not.toHaveBeenCalled();
  });

  it("should stay unfocused while the host withholds focus, then focus once it is granted", () => {
    const { rerender } = render(
      <ContactNameInput
        value=""
        placeholder="Contact name"
        autoFocus={false}
        onChangeText={jest.fn()}
      />,
    );

    expect(mockFocus).not.toHaveBeenCalled();

    rerender(
      <ContactNameInput value="" placeholder="Contact name" autoFocus onChangeText={jest.fn()} />,
    );

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it("should surface the validation error and namespace its test ids", () => {
    render(
      <ContactNameInput
        value="Ada@1"
        placeholder="Contact name"
        errorMessage="Special characters are not allowed."
        testIDPrefix="contacts-rename-contact"
        onChangeText={jest.fn()}
      />,
    );

    expect(screen.getByTestId("contacts-rename-contact-name-error")).toHaveTextContent(
      "Special characters are not allowed.",
    );
    expect(screen.getByTestId("contacts-rename-contact-name-count")).toBeVisible();
  });
});
