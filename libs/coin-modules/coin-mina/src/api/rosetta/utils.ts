import { MINA_TOKEN_ID, TESTNET_NETWORK_IDENTIFIER } from "../../consts";

export const addNetworkIdentifier = (data: any) => {
  return {
    ...TESTNET_NETWORK_IDENTIFIER,
    ...data,
  };
};

export const buildAccountIdentifier = (address: string) => {
  return {
    account_identifier: {
      address,
      metadata: {
        token_id: MINA_TOKEN_ID,
      },
    },
  };
};
