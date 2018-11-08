// @flow
// You must export all screens that are nested in Send flow

import BitcoinEditFeePerByte from "./bitcoin/ScreenEditFeePerByte";
import RippleEditTag from "./ripple/ScreenEditTag";
import RippleEditFee from "./ripple/ScreenEditFee";
import EthereumEditFee from "./ethereum/ScreenEditFee";
import EthereumEditGasLimit from "./ethereum/ScreenEditGasLimit";

export default {
  BitcoinEditFeePerByte,
  RippleEditTag,
  RippleEditFee,
  EthereumEditFee,
  EthereumEditGasLimit,
};
