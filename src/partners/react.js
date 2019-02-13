//@flow
import shuffle from "lodash/shuffle";

import BitPanda from "./icons/react/bitpanda";
import BTCDirect from "./icons/react/btcdirect";
import Changelly from "./icons/react/changelly";
import ChangeNow from "./icons/react/changenow";
import CoinBerry from "./icons/react/coinberry";
import CoinMama from "./icons/react/coinmama";
import CoinHouse from "./icons/react/coinhouse";
import Exmo from "./icons/react/exmo";
import KyberSwap from "./icons/react/kyberswap";
import Luno from "./icons/react/luno";
import PayBis from "./icons/react/paybis";
import ShapeShift from "./icons/react/shapeshift";
import SimpleX from "./icons/react/simplex";
import TaxToken from "./icons/react/taxtoken";
import ThorSwap from "./icons/react/thorswap";

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
