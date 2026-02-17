import { DeviceModelId } from "@ledgerhq/devices";
import { AppInfos } from "../enum/AppInfos";
import { DeviceLabels } from "../enum/DeviceLabels";

type LabelConfig = {
  receiveVerify: {
    [key: string]: string;
    default: string;
  };
  receiveConfirm: {
    [key: string]: string;
    default: string;
  };
  delegateVerify: {
    [key: string]: string;
    default: string;
  };
  delegateConfirm: {
    [key: string]: string;
    default: string;
  };
  sendVerify: {
    [key: string]: string;
    default: string;
  };
  sendConfirm: {
    [key: string]: string;
    default: string;
  };
};

type DeviceLabelsConfig = {
  default: LabelConfig;
} & {
  [key in DeviceModelId]?: LabelConfig;
};

const TOUCHSCREEN_DEVICE_CONFIG: LabelConfig = {
  receiveVerify: {
    [AppInfos.BNB_CHAIN.name]: DeviceLabels.VERIFY_BSC,
    [AppInfos.COSMOS.name]: DeviceLabels.VERIFY_COSMOS,
    [AppInfos.ETHEREUM.name]: DeviceLabels.VERIFY_ETHEREUM,
    [AppInfos.POLKADOT.name]: DeviceLabels.VERIFY_POLKADOT,
    [AppInfos.POLYGON.name]: DeviceLabels.VERIFY_POLYGON,
    [AppInfos.SOLANA.name]: DeviceLabels.VERIFY_SOLANA_ADDRESS,
    [AppInfos.SUI.name]: DeviceLabels.PROVIDE_PUBLIC_KEY,
    default: DeviceLabels.ADDRESS,
  },
  receiveConfirm: {
    default: DeviceLabels.CONFIRM,
  },
  delegateVerify: {
    [AppInfos.NEAR.name]: DeviceLabels.VIEW_HEADER,
    default: DeviceLabels.REVIEW_OPERATION,
  },
  delegateConfirm: {
    [AppInfos.NEAR.name]: DeviceLabels.CONTINUE_TO_ACTION,
    default: DeviceLabels.HOLD_TO_SIGN,
  },
  sendVerify: {
    default: DeviceLabels.REVIEW_OPERATION,
  },
  sendConfirm: {
    default: DeviceLabels.HOLD_TO_SIGN,
  },
};

