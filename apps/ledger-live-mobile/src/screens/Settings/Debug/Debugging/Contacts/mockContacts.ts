import { contact, contactAddress, type Contact } from "@domain/entity-contact";

type SampleContact = Readonly<{
  id: string;
  name: string;
  addressCount: number;
}>;

const SAMPLE_CONTACTS: readonly SampleContact[] = [
  { id: "contact-ada", name: "Ada", addressCount: 0 },
  { id: "contact-ben", name: "Ben", addressCount: 1 },
  { id: "contact-clara", name: "Clara", addressCount: 2 },
  { id: "contact-david", name: "David", addressCount: 3 },
  { id: "contact-elena", name: "Elena", addressCount: 1 },
  { id: "contact-felix", name: "Felix", addressCount: 2 },
  { id: "contact-gabriel", name: "Gabriel", addressCount: 0 },
  { id: "contact-hana", name: "Hana", addressCount: 1 },
  { id: "contact-iris", name: "Iris", addressCount: 2 },
  { id: "contact-jonas", name: "Jonas", addressCount: 3 },
  { id: "contact-kiara", name: "Kiara", addressCount: 1 },
  { id: "contact-liam", name: "Liam", addressCount: 2 },
  { id: "contact-maya", name: "Maya", addressCount: 0 },
  { id: "contact-nora", name: "Nora", addressCount: 1 },
  { id: "contact-olive", name: "Olive", addressCount: 2 },
  { id: "contact-pablo", name: "Pablo", addressCount: 3 },
  { id: "contact-quinn", name: "Quinn", addressCount: 1 },
  { id: "contact-rosa", name: "Rosa", addressCount: 2 },
  { id: "contact-sofia", name: "Sofia", addressCount: 0 },
  { id: "contact-theo", name: "Theo", addressCount: 1 },
  { id: "contact-uma", name: "Uma", addressCount: 2 },
  { id: "contact-victor", name: "Victor", addressCount: 3 },
  { id: "contact-xanna", name: "Xanna", addressCount: 1 },
  { id: "contact-yara", name: "Yara", addressCount: 2 },
  { id: "contact-yana", name: "\u042f\u043d\u0430", addressCount: 1 },
];

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
  return SAMPLE_CONTACTS.map(sample =>
    contact({
      id: sample.id,
      isMe: false,
      name: sample.name,
      addresses: createSampleAddresses(sample.id, sample.addressCount),
    }),
  );
}
