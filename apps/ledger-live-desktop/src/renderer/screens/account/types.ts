export type StakeAccountBannerParams = {
  solana?: {
    redelegate: boolean;
    delegate: boolean;
  };
  eth?: {
    kiln: boolean;
    lido: boolean;
  };
  osmos?: {
    redelegate: boolean;
    delegate: boolean;
  };
  cosmos?: {
    redelegate: boolean;
    delegate: boolean;
  };
  elrond?: {
    redelegate: boolean;
    delegate: boolean;
  };
};
