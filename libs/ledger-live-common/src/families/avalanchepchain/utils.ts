export const FIGMENT_AVALANCHE_VALIDATOR_NODES = [
  "NodeID-GW7CvXwkPFDsfFHrix1SA148NHF5ZnSXs",
  "NodeID-CRg2AxBCkLjY6T7oiS7ijrCFsdAVmPNuY",
];

export const isDefaultValidatorNode = (nodeID: string): boolean =>
  FIGMENT_AVALANCHE_VALIDATOR_NODES.includes(nodeID);

// export const AVAX_MINIMUM_STAKE_AMOUNT = 25000000000; //mainnet
export const AVAX_MINIMUM_STAKE_AMOUNT = 1000000000; //fuji testnet
