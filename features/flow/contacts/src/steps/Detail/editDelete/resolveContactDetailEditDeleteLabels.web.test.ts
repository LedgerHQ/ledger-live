import { resolveContactDetailEditDeleteLabels } from "./resolveContactDetailEditDeleteLabels";

describe("resolveContactDetailEditDeleteLabels", () => {
  it("maps translation keys to contact edit/delete action labels", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactDetailEditDeleteLabels({ t });

    expect(labels.actions.editContact).toBe("contacts.detailActions.editContact");
    expect(labels.signerMismatch.title).toBe("contacts.editSignerMismatch.title");
  });

  it("allows overriding platform-specific translation keys", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactDetailEditDeleteLabels({
      t,
      editContactLabelKey: "contacts.detailActions.editName",
    });

    expect(labels.actions.editContact).toBe("contacts.detailActions.editName");
  });
});