export const DEVICE_LABELS_CONFIG: DeviceLabelsConfig = {
  [DeviceModelId.nanoS]: {
    receiveVerify: {
      [AppInfos.ETHEREUM.name]: DeviceLabels.VERIFY_ADDRESS,
      [AppInfos.SOLANA.name]: DeviceLabels.PUBKEY,
      default: DeviceLabels.ADDRESS,
    },
    receiveConfirm: {
      [AppInfos.COSMOS.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.POLKADOT.name]: DeviceLabels.CAPS_APPROVE,
      default: DeviceLabels.APPROVE,
    },
    delegateVerify: {
      [AppInfos.COSMOS.name]: DeviceLabels.TYPE_DELEGATE,
      [AppInfos.MULTIVERS_X.name]: DeviceLabels.RECEIVER,
      [AppInfos.NEAR.name]: DeviceLabels.VIEW_HEADER,
      [AppInfos.SOLANA.name]: DeviceLabels.DELEGATE_FROM,
      [AppInfos.TEZOS.name]: DeviceLabels.REVIEW_OPERATION,
      [AppInfos.INJECTIVE.name]: DeviceLabels.CHAIN_ID,
      [AppInfos.OSMOSIS.name]: DeviceLabels.CHAIN_ID,
      default: DeviceLabels.REVIEW_OPERATION,
    },
    delegateConfirm: {
      [AppInfos.CELO.name]: DeviceLabels.ACCEPT,
      [AppInfos.MULTIVERS_X.name]: DeviceLabels.SIGN,
      [AppInfos.NEAR.name]: DeviceLabels.CONTINUE_TO_ACTION,
      [AppInfos.SOLANA.name]: DeviceLabels.APPROVE,
      [AppInfos.TEZOS.name]: DeviceLabels.ACCEPT_RISK,
      default: DeviceLabels.CAPS_APPROVE,
    },
    sendVerify: {
      [AppInfos.SOLANA.name]: DeviceLabels.TRANSFER,
      [AppInfos.RIPPLE.name]: DeviceLabels.TRANSACTION_TYPE,
      [AppInfos.COSMOS.name]: DeviceLabels.TYPE_SEND,
      [AppInfos.POLKADOT.name]: DeviceLabels.CHAIN_STATEMINT,
      default: DeviceLabels.REVIEW_OPERATION,
    },
    sendConfirm: {
      [AppInfos.SOLANA.name]: DeviceLabels.APPROVE,
      [AppInfos.TRON.name]: DeviceLabels.SIGN,
      [AppInfos.STELLAR.name]: DeviceLabels.SIGN,
      [AppInfos.RIPPLE.name]: DeviceLabels.SIGN,
      [AppInfos.VECHAIN.name]: DeviceLabels.SIGN,
      [AppInfos.ZCASH.name]: DeviceLabels.ACCEPT,
      [AppInfos.APTOS.name]: DeviceLabels.APPROVE,
      [AppInfos.SUI.name]: DeviceLabels.ACCEPT,
      [AppInfos.BITCOIN_CASH.name]: DeviceLabels.ACCEPT,
      [AppInfos.DOGECOIN.name]: DeviceLabels.ACCEPT,
      [AppInfos.BITCOIN.name]: DeviceLabels.CONTINUE,
      default: DeviceLabels.CAPS_APPROVE,
    },
  },
  [DeviceModelId.stax]: TOUCHSCREEN_DEVICE_CONFIG,
  [DeviceModelId.europa]: TOUCHSCREEN_DEVICE_CONFIG,
  [DeviceModelId.apex]: TOUCHSCREEN_DEVICE_CONFIG,
  default: {
    receiveVerify: {
      [AppInfos.BNB_CHAIN.name]: DeviceLabels.VERIFY_BSC,
      [AppInfos.COSMOS.name]: DeviceLabels.PLEASE_REVIEW,
      [AppInfos.ETHEREUM.name]: DeviceLabels.VERIFY_ETHEREUM,
      [AppInfos.POLKADOT.name]: DeviceLabels.PLEASE_REVIEW,
      [AppInfos.POLYGON.name]: DeviceLabels.VERIFY_POLYGON,
      [AppInfos.SOLANA.name]: DeviceLabels.VERIFY_SOLANA_ADDRESS,
      default: DeviceLabels.ADDRESS,
    },
    receiveConfirm: {
      [AppInfos.BITCOIN.name]: DeviceLabels.CONFIRM,
      [AppInfos.BNB_CHAIN.name]: DeviceLabels.CONFIRM,
      [AppInfos.COSMOS.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.ETHEREUM.name]: DeviceLabels.CONFIRM,
      [AppInfos.POLKADOT.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.POLYGON.name]: DeviceLabels.CONFIRM,
      [AppInfos.SOLANA.name]: DeviceLabels.CONFIRM,
      default: DeviceLabels.APPROVE,
    },
    delegateVerify: {
      [AppInfos.COSMOS.name]: DeviceLabels.PLEASE_REVIEW,
      [AppInfos.MULTIVERS_X.name]: DeviceLabels.RECEIVER,
      [AppInfos.NEAR.name]: DeviceLabels.VIEW_HEADER,
      [AppInfos.SOLANA.name]: DeviceLabels.REVIEW_TRANSACTION_TO,
      default: DeviceLabels.REVIEW_OPERATION,
    },
    delegateConfirm: {
      [AppInfos.CELO.name]: DeviceLabels.ACCEPT,
      [AppInfos.TEZOS.name]: DeviceLabels.ACCEPT_AND_SEND,
      [AppInfos.COSMOS.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.INJECTIVE.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.MULTIVERS_X.name]: DeviceLabels.SIGN,
      [AppInfos.NEAR.name]: DeviceLabels.CONTINUE_TO_ACTION,
      [AppInfos.OSMOSIS.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.SOLANA.name]: DeviceLabels.SIGN,
      default: DeviceLabels.APPROVE,
    },
    sendVerify: {
      [AppInfos.SOLANA.name]: DeviceLabels.REVIEW_TRANSACTION_TO,
      [AppInfos.RIPPLE.name]: DeviceLabels.TRANSACTION_TYPE,
      default: DeviceLabels.REVIEW_OPERATION,
    },
    sendConfirm: {
      [AppInfos.SOLANA.name]: DeviceLabels.SIGN_TRANSACTION,
      [AppInfos.TRON.name]: DeviceLabels.SIGN,
      [AppInfos.STELLAR.name]: DeviceLabels.SIGN,
      [AppInfos.RIPPLE.name]: DeviceLabels.SIGN,
      [AppInfos.VECHAIN.name]: DeviceLabels.SIGN,
      [AppInfos.ZCASH.name]: DeviceLabels.ACCEPT,
      [AppInfos.APTOS.name]: DeviceLabels.APPROVE,
      [AppInfos.SUI.name]: DeviceLabels.ACCEPT,
      [AppInfos.BITCOIN.name]: DeviceLabels.SIGN_TRANSACTION,
      [AppInfos.KASPA.name]: DeviceLabels.APPROVE,
      [AppInfos.DOGECOIN.name]: DeviceLabels.ACCEPT,
      [AppInfos.BITCOIN_CASH.name]: DeviceLabels.ACCEPT,
      default: DeviceLabels.CAPS_APPROVE,
    },
  },
};
