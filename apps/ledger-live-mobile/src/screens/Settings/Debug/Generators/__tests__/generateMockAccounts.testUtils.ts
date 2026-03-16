import { Alert } from "react-native";

/** Regex matching a UUID v4 string (e.g. from uuid()). */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Spies on Alert.alert and mocks it to immediately invoke the "Ok" button's onPress,
 * so tests can run without showing a real alert.
 */
export function setupAlertSpy(): jest.SpyInstance {
  return jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
    const okButton = buttons?.find((b: { text?: string }) => b.text === "Ok");
    okButton?.onPress?.();
  });
}
