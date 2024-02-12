export const supportLinkByTokenType = {
  erc20:
    "https://support.ledger.com/hc/articles/4404389645329-Manage-ERC20-tokens?docs=true&utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=receive_account_flow",
  trc10:
    "https://support.ledger.com/hc/articles/360013062159?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=receive_account_flow",
  trc20:
    "https://support.ledger.com/hc/articles/360013062159?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=receive_account_flow",
  asa: "https://support.ledger.com/hc/articles/360015896040?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=receive_account_flow",
  nfts: "https://support.ledger.com/hc/articles/4404389453841-Receive-crypto-assets?utm_medium=self_referral&utm_content=receive_account_flow",
};

const errors: Record<string, string> = {
  EthAppPleaseEnableContractData: "https://support.ledger.com/hc/articles/4405481324433?docs=true",
  NotEnoughGas: "https://support.ledger.com/hc/articles/9096370252573?support=true",
  CantOpenDevice:
    "https://support.ledger.com/hc/articles/115005165269?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=error_cantopendevice",
  WrongDeviceForAccount:
    "https://support.ledger.com/hc/articles/360025322153-Wrong-private-keys-for-account?support=true",
  SyncError:
    "https://support.ledger.com/hc/articles/360012207759-Solve-a-synchronization-error?support=true",
  ServiceStatusWarning: "https://status.ledger.com",
  EConnReset:
    "https://support.ledger.com/hc/articles/6793501085981?support=true&utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=error_connect_manager",
  TronSendTrc20ToNewAccountForbidden:
    "https://support.ledger.com/hc/articles/6516823445533--Sending-TRC20-to-a-new-account-won-t-activate-it-message-in-Ledger-Live?support=true",
  TronStakingDisable: "https://support.ledger.com/hc/articles/9949980566173?support=true",
  OperatingSystemOutdated: "https://support.ledger.com/hc/articles/8083692639901?support=true",
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
  satstacks: {
    download: "https://github.com/ledgerhq/satstack/releases/latest",
    learnMore: "https://support.ledger.com/hc/articles/360017551659",
  },
  // Campaigns
  promoNanoX:
    "https://www.ledger.com/pages/ledger-nano-x#utm_source=Ledger%20Live%20Desktop%20App&utm_medium=Ledger%20Live&utm_campaign=Ledger%20Live%20Desktop%20-%20Banner%20LNX",
  // Ledger support
  faq: "https://support.ledger.com/hc/categories/4404369571601-Support?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=faq",
  ledgerStatus: "https://status.ledger.com/",
  syncErrors:
    "https://support.ledger.com/hc/articles/360012207759?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=error_syncerror",
  terms:
    "https://shop.ledger.com/pages/ledger-live-terms-of-use?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=terms",
  buyNew:
    "https://shop.ledger.com/pages/hardware-wallets-comparison?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=onboarding",
  noDevice: {
    learnMore:
      "https://www.ledger.com?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=onboarding",
    learnMoreCrypto:
      "https://www.ledger.com/academy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=onboarding",
  },
  managerHelpRequest:
    "https://support.ledger.com/hc/articles/4404382258961-Install-uninstall-and-update-apps?docs=true&utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=manager_hanging",
  contactSupport:
    "https://support.ledger.com/hc/requests/new?ticket_form_id=248165?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=support_contact",
  contactSupportWebview:
    "https://support.ledger.com/hc/articles/4423020306705-Contact-Us?support=true",
  whatIsARecoveryPhrase: "https://www.ledger.com/academy/crypto/what-is-a-recovery-phrase",
  feesMoreInfo: "https://support.ledger.com/hc/articles/360021039173-Choose-network-fees?docs=true",
  feesEIP1559MoreInfo: "https://support.ledger.com/hc/articles/6018110754845?docs=true",
  recipientAddressInfo:
    "https://support.ledger.com/hc/articles/4404389453841-Receive-crypto-assets?docs=true",
  managerAppLearnMore: "https://support.ledger.com/hc/categories/4404376139409?docs=true",
  privacyPolicy:
    "https://www.ledger.com/privacy-policy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=privacy",
  troubleshootingUSB:
    "https://support.ledger.com/hc/articles/115005165269?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=error",
  troubleshootingCrash:
    "https://support.ledger.com/hc/articles/360012598060?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=error",
  appSupport: "https://support.ledger.com/hc/sections/4404369637521-Crypto-assets?docs=true",
  coinControl:
    "https://support.ledger.com/hc/articles/360015996580?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=send_coincontrol",
  githubIssues:
    "https://github.com/LedgerHQ/ledger-live/issues?q=is%3Aissue+is%3Aopen+label%3Abug+sort%3Acomments-desc",
  multipleDestinationAddresses:
    "https://support.ledger.com/hc/articles/360033802154-Change-addresses?support=true",
  updateDeviceFirmware: {
    nanoS:
      "https://support.ledger.com/hc/articles/360002731113?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=firmwareupdate",
    nanoSP:
      "https://support.ledger.com/hc/articles/4445777839901?&utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=firmwareupdate",
    nanoX:
      "https://support.ledger.com/hc/articles/360013349800?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=firmwareupdate",
    blue: "https://support.ledger.com/hc/articles/360005885733?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=firmwareupdate",
  },
  lostPinOrSeed: {
    nanoS:
      "https://support.ledger.com/hc/articles/4404382075537-Don-t-have-your-Recovery-phrase-?support=true",
    nanoSP:
      "https://support.ledger.com/hc/articles/4404382075537-Don-t-have-your-Recovery-phrase-?support=true",
    nanoX:
      "https://support.ledger.com/hc/articles/4404382075537-Don-t-have-your-Recovery-phrase-?support=true",
    blue: "https://support.ledger.com/hc/articles/4404382075537-Don-t-have-your-Recovery-phrase-?support=true",
  },
  maxSpendable:
    "https://support.ledger.com/hc/articles/360012960679?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=max_spendable_alert",
  stakingEthereum:
    "https://www.ledger.com/staking/staking-ethereum?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=ethereum",
  stakingCosmos:
    "https://www.ledger.com/staking/staking-cosmos?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=cosmos",
  stakingTron:
    "https://www.ledger.com/staking/staking-tron?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=tron",
  stakingTezos:
    "https://www.ledger.com/staking/staking-tezos?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=tezos",
  stakingPolkadot:
    "https://support.ledger.com/hc/articles/360018131260?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=polkadot",
  cardanoStakingRewards: "https://support.ledger.com/hc/articles/7880073204253?docs=true",
  algorandStakingRewards:
    "https://support.ledger.com/hc/articles/360015897740?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=algorand",
  nearStakingRewards: "https://support.ledger.com/hc/articles/360020450619-NEAR-NEAR-?docs=true",
  polkadotFeesInfo:
    "https://support.ledger.com/hc/articles/360016289919?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=polkadot",
  elrondStaking: "https://support.ledger.com/hc/articles/7228337345693?support=true",
  xpubLearnMore:
    "https://support.ledger.com/hc/articles/360011069619?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=edit_account",
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
    helpCenter:
      "https://support.ledger.com/hc?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=help_modal",
    ledgerAcademy:
      "https://www.ledger.com/academy?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=help_modal",
    status:
      "https://status.ledger.com?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=help_modal",
  },
  swap: {
    info: "https://www.ledger.com/swap?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=swap_intro",
    learnMore:
      "https://www.ledger.com/swap?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=swap_footer",
    providers: {
      changelly: {
        main: "https://changelly.com/",
        tos: "https://changelly.com/terms-of-use",
        support: "https://support.changelly.com/en/support/tickets/new",
      },
      cic: {
        main: "https://criptointercambio.com/",
        tos: "https://criptointercambio.com/terms-of-use",
        support: "https://criptointercambio.com/en/about",
      },
    },
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
  approvedOperation:
    "https://support.ledger.com/hc/articles/360020849134-Track-your-transaction?docs=true",
  cryptoOrg: {
    website: "https://cronos-pos.org",
  },
  elrond: {
    website: "https://elrond.com",
  },
  figment: {
    website: "https://www.figment.io",
  },
  solana: {
    staking: "https://support.ledger.com/hc/articles/4731749170461?docs=true",
    recipient_info: "https://support.ledger.com",
    ledgerByFigmentTC:
      "https://cdn.figment.io/legal/Current%20Ledger_Online%20Staking%20Delgation%20Services%20Agreement.pdf",
  },
  hedera: {
    supportArticleLink:
      "https://support.ledger.com/hc/articles/4494505217565-Create-a-Ledger-Hedera-HBAR-account-via-HashPack?docs=true",
  },
  celo: {
    ledgerByFigmentTC:
      "https://cdn.figment.io/legal/Current%20Ledger_Online%20Staking%20Delgation%20Services%20Agreement.pdf",
    learnMore:
      "https://support.ledger.com/hc/articles/360020499920-Celo-CELO-?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=celo",
  },
  editEvmTx: {
    learnMore: "https://support.ledger.com/hc/articles/9756122596765?support=true",
  },
  ledgerByFigmentTC:
    "https://cdn.figment.io/legal/Current%20Ledger_Online%20Staking%20Delgation%20Services%20Agreement.pdf",
  ens: "https://support.ledger.com/hc/articles/9710787581469?docs=true",
  ledgerLiveMobile: {
    storeLink: "https://r354.adj.st/?adj_t=t2esmlk&adj_campaign=Ledger_Live",
    appStore: "https://apps.apple.com/app/id1361671700",
    playStore: "https://play.google.com/store/apps/details?id=com.ledger.live",
  },
  howToUpdateNewLedger: "https://support.ledger.com/hc/articles/9305992683165?docs=true",
  genuineCheck:
    "https://support.ledger.com/hc/articles/4404389367057-Is-my-Ledger-device-genuine-?docs=true",
};

export const vaultSigner = {
  help: "https://help.vault.ledger.com/developer-portal/content/signer/overview",
};
