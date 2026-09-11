import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { resolveContactDetailEditDeleteLabels } from "./resolveContactDetailEditDeleteLabels";

describe("resolveContactDetailEditDeleteLabels", () => {
  it("maps translation keys to contact edit/delete action labels", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactDetailEditDeleteLabels({ t });

    expect(labels.actions.editContact).toBe("contacts.detailActions.editContact");
    expect(labels.rename.nameValidationErrors).toEqual({
      [INVALID_CONTACT_NAME_ERROR_NAME]: "contacts.editContact.invalidNameError",
      [DUPLICATE_CONTACT_NAME_ERROR_NAME]: "contacts.addContactDrawer.duplicateNameError",
    });
    expect(labels.signerMismatch.title).toBe("contacts.editSignerMismatch.title");
  });

  it("allows overriding platform-specific translation keys", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactDetailEditDeleteLabels({
      t,
      editContactLabelKey: "contacts.detailActions.editName",
      deleteDescriptionKey: "contacts.deleteContact.mobileDescription",
    });

    expect(labels.actions.editContact).toBe("contacts.detailActions.editName");
    expect(labels.delete.description).toBe("contacts.deleteContact.mobileDescription");
  });
});
