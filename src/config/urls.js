// @flow

export const urls = {
  faq:
    "https://support.ledgerwallet.com/hc/en-us?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=faq",
  contact:
    "https://support.ledger.com/hc/en-us/requests/new?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=contact",
  terms: "https://github.com/LedgerHQ/ledger-live-mobile/blob/master/TERMS.md",
  privacyPolicy:
    "https://shop.ledger.com/pages/privacy-policy?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=privacy",
  buyNanoX:
    "https://www.ledger.com/products/ledger-nano-x?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=manager_emptystate",
  playstore: "https://play.google.com/store/apps/details?id=com.ledger.live",
  applestore:
    "itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=1361671700&onlyLatestVersion=true&pageNumber=0&sortOrdering=1&type=Purple+Software",
  feesMoreInfo:
    "https://support.ledgerwallet.com/hc/en-us/articles/360006535873?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=fees",
  feesEthereum:
    "https://support.ledger.com/hc/en-us/articles/115005197845?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=eth_fees",
  feesPolkadot:
    "https://support.ledger.com/hc/en-us/articles/360018131220?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=dot_fees",
  verifyTransactionDetails:
    "https://support.ledger.com/hc/en-us/articles/360006444193?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=tx_device_check",
  erc20:
    "https://support.ledger.com/hc/en-us/articles/115005197845-Manage-ERC20-tokens?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=receive_erc20",
  errors: {
    PairingFailed:
      "https://support.ledger.com/hc/en-us/articles/360025864773?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=pairing_failed",
    SyncError:
      "https://support.ledger.com/hc/en-us/articles/360012109220?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=error_syncerror",
    LedgerAPIErrorWithMessage:
      "https://status.ledger.com?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=error_apierrorwithmessage",
    CosmosStargateFeb2021Warning:
      "https://support.ledger.com/hc/en-us/articles/360013713840-Cosmos-ATOM-",
    StratisDown2021Warning:
      "https://support.ledger.com/hc/en-us/articles/115005175329",
  },
  multipleAddresses:
    "https://support.ledger.com/hc/en-us/articles/360033802154?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=ops_details_change",
  delegation:
    "https://www.ledger.com/staking-tezos?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=delegation_tezos",
  appSupport:
    "https://support.ledger.com/hc/en-us/categories/115000811829-Apps?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=appsupport",
  goToManager:
    "https://support.ledger.com/hc/en-us/articles/360020436654?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=gotomanager",
  addAccount:
    "https://support.ledger.com/hc/en-us/articles/360020435654?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=add_account",
  tronStaking:
    "https://www.ledger.com/staking-tron?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=tron",
  supportLinkByTokenType: {
    erc20:
      "https://support.ledger.com/hc/en-us/articles/115005197845-Manage-ERC20-tokens?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=receive_account_flow",
    trc10:
      "https://support.ledger.com/hc/en-us/articles/360013062159?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=receive_account_flow_trc10",
    trc20:
      "https://support.ledger.com/hc/en-us/articles/360013062159?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=receive_account_flow_trc20",
    asa:
      "https://support.ledger.com/hc/en-us/articles/360015896040?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=receive_account_flow",
  },
  cosmosStaking:
    "https://www.ledger.com/staking-cosmos?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=cosmos",
  cosmosStakingRewards:
    "https://support.ledger.com/hc/en-us/articles/360014339340-Earn-Cosmos-staking-rewards?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=cosmos",
  algorandStaking:
    "https://support.ledger.com/hc/en-us/articles/360015897740?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=algorand",
  polkadotStaking:
    "https://support.ledger.com/hc/en-us/articles/360019187260?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=polkadot",
  swap: {
    info:
      "https://www.ledger.com/swap?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=swap_intro",
    learnMore:
      "https://www.ledger.com/swap?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=swap_form",
    providers: {
      changelly: {
        main: "https://changelly.com/",
        tos: "https://changelly.com/terms-of-use",
      },
    },
  },
  // Banners
  banners: {
    blackfriday:
      "https://shop.ledger.com/pages/black-friday?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    backupPack:
      "https://shop.ledger.com/products/ledger-backup-pack?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    ledgerAcademy:
      "https://www.ledger.com/academy?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
    valentine:
      "https://shop.ledger.com/pages/valentines-day-special-offers?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=banner_carousel",
  },
  compound:
    "https://support.ledger.com/hc/en-us/articles/360017215099?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=compound",
  compoundTnC:
    "https://shop.ledger.com/pages/ledger-live-terms-of-use?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=compoundTnC",
  approvedOperation:
    "https://support.ledger.com/hc/en-us/articles/115005307809-Track-your-transaction?utm_source=ledger_live_mobile&utm_medium=self_referral&utm_content=compoundTX",
  recoveryPhraseInfo:
    "https://www.ledger.com/academy/crypto/what-is-a-recovery-phrase",
  fixConnectionIssues:
    "https://support.ledger.com/hc/en-us/articles/360025864773",
  otgCable:
    "https://support.ledger.com/hc/en-us/articles/115005463729-OTG-Kit-adapters-for-your-Ledger-devices",
};
