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
};

type DeviceLabelsConfig = {
  default: LabelConfig;
} & {
  [key in DeviceModelId]?: LabelConfig;
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
      [AppInfos.SOLANA.name]: DeviceLabels.APPROVE,
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
      [AppInfos.SOLANA.name]: DeviceLabels.APPROVE,
      [AppInfos.OSMOSIS.name]: DeviceLabels.CAPS_APPROVE,
      default: DeviceLabels.APPROVE,
    },
  },
};
