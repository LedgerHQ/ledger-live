import React, { FormEvent, useCallback, useState } from "react";
import { Button, TextInput } from "@ledgerhq/lumen-ui-react";
import {
  contact,
  getContactNameValidationError,
  INVALID_CONTACT_NAME_ERROR_NAME,
  isValidContactName,
  parseContactName,
  type Contact,
  type ContactNameValidationErrorName,
} from "@domain/entity-contact";

export type ContactCreationResult =
  | { contact: Contact; validationError: null }
  | { contact: null; validationError: ContactNameValidationErrorName };

export function createContact(
  contacts: readonly Contact[],
  draftName: string,
): ContactCreationResult {
  const existingNames = contacts.map(({ name }) => name);
  const validationError = getContactNameValidationError(draftName, existingNames);

  if (!isValidContactName(draftName, existingNames)) {
    return {
      contact: null,
      validationError: validationError ?? INVALID_CONTACT_NAME_ERROR_NAME,
    };
  }

  return {
    contact: contact({
      id: crypto.randomUUID(),
      isMe: false,
      name: parseContactName(draftName, existingNames),
      addresses: [],
    }),
    validationError: null,
  };
}

const errorMessageByName: Record<ContactNameValidationErrorName, string> = {
  InvalidContactNameError: "Enter a valid contact name.",
  DuplicateContactNameError: "A contact with this name already exists.",
};

type ContactsSyncProps = Readonly<{
  contacts: readonly Contact[];
  onCreate: (_: string) => ContactCreationResult;
}>;

export function ContactsSync({ contacts, onCreate }: ContactsSyncProps) {
  const [draftName, setDraftName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = onCreate(draftName);

      if (result.contact === null) {
        setFeedback(errorMessageByName[result.validationError]);
        setHasError(true);
        return;
      }

      setDraftName("");
      setFeedback(`Created ${result.contact.name}.`);
      setHasError(false);
    },
    [draftName, onCreate],
  );

  return (
    <section className="mx-16 my-10 border-t border-base pt-16" aria-labelledby="contacts-title">
      <h3 id="contacts-title" className="heading-5 mb-12 text-base">
        Contacts
      </h3>
      {contacts.length === 0 ? (
        <p className="body-2 text-muted">No contacts.</p>
      ) : (
        <ul className="m-0 mb-16 list-none p-0">
          {contacts.map(item => (
            <li
              key={item.id}
              className="flex items-center justify-between border-b border-base py-8"
            >
              <span className="body-2-semi-bold">{item.name}</span>
              <span className="body-3 text-muted">
                {item.isMe
                  ? "Me"
                  : `${item.addresses.length} ${
                      item.addresses.length === 1 ? "address" : "addresses"
                    }`}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-8">
        <TextInput
          label="Contact name"
          value={draftName}
          onChange={event => setDraftName(event.target.value)}
          className="min-w-240 flex-1"
        />
        <Button size="sm" type="submit">
          Create contact
        </Button>
      </form>
      {feedback ? (
        <output
          className={hasError ? "mt-8 text-error body-2" : "mt-8 text-success body-2"}
          role={hasError ? "alert" : "status"}
        >
          {feedback}
        </output>
      ) : null}
    </section>
  );
}
