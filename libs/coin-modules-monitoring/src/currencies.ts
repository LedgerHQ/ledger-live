import { DerivationMode } from "@ledgerhq/types-live";

export type AccountType = "big" | "average" | "pristine";

export interface AccountInfo {
  address: string;
  xpub?: string;
  derivationMode?: DerivationMode;
}

const info: Record<string, { accounts: Partial<Record<AccountType, AccountInfo>>; skip?: string }> =
  {
    bitcoin: {
      accounts: {
        average: {
          address: "",
          xpub: "xpub6CCc6taSdhLfwHhSyrkHh1fc2CgvDAbezeM5wunWfs7tCH26ysNK8nvoyAzBTBM38NbYSFehwwnZRAYHkBB9JM3gC8eJ2n5CNJgjX7Srdse",
          derivationMode: "native_segwit",
        },
        pristine: {
          address: "",
          xpub: "xpub6BvBDx9oswQpgmpwbMi7BMU78NNYe6b9ncdmmVA1LBXirjmHxzM8zgChZiQcetvk7JZJ5AAqgYgnupnPfvenXFULotGQxQFz36P2T8XZzsE",
          derivationMode: "native_segwit",
        },
      },
    },
    ethereum: {
      accounts: {
        big: { address: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52" },
        average: { address: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3" },
        pristine: { address: "0x6895Df5ed013c85B3D9D2446c227C9AfC3813551" },
      },
    },
    solana: {
      accounts: {
        big: { address: "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S" },
        average: { address: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp" },
        pristine: { address: "Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv" },
      },
    },
  };

export default info;
