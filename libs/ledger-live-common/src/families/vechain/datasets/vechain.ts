import { AccountRaw } from "@ledgerhq/types-live";

// NOTE: account information is fetched from the blockchain so this is just integration for those information
// so you you should not rely on that, here the important part are ids and index

export const vechain1: AccountRaw = {
  id: "js:2:vechain:0x0fe6688548f0C303932bB197B0A96034f1d74dba:vechain",
  seedIdentifier: "0x0fe6688548f0C303932bB197B0A96034f1d74dba",
  name: "Vechain 1",
  derivationMode: "vechain",
  index: 0,
  freshAddress: "0x0fe6688548f0C303932bB197B0A96034f1d74dba",
  freshAddressPath: "44'/818'/0'/0/0",
  freshAddresses: [],
  blockHeight: 15156315,
  operations: [],
  pendingOperations: [],
  currencyId: "vechain",
  feesCurrencyId: "vechain/vip180/vtho",
  unitMagnitude: 18,
  lastSyncDate: "2023-04-21T14:22:48.395Z",
  balance: "10000000000000000000",
  subAccounts: [
    {
      type: "TokenAccountRaw",
      id: "js:2:vechain:0x0fe6688548f0C303932bB197B0A96034f1d74dba:vechain+vechain%2Fvip180%2Fvtho",
      parentId: "js:2:vechain:0x0fe6688548f0C303932bB197B0A96034f1d74dba:vechain",
      tokenId: "vechain/vip180/vtho",
      balance: "10000000000000000000",
      operations: [],
      pendingOperations: [],
    },
  ],
  swapHistory: [],
};

export const vechain2: AccountRaw = {
  id: "js:2:vechain:0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86:vechain",
  seedIdentifier: "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86",
  name: "Vechain 2",
  derivationMode: "vechain",
  index: 1,
  freshAddress: "0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86",
  freshAddressPath: "44'/818'/0'/0/1",
  freshAddresses: [],
  blockHeight: 15156315,
  operations: [],
  pendingOperations: [],
  currencyId: "vechain",
  feesCurrencyId: "vechain/vip180/vtho",
  unitMagnitude: 18,
  lastSyncDate: "2023-04-21T14:22:48.395Z",
  balance: "10000000000000000000",
  subAccounts: [
    {
      type: "TokenAccountRaw",
      id: "js:2:vechain:0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86:vechain+vechain%2Fvip180%2Fvtho",
      parentId: "js:2:vechain:0x02961B92B8D20A4ea12f1f1CeFA74Dd7B4355A86:vechain",
      tokenId: "vechain/vip180/vtho",
      balance: "0",
      operations: [],
      pendingOperations: [],
    },
  ],
  swapHistory: [],
};

// account with vtho but no vet
export const vechain3: AccountRaw = {
  id: "js:2:vechain:0xC0dFC490f8fba6A573C55a68dd9023f999ccaDA0:vechain",
  seedIdentifier: "0xC0dFC490f8fba6A573C55a68dd9023f999ccaDA0",
  name: "Vechain 3",
  derivationMode: "vechain",
  index: 1,
  freshAddress: "0xC0dFC490f8fba6A573C55a68dd9023f999ccaDA0",
  freshAddressPath: "44'/818'/0'/0/0",
  freshAddresses: [],
  blockHeight: 15156315,
  operations: [],
  pendingOperations: [],
  currencyId: "vechain",
  feesCurrencyId: "vechain/vip180/vtho",
  unitMagnitude: 18,
  lastSyncDate: "2023-11-13T13:55:32.004Z",
  balance: "0",
  subAccounts: [
    {
      type: "TokenAccountRaw",
      id: "js:2:vechain:0xC0dFC490f8fba6A573C55a68dd9023f999ccaDA0:vechain+vechain%2Fvip180%2Fvtho",
      parentId: "js:2:vechain:0xC0dFC490f8fba6A573C55a68dd9023f999ccaDA0:vechain",
      tokenId: "vechain/vip180/vtho",
      balance: "1000000000000000",
      operations: [],
      pendingOperations: [],
    },
  ],
  swapHistory: [],
};
