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

export const DEVICE_LABELS_CONFIG: DeviceLabelsConfig = {
  [DeviceModelId.nanoS]: {
    receiveVerify: {
      [AppInfos.ETHEREUM.name]: DeviceLabels.VERIFY_ADDRESS.name,
      [AppInfos.SOLANA.name]: DeviceLabels.PUBKEY.name,
      default: DeviceLabels.ADDRESS.name,
    },
    receiveConfirm: {
      [AppInfos.COSMOS.name]: DeviceLabels.CAPS_APPROVE.name,
      [AppInfos.POLKADOT.name]: DeviceLabels.CAPS_APPROVE.name,
      default: DeviceLabels.APPROVE.name,
    },
    delegateVerify: {
      [AppInfos.COSMOS.name]: DeviceLabels.TYPE_DELEGATE.name,
      [AppInfos.MULTIVERS_X.name]: DeviceLabels.RECEIVER.name,
      [AppInfos.NEAR.name]: DeviceLabels.VIEW_HEADER.name,
      [AppInfos.SOLANA.name]: DeviceLabels.DELEGATE_FROM.name,
      [AppInfos.TEZOS.name]: DeviceLabels.REVIEW_OPERATION.name,
      [AppInfos.INJECTIVE.name]: DeviceLabels.CHAIN_ID.name,
      [AppInfos.OSMOSIS.name]: DeviceLabels.CHAIN_ID.name,
      default: DeviceLabels.REVIEW_OPERATION.name,
    },
    delegateConfirm: {
      [AppInfos.CELO.name]: DeviceLabels.ACCEPT.name,
      [AppInfos.MULTIVERS_X.name]: DeviceLabels.SIGN.name,
      [AppInfos.NEAR.name]: DeviceLabels.CONTINUE_TO_ACTION.name,
      [AppInfos.SOLANA.name]: DeviceLabels.APPROVE.name,
      [AppInfos.TEZOS.name]: DeviceLabels.ACCEPT_RISK.name,
      default: DeviceLabels.CAPS_APPROVE.name,
    },
    sendVerify: {
      default: DeviceLabels.REVIEW_OPERATION.name,
    },
    sendConfirm: {
      [AppInfos.SOLANA.name]: DeviceLabels.SIGN_TRANSACTION.name,
      [AppInfos.TRON.name]: DeviceLabels.SIGN.name,
      [AppInfos.STELLAR.name]: DeviceLabels.SIGN.name,
      [AppInfos.RIPPLE.name]: DeviceLabels.SIGN.name,
      [AppInfos.APTOS.name]: DeviceLabels.APPROVE.name,
      [AppInfos.SUI.name]: DeviceLabels.ACCEPT.name,
      [AppInfos.BITCOIN.name]: DeviceLabels.CONTINUE.name,
      default: DeviceLabels.CAPS_APPROVE.name,
    },
  },
  [DeviceModelId.stax]: {
    receiveVerify: {
      [AppInfos.BNB_CHAIN.name]: DeviceLabels.VERIFY_BSC.name,
      [AppInfos.COSMOS.name]: DeviceLabels.PLEASE_REVIEW.name,
      [AppInfos.ETHEREUM.name]: DeviceLabels.VERIFY_ETHEREUM.name,
      [AppInfos.POLKADOT.name]: DeviceLabels.PLEASE_REVIEW.name,
      [AppInfos.POLYGON.name]: DeviceLabels.VERIFY_POLYGON.name,
      [AppInfos.SOLANA.name]: DeviceLabels.VERIFY_SOLANA_ADDRESS.name,
      default: DeviceLabels.ADDRESS.name,
    },
    receiveConfirm: {
      default: DeviceLabels.CONFIRM.name,
    },
    delegateVerify: {
      [AppInfos.NEAR.name]: DeviceLabels.VIEW_HEADER.name,
      default: DeviceLabels.REVIEW_OPERATION.name,
    },
    delegateConfirm: {
      [AppInfos.NEAR.name]: DeviceLabels.CONTINUE_TO_ACTION.name,
      default: DeviceLabels.HOLD_TO_SIGN.name,
    },
    sendVerify: {
      default: DeviceLabels.REVIEW_OPERATION.name,
    },
    sendConfirm: {
      default: DeviceLabels.HOLD_TO_SIGN.name,
    },
    sendVerify: {
      default: DeviceLabels.REVIEW_OPERATION,
    },
    sendConfirm: {
      [AppInfos.SOLANA.name]: DeviceLabels.SIGN_TRANSACTION,
      [AppInfos.TRON.name]: DeviceLabels.SIGN,
      [AppInfos.STELLAR.name]: DeviceLabels.SIGN,
      [AppInfos.RIPPLE.name]: DeviceLabels.SIGN,
      [AppInfos.APTOS.name]: DeviceLabels.APPROVE,
      [AppInfos.SUI.name]: DeviceLabels.ACCEPT,
      [AppInfos.BITCOIN.name]: DeviceLabels.CONTINUE,
      default: DeviceLabels.CAPS_APPROVE,
    },
  },
  [DeviceModelId.stax]: {
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
  },
  default: {
    receiveVerify: {
      [AppInfos.BNB_CHAIN.name]: DeviceLabels.VERIFY_BSC,
      [AppInfos.COSMOS.name]: DeviceLabels.PLEASE_REVIEW,
      [AppInfos.ETHEREUM.name]: DeviceLabels.VERIFY_ETHEREUM,
      [AppInfos.POLKADOT.name]: DeviceLabels.PLEASE_REVIEW,
      [AppInfos.POLYGON.name]: DeviceLabels.VERIFY_POLYGON,
      [AppInfos.SOLANA.name]: DeviceLabels.PUBKEY,
      default: DeviceLabels.ADDRESS,
    },
    receiveConfirm: {
      [AppInfos.BITCOIN.name]: DeviceLabels.CONFIRM,
      [AppInfos.BNB_CHAIN.name]: DeviceLabels.CONFIRM,
      [AppInfos.COSMOS.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.ETHEREUM.name]: DeviceLabels.CONFIRM,
      [AppInfos.POLKADOT.name]: DeviceLabels.CAPS_APPROVE,
      [AppInfos.POLYGON.name]: DeviceLabels.CONFIRM,
      default: DeviceLabels.APPROVE,
    },
    delegateVerify: {
      [AppInfos.COSMOS.name]: DeviceLabels.PLEASE_REVIEW,
      [AppInfos.MULTIVERS_X.name]: DeviceLabels.RECEIVER,
      [AppInfos.NEAR.name]: DeviceLabels.VIEW_HEADER,
      [AppInfos.SOLANA.name]: DeviceLabels.DELEGATE_FROM,
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
      default: DeviceLabels.APPROVE,
    },
    sendVerify: {
      [AppInfos.SOLANA.name]: DeviceLabels.TRANSFER,
      [AppInfos.RIPPLE.name]: DeviceLabels.TRANSACTION_TYPE,
      default: DeviceLabels.REVIEW_OPERATION,
    },
    sendConfirm: {
      [AppInfos.SOLANA.name]: DeviceLabels.APPROVE,
      [AppInfos.TRON.name]: DeviceLabels.SIGN,
      [AppInfos.STELLAR.name]: DeviceLabels.SIGN,
      [AppInfos.RIPPLE.name]: DeviceLabels.SIGN,
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
