export type AccountSettingsAccount = Readonly<{
  id: string;
  type: string;
  index: number;
  currency: Readonly<{ name: string; ticker: string }>;
  xpub?: string;
  freshAddressPath: string;
  blockHeight: number;
  lastSyncDate: Date;
}>;

export type AccountSettingsAdapter<TAccount extends AccountSettingsAccount> = Readonly<{
  isNameEditDisabled: boolean;
  locale: string;
  getAccountName: (account: TAccount) => string;
  getDerivationTag: (account: TAccount) => string | undefined;
  renameAccount: (account: TAccount, name: string) => void;
}>;

export type AccountSettingsProps<TAccount extends AccountSettingsAccount> = Readonly<{
  account: TAccount;
  adapter: AccountSettingsAdapter<TAccount>;
  isOpen: boolean;
  onClose: () => void;
  testID?: string;
}>;
