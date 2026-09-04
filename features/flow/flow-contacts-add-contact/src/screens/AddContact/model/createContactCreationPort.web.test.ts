import { addContact } from "@domain/entity-contact";
import { createContactCreationPort } from "./createContactCreationPort";

describe("createContactCreationPort", () => {
  it("should create a non-me contact with a prefixed generated id and dispatch it", async () => {
    const dispatch = jest.fn();
    const creation = createContactCreationPort({ dispatch, generateId: () => "ada" });

    const created = await creation.createContact({ name: "Ada" });

    expect(created).toMatchObject({ id: "contact-ada", isMe: false, name: "Ada", addresses: [] });
    expect(dispatch).toHaveBeenCalledWith(addContact(created));
  });
});
