// @flow

import React from "react";
import shuffle from "lodash/shuffle";

import CoinmamaLogo from "../icons/logos/coinmama";
import ChangellyLogo from "../icons/logos/changelly";
import CoinhouseLogo from "../icons/logos/coinhouse";
import GenesisLogo from "../icons/logos/genesis";
import KyberLogo from "../icons/logos/kyberswap";
import ThorSwap from "../icons/logos/thorswap";
import ChangeNow from "../icons/logos/changenow";
import SimplexLogo from "../icons/logos/simplex";
import PaybisLogo from "../icons/logos/paybis";
import LunoLogo from "../icons/logos/luno";
import ShapeShiftLogo from "../icons/logos/shapeshift";
import Coinberry from "../icons/logos/coinberry";
import BtcDirect from "../icons/logos/btcdirect";

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
    key: "kyberswap",
    id: "kyberswap",
    url:
      "http://kyber.network/swap?ref=0xE2D8481eeF31CDA994833974FFfEccd576f8D71E",
    logo: <KyberLogo width={160} />,
  },
  {
    key: "changenow",
    id: "changenow",
    url: "https://changenow.io?link_id=80ab1d8ad846e7",
    logo: <ChangeNow width={160} />,
  },
  {
    key: "thorswap",
    id: "thorswap",
    url:
      "https://www.thorswap.com/?utm_source=Wallet&utm_medium=ledger&utm_campaign=EmbedLink&utm_content=Link1",
    logo: <ThorSwap width={160} />,
  },
  {
    key: "coinberry",
    id: "coinberry",
    url: "https://www.coinberry.com/?utm_source=ledger",
    logo: <Coinberry width={150} />,
  },
  {
    key: "btcDirect",
    id: "btcDirect",
    url: "https://btcdirect.eu/en-gb?partnerId=261",
    logo: <BtcDirect width={150} />,
  },
]);
