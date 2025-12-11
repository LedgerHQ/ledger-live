export const supportLinkByTokenType = {
  erc20: "https://support.ledger.com/article/4404389645329-zd",
  trc10: "https://support.ledger.com/article/360013062159-zd",
  trc20: "https://support.ledger.com/article/360013062159-zd",
  asa: "https://support.ledger.com/article/360015896040-zd",
  spl: "https://support.ledger.com/article/7723954701469-zd",
};

const errors: Record<string, string> = {
  EthAppPleaseEnableContractData: "https://support.ledger.com/article/4405481324433-zd",
  CeloAppPleaseEnableContractData: "https://support.ledger.com/article/4405481324433-zd",
  NotEnoughGas: "https://support.ledger.com/article/9096370252573-zd",
  CantOpenDevice: "https://support.ledger.com/article/115005165269-zd",
  WrongDeviceForAccount: "https://support.ledger.com/article/360025322153-zd",
  SyncError: "https://support.ledger.com/article/360025322153-zd",
  ServiceStatusWarning: "https://status.ledger.com",
  EConnReset: "https://support.ledger.com/article/6793501085981-zd",
  TronSendTrc20ToNewAccountForbidden: "https://support.ledger.com/article/6516823445533-zd",
  TronStakingDisable: "https://support.ledger.com/article/9949980566173-zd",
  OperatingSystemOutdated: "https://support.ledger.com/article/8083692639901-zd",
  AddressesSanctionedError: "https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions",
};

