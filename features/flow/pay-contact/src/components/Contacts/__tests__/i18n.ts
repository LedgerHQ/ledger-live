import type { I18nTestProviderProps } from "@shared/i18n/testing";

export type I18nResources = I18nTestProviderProps["resources"];

export const CONTACTS_RESOURCES: I18nResources = {
  en: {
    translation: {
      payTab: {
        contacts: {
          title: "Pay contact",
          pay: "Pay",
          empty: {
            info: "You don’t have contact yet",
            addContact: "Add contact",
          },
          table: {
            name: "Name",
            addresses: "Addresses",
            transactions: "Transactions",
            transactionCount_zero: "No transaction",
            transactionCount_one: "{{count}} transaction",
            transactionCount_other: "{{count}} transactions",
          },
          actions: {
            pay: "Send to contact",
            more: "More options",
            viewContact: "View contact",
            viewTransactions: "View transactions",
          },
        },
      },
    },
  },
};
