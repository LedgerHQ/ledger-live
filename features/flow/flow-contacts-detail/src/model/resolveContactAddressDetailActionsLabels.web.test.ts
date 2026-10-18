import { resolveContactAddressDetailActionsLabels } from "./resolveContactAddressDetailActionsLabels";

describe("resolveContactAddressDetailActionsLabels", () => {
  it("maps translation keys to the signer mismatch labels", () => {
    const t = jest.fn((key: string) => key);

    const labels = resolveContactAddressDetailActionsLabels({ t });

    expect(labels.signerMismatch.title).toBe("contacts.editSignerMismatch.title");
  });
});