export const urls = {
  ledger: "https://www.ledger.com",
  liveHome:
    "https://www.ledger.com/ledger-live?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=home",
  social: {
    twitter: "https://twitter.com/Ledger",
    github: "https://github.com/LedgerHQ/ledger-live",
    reddit: "https://www.reddit.com/r/ledgerwallet/",
    facebook: "https://www.facebook.com/Ledger/",
  },
  // Campaigns
  promoNanoX:
    "https://www.ledger.com/pages/ledger-nano-x#utm_source=Ledger%20Live%20Desktop%20App&utm_medium=Ledger%20Live&utm_campaign=Ledger%20Live%20Desktop%20-%20Banner%20LNX",
  // Ledger support
  faq: "https://support.ledger.com",
  mevProtection:
    "https://support.ledger.com/article/How-to-protect-your-transactions-from-Maximal-Extractable-Value-MEV-attacks",
  chatbot: "https://ledgercustomersuccess.my.salesforce-sites.com/fullscreenbot",
  ledgerStatus: "https://status.ledger.com/",
  syncErrors: "https://support.ledger.com/article/360012207759-zd",
  terms:
    "https://shop.ledger.com/pages/ledger-live-terms-of-use?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=terms",
  buyNew:
    "https://shop.ledger.com/pages/hardware-wallets-comparison?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=onboarding",
  reborn:
    "https://shop.ledger.com/pages/unlock-ledger-wallet-desktop?utm_source=ledger_wallet_destkop&utm_medium=self_referral&utm_content=onboarding-2",
  noDevice: {
    learnMore:
      "https://www.ledger.com?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=onboarding",
    learnMoreCrypto:
      "https://www.ledger.com/academy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=onboarding",
  },
  managerHelpRequest: "https://support.ledger.com/article/4404382258961-zd",
  contactSupport: "https://support.ledger.com/",
  contactSupportWebview: "https://support.ledger.com/article/4423020306705-zd",
  whatIsARecoveryPhrase: "https://www.ledger.com/academy/crypto/what-is-a-recovery-phrase",
  feesMoreInfo: "https://support.ledger.com/article/360021039173-zd",
  feesEIP1559MoreInfo: "https://support.ledger.com/article/6018110754845-zd",
  feesTron: "https://support.ledger.com/article/6331588714141-zd",
  recipientAddressInfo: "https://support.ledger.com/article/4404389453841-zd",
  managerAppLearnMore: "https://support.ledger.com/",
  privacyPolicy:
    "https://www.ledger.com/privacy-policy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=privacy",
  trackingPolicy:
    "https://shop.ledger.com/pages/ledger-live-tracking-policy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=privacy",
  troubleshootingUSB: "https://support.ledger.com/article/115005165269-zd",
  troubleshootingCrash: "https://support.ledger.com/article/360012598060-zd",
  appSupport: "https://support.ledger.com/topic?topic=crypto-assets",
  coinControl: "https://support.ledger.com/article/360015996580-zd",
  githubIssues:
    "https://github.com/LedgerHQ/ledger-live/issues?q=is%3Aissue+is%3Aopen+label%3Abug+sort%3Acomments-desc",
  multipleDestinationAddresses: "https://support.ledger.com/article/360033802154-zd",
  updateDeviceFirmware: {
    nanoS: "https://support.ledger.com/article/360002731113-zd",
    nanoSP: "https://support.ledger.com/article/4445777839901-zd",
    nanoX: "https://support.ledger.com/article/360013349800-zd",
    blue: "https://support.ledger.com/article/360005885733-zd",
  },
  lostPinOrSeed: {
    nanoS: "https://support.ledger.com/article/4404382075537-zd",
    nanoSP: "https://support.ledger.com/article/4404382075537-zd",
    nanoX: "https://support.ledger.com/article/4404382075537-zd",
    blue: "https://support.ledger.com/article/4404382075537-zd",
  },
  maxSpendable: "https://support.ledger.com/article/360012960679-zd",
  stakingEthereum:
    "https://www.ledger.com/staking/staking-ethereum?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=ethereum",
  stakingCosmos:
    "https://www.ledger.com/staking/staking-cosmos?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=cosmos",
  stakingTron:
    "https://www.ledger.com/staking/staking-tron?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=tron",
  stakingTezos:
    "https://www.ledger.com/staking/staking-tezos?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=tezos",
  stakingPolkadot: "https://support.ledger.com/article/360018131260-zd",
  cardanoStakingRewards: "https://support.ledger.com/article/7880073204253-zd",
  algorandStakingRewards: "https://support.ledger.com/article/360015897740-zd",
  nearStakingRewards: "https://support.ledger.com/article/360020450619-zd",
  // TODO: change to LL sui link
  suiStakingRewards: "",
  polkadotFeesInfo: "https://support.ledger.com/article/360016289919-zd",
  multiversxStaking: "https://support.ledger.com/article/7228337345693-zd",
  xpubLearnMore: "https://support.ledger.com/article/360011069619-zd",
  ledgerValidator: "https://www.ledger.com/staking",
  // Banners
  banners: {
    blackfriday:
      "https://shop.ledger.com/pages/black-friday?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    familyPack:
      "https://shop.ledger.com/products/ledger-nano-s-3pack?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    ledgerAcademy:
      "https://www.ledger.com/academy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    ongoingScams:
      "https://www.ledger.com/ongoing-phishing-campaigns?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    valentine:
      "https://shop.ledger.com/pages/valentines-day-special-offers?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    polkaStake:
      "https://www.ledger.com/staking-polkadot?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=banner_carousel",
    twitterIntent: "https://twitter.com/intent/tweet",
  },
  helpModal: {
    gettingStarted:
      "https://www.ledger.com/start?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=help_modal",
    helpCenter: "https://support.ledger.com/",
    ledgerAcademy:
      "https://www.ledger.com/academy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=help_modal",
    status:
      "https://status.ledger.com?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=help_modal",
  },
  swap: {
    info: "https://www.ledger.com/swap?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=swap_intro",
    learnMore:
      "https://www.ledger.com/swap?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=swap_footer",
  },
  exchange: {
    learnMore:
      "https://www.ledger.com/academy/benefits-of-buying-crypto-through-ledger-live?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=exchange",
  },
  platform: {
    developerPage:
      "https://developers.ledger.com?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=catalog",
  },
  // Errors
  errors,
  approvedOperation: "https://support.ledger.com/article/360020849134-zd",
  cryptoOrg: {
    website: "https://cronos-pos.org",
  },
  multiversx: {
    website: "https://multiversx.com",
  },
  figment: {
    website: "https://www.figment.io",
  },
  solana: {
    staking: "https://support.ledger.com/article/4731749170461-zd",
    splTokenInfo:
      "https://support.ledger.com/article/Verify-Solana-Address-from-Token-Account-Address",
    splTokenExtensions: "https://support.ledger.com/article/Solana-Token-Extensions",
    recipient_info: "https://support.ledger.com",
    ledgerByChorusOneTC: "https://chorus.one/tos",
    ledgerByFigmentTC:
      "https://cdn.figment.io/legal/Current%20Ledger_Online%20Staking%20Delgation%20Services%20Agreement.pdf",
  },
  aptos: {
    staking: "https://support.ledger.com/article/5961622776861-zd",
  },
  hedera: {
    supportArticleLink: "https://support.ledger.com/article/4494505217565-zd",
    tokenAssociation:
      "https://support.ledger.com/article/How-to-manage-Hedera-tokens-with-Ledger-Live",
    evmAddressVerification: "https://ledger.com/e14",
    staking: "https://support.ledger.com/article/Staking-Hedera-HBAR-through-Ledger-Live",
  },
  celo: {
    ledgerByFigmentTC:
      "https://cdn.figment.io/legal/Current%20Ledger_Online%20Staking%20Delgation%20Services%20Agreement.pdf",
    learnMore: "https://support.ledger.com/article/360020499920-zd",
  },
  editEvmTx: {
    learnMore: "https://support.ledger.com/article/9756122596765-zd",
  },
  ledgerAcademy: {
    whatIsEthereumRestaking: "https://www.ledger.com/academy/what-is-ethereum-restaking",
    ethereumStakingHowToStakeEth:
      "https://www.ledger.com/academy/ethereum-staking-how-to-stake-eth",
  },
  ledgerByFigmentTC:
    "https://cdn.figment.io/legal/Current%20Ledger_Online%20Staking%20Delgation%20Services%20Agreement.pdf",
  ens: "https://support.ledger.com/article/9710787581469-zd",
  ledgerLiveMobile: {
    appStore: "https://apps.apple.com/app/id1361671700",
    playStore: "https://play.google.com/store/apps/details?id=com.ledger.live",
  },
  howToUpdateNewLedger: "https://support.ledger.com/article/9305992683165-zd",
  genuineCheck: "https://support.ledger.com/article/4404389367057-zd",
  ledgerShop:
    "https://shop.ledger.com?utm_source=live&utm_medium=draw&utm_campaign=ledger_sync_lns_uncompatible&utm_content=to_shop",
  learnMoreLedgerSync:
    "https://www.ledger.com/blog-ledger-sync-synchronize-your-crypto-accounts-effortless-private-and-secure",
  charonLearnMore: "https://shop.ledger.com/products/ledger-recovery-key",

  // Node errors
  txBroadcastErrors: {
    badTxns: "https://support.ledger.com/article/5129526865821-zd",
    blobsLimit: "https://support.ledger.com/article/17830974229661-zd",
    txnMempoolConflict: "https://support.ledger.com/article/14593285242525-zd",
  },
  memoTag: {
    learnMore: "https://support.ledger.com/article/4409603715217-zd",
  },
  geoBlock: {
    learnMore: "https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions",
  },
  sanctionCompliance: {
    learnMore: "https://support.ledger.com/article/Why-Ledger-Complies-with-Sanctions",
  },
  canton: {
    learnMore: "https://support.ledger.com/article/Canton-Network",
  },
  aleo: {
    viewKeyLearnMore: "", // TODO: Add Ledger support article for Aleo view keys
  },
};

export const vaultSigner = {
  help: "https://help.vault.ledger.com/developer-portal/content/signer/overview",
};
