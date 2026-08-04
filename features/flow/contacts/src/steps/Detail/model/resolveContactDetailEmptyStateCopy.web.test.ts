import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { ContactDetailLabels } from "../types";
import { resolveContactDetailEmptyStateCopy } from "./resolveContactDetailEmptyStateCopy";

const labels: ContactDetailLabels = {
  addAddress: "Add address",
  emptyMeTitle: "No saved addresses for you",
  emptyContactTitle: name => `No saved addresses for ${name}`,
  emptyMeDescription: "Save your wallet addresses to receive crypto by name next time.",
  emptyContactDescription: name => `Save wallet addresses to send to ${name}`,
  formatAddressCount: count => `${count} address`,
};

describe("resolveContactDetailEmptyStateCopy", () => {
  it("should resolve Me empty state copy", () => {
    expect(resolveContactDetailEmptyStateCopy(mockMeContact(), labels)).toEqual({
      title: "No saved addresses for you",
      description: "Save your wallet addresses to receive crypto by name next time.",
    });
  });

  it("should resolve saved contact empty state copy", () => {
    expect(
      resolveContactDetailEmptyStateCopy(
        mockContact({ id: "contact-benoit", name: "Benoit" }),
        labels,
      ),
    ).toEqual({
      title: "No saved addresses for Benoit",
      description: "Save wallet addresses to send to Benoit",
    });
  });
});
