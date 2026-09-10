import { resolveContactAddressDetailActionsLabels } from "./resolveContactAddressDetailActionsLabels";

describe("resolveContactAddressDetailActionsLabels", () => {
  it("maps translation keys to address detail action labels", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactAddressDetailActionsLabels({ t });

    expect(labels.delete.title).toBe("contacts.deleteAddress.title");
    expect(labels.signerMismatch.title).toBe("contacts.editSignerMismatch.title");
  });
});
