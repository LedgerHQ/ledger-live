//@flow
import shuffle from "lodash/shuffle";

import bitpanda from "./bitpanda";
import btcdirect from "./btcdirect";
import changelly from "./changelly";
import changenow from "./changenow";
import coinberry from "./coinberry";
import coinhouse from "./coinhouse";
import coinmama from "./coinmama";
import exmo from "./exmo";
import kyberswap from "./kyberswap";
import luno from "./luno";
import paybis from "./paybis";
import shapeshift from "./shapeshift";
import simplex from "./simplex";
import taxtoken from "./taxtoken";
import thorswap from "./thorswap";

import partners from "src/partners";

const reactCards = {
  bitpanda: bitpanda,
  btcdirect: btcdirect,
  changelly: changelly,
  changenow: changenow,
  coinberry: coinberry,
  coinhouse: coinhouse,
  coinmama: coinmama,
  exmo: exmo,
  kyberswap: kyberswap,
  luno: luno,
  paybis: paybis,
  shapeshift: shapeshift,
  simplex: simplex,
  taxtoken: taxtoken,
  thorswap: thorswap
};

export default shuffle(
  partners.map(({ id, url }) => ({ Logo: reactCards[id], id, url }))
);
