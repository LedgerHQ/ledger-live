import { CosmosTransactionStatusManager } from "../cosmos/js-getTransactionStatus";

const osmosisTransactionStatusManager = new CosmosTransactionStatusManager({
  validatorOperatorAddressPrefix: "osmovaloper",
});

export default osmosisTransactionStatusManager.getTransactionStatus;
