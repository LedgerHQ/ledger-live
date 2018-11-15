// @flow

import React from "react";
import shuffle from "lodash/shuffle";

import CoinmamaLogo from "../icons/logos/coinmama";
import ChangellyLogo from "../icons/logos/changelly";
import CoinhouseLogo from "../icons/logos/coinhouse";
import GenesisLogo from "../icons/logos/genesis";
import KyberLogo from "../icons/logos/kyber";
import SimplexLogo from "../icons/logos/simplex";
import PaybisLogo from "../icons/logos/paybis";
import LunoLogo from "../icons/logos/luno";
import ShapeShiftLogo from "../icons/logos/shapeshift";

export default shuffle([
  {
    key: "coinhouse",
    id: "coinhouse",
    url:
      "https://www.coinhouse.com/r/157530?utm_source=legderlive&utm_medium=referral",
    logo: <CoinhouseLogo />,
  },
  {
    key: "changelly",
    id: "changelly",
    url: "https://changelly.com/?ref_id=aac789605a01",
    logo: <ChangellyLogo />,
  },
  {
    key: "coinmama",
    id: "coinmama",
    url: "http://go.coinmama.com/visit/?bta=51801&nci=5343",
    logo: <CoinmamaLogo />,
  },
  {
    key: "simplex",
    id: "simplex",
    url: "https://partners.simplex.com/?partner=ledger",
    logo: <SimplexLogo />,
  },
  {
    key: "paybis",
    id: "paybis",
    url: "https://aff-tracking.paybis.com/click?pid=22&offer_id=1",
    logo: <PaybisLogo />,
  },
  {
    key: "luno",
    id: "luno",
    url: "http://luno.go2cloud.org/aff_c?offer_id=4&aff_id=1001&source=ledger",
    logo: <LunoLogo alt="Luno" />,
  },
  {
    key: "shapeshift",
    id: "shapeshift",
    url: "https://shapeshift.io/#/coins?affiliate=ledger",
    logo: <ShapeShiftLogo />,
  },
  {
    key: "genesis",
    id: "genesis",
    url: "https://genesistrading.com/ledger-live/",
    logo: <GenesisLogo />,
  },
  {
    key: "kyber",
    id: "kyber",
    url:
      "http://kyber.network/swap?ref=0xE2D8481eeF31CDA994833974FFfEccd576f8D71E",
    logo: <KyberLogo />,
  },
]);
