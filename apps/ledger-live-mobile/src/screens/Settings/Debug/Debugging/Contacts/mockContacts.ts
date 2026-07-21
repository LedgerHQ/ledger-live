import { contact, contactAddress, type Contact } from "@domain/entity-contact";

const SAMPLE_CONTACT_NAMES = [
  "Ada",
  "Ben",
  "Clara",
  "David",
  "Elena",
  "Felix",
  "Gabriel",
  "Hana",
  "Iris",
  "Jonas",
  "Kiara",
  "Liam",
  "Maya",
  "Nora",
  "Olive",
  "Pablo",
  "Quinn",
  "Rosa",
  "Sofia",
  "Theo",
  "Uma",
  "Victor",
  "Xanna",
  "Yara",
  "\u042f\u043d\u0430",
] as const;

function createSampleAddresses(contactId: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    contactAddress({
      id: `${contactId}-address-${index + 1}`,
      currencyId: "ethereum",
      label: "Ethereum",
      address: `0x${String(index + 1).padStart(40, "0")}`,
    }),
  );
}

export function createContactsDebugSamples(): Contact[] {
  return SAMPLE_CONTACT_NAMES.map((name, index) => {
    const id = `contact-sample-${index + 1}`;

    return contact({
      id,
      isMe: false,
      name,
      addresses: createSampleAddresses(id, index % 4),
    });
  });
}
