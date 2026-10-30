import { DeeplinkHandler } from "../types";

export const contactsHandler: DeeplinkHandler<"contacts"> = (_route, context) => {
  if (!context.isContactsEnabled) {
    return context.navigate("/");
  }

  context.navigate("/contacts");
};
