import React, { useMemo } from "react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "LLM/components/Navigation";
import { ContactsScreen } from "LLM/features/Contacts";

const Stack = createLumenNativeStackNavigator();

function ContactsTestApp() {
  const { theme } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <Stack.Navigator screenOptions={stackNavigationConfig}>
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ headerShown: true, title: "Contacts", ...stackNavigationConfig }}
      />
    </Stack.Navigator>
  );
}

describe("Contacts add contact drawer integration", () => {
  it("should save a contact from the empty-list CTA with the actual Contacts page", async () => {
    const { user } = render(<ContactsTestApp />, {
      overrideInitialState: withFlagOverrides(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          contacts: { contacts: [mockMeContact()] },
        }),
      ),
    });

    await waitFor(() => {
      expect(screen.getByTestId("contacts-screen")).toBeVisible();
      expect(screen.getByTestId("contacts-add-contact-row")).toBeVisible();
    });

    await user.press(screen.getByTestId("contacts-add-contact-row"));
    await user.type(screen.getByTestId("contacts-add-contact-name-input"), "Ada");
    await user.press(screen.getByRole("button", { name: "Confirm name" }));

    await waitFor(() => {
      expect(screen.getByText("Ada")).toBeVisible();
      expect(screen.queryByTestId("contacts-add-contact-row")).toBeNull();
      expect(screen.queryByTestId("contacts-add-contact-name-input")).toBeNull();
    });
  });

  it("should add a contact from the header and restore the unfiltered list", async () => {
    const me = mockMeContact();
    const ben = mockContact({ id: "contact-ben", name: "Ben" });
    const { user } = render(<ContactsTestApp />, {
      overrideInitialState: withFlagOverrides(
        { lwmContacts: { enabled: true, params: { newBadge: false } } },
        state => ({
          ...state,
          contacts: { contacts: [me, ben] },
        }),
      ),
    });

    await waitFor(() => {
      expect(screen.getByTestId("contacts-add-contact-header")).toBeVisible();
    });

    fireEvent.changeText(screen.getByTestId("contacts-search-input"), "Unknown");

    await waitFor(() => {
      expect(screen.getByTestId("contacts-search-no-results")).toBeVisible();
      expect(screen.getByTestId("contacts-add-contact-header")).toBeEnabled();
    });

    await user.press(screen.getByTestId("contacts-add-contact-header"));
    await user.type(screen.getByTestId("contacts-add-contact-name-input"), "Ada");
    await user.press(screen.getByRole("button", { name: "Confirm name" }));

    await waitFor(() => {
      expect(screen.getByTestId("contacts-search-input")).toHaveProp("value", "");
      expect(screen.getByText("Ada")).toBeVisible();
      expect(screen.getByText("Ben")).toBeVisible();
      expect(screen.queryByTestId("contacts-add-contact-name-input")).toBeNull();
    });
  });
});
