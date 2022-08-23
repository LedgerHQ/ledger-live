// @flow

const type = "testnet";
const modals = {
  rewards: "MODAL_ELROND_REWARDS_INFO",
  claim: "MODAL_ELROND_CLAIM_REWARDS",
  stake: "MODAL_ELROND_DELEGATE",
  unstake: "MODAL_ELROND_UNDELEGATE",
  withdraw: "MODAL_ELROND_WITHDRAW",
};

const constants = {
  devnet: {
    explorer: "https://devnet-explorer.elrond.com",
    providers: "https://devnet-delegation-api.elrond.com/providers",
    egldLabel: "xEGLD",
    modals,
  },
  testnet: {
    explorer: "https://testnet-explorer.elrond.com",
    providers: "https://testnet-delegation-api.elrond.com/providers",
    figment: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9lllllsf3mp40",
    egldLabel: "xEGLD",
    modals,
  },
  mainnet: {
    explorer: "https://explorer.elrond.com",
    providers: "https://delegation-api.elrond.com/providers",
    figment: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlhllllsr0pd0j",
    egldLabel: "EGLD",
    modals,
  },
}[type];

export { constants };
