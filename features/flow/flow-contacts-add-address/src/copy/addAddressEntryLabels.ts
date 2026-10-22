export type AddAddressEntryLabels = Readonly<{
  title: string;
  addressPlaceholder: string;
  confirmAddress: string;
  validatingAddress: string;
  validAddress: string;
  invalidAddress: string;
  domainNotFound: string;
  sanctionedAddress: string;
  validationUnavailable: string;
  ensDisclaimer: string;
  ensDisclaimerDescription: string;
  duplicateAddress: (contactName: string) => string;
}>;
