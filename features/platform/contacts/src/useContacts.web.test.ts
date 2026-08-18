import { selectContacts } from "@domain/entity-contact";
import { useSelector } from "react-redux";
import { useContacts } from "./useContacts";

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));

describe("useContacts", () => {
  it("selects Contacts from the Redux store", () => {
    useContacts();

    expect(useSelector).toHaveBeenCalledWith(selectContacts);
  });
});
