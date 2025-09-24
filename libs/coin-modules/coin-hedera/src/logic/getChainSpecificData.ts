import { hederaMirrorNode } from "../network/mirror";

export const getChainSpecificData = async (address: string) => {
  const mirrorAccount = await hederaMirrorNode.getAccount(address);

  return {
    hederaResources: {
      maxAutomaticTokenAssociations: mirrorAccount.max_automatic_token_associations,
      isAutoTokenAssociationEnabled: mirrorAccount.max_automatic_token_associations === -1,
    },
  };
};
