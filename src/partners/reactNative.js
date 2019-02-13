//@flow
import shuffle from "lodash/shuffle";

import BitPanda from "./icons/reactNative/bitpanda";
import BTCDirect from "./icons/reactNative/btcdirect";
import Changelly from "./icons/reactNative/changelly";
import ChangeNow from "./icons/reactNative/changenow";
import CoinBerry from "./icons/reactNative/coinberry";
import CoinMama from "./icons/reactNative/coinmama";
import CoinHouse from "./icons/reactNative/coinhouse";
import Exmo from "./icons/reactNative/exmo";
import KyberSwap from "./icons/reactNative/kyberswap";
import Luno from "./icons/reactNative/luno";
import PayBis from "./icons/reactNative/paybis";
import ShapeShift from "./icons/reactNative/shapeshift";
import SimpleX from "./icons/reactNative/simplex";
import TaxToken from "./icons/reactNative/taxtoken";
import ThorSwap from "./icons/reactNative/thorswap";

import partners from "./common";

const reactCards = {
  bitpanda: BitPanda,
  btcdirect: BTCDirect,
  changelly: Changelly,
  changenow: ChangeNow,
  coinberry: CoinBerry,
  coinmama: CoinMama,
  coinhouse: CoinHouse,
  exmo: Exmo,
  kyberswap: KyberSwap,
  luno: Luno,
  paybis: PayBis,
  shapeshift: ShapeShift,
  simplex: SimpleX,
  taxtoken: TaxToken,
  thorswap: ThorSwap
};

export default shuffle(
  partners.map(({ id, url }) => ({ Logo: reactCards[id], id, url }))
);
