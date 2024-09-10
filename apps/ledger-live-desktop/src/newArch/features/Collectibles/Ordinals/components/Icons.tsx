import React from "react";
import { Icons } from "@ledgerhq/react-ui";
import { IconProps } from "../../types/Collection";

export const mappingKeysWithIconAndName = {
  alpha: { icon: (props: IconProps) => <Icons.OrdinalsAlpha {...props} />, name: "Alpha" },
  black_epic: {
    icon: (props: IconProps) => <Icons.OrdinalsBlackEpic {...props} />,
    name: "Black Epic",
  },
  black_legendary: {
    icon: (props: IconProps) => <Icons.OrdinalsBlackLegendary {...props} />,
    name: "Black Legendary",
  },
  black_mythic: {
    icon: (props: IconProps) => <Icons.OrdinalsBlackMythic {...props} />,
    name: "Black Mythic",
  },
  black_rare: {
    icon: (props: IconProps) => <Icons.OrdinalsBlackRare {...props} />,
    name: "Black Rare",
  },
  black_uncommon: {
    icon: (props: IconProps) => <Icons.OrdinalsBlackUncommon {...props} />,
    name: "Black Uncommon",
  },
  block_9: { icon: (props: IconProps) => <Icons.OrdinalsBlock9 {...props} />, name: "Block 9" },
  block_9_450x: {
    icon: (props: IconProps) => <Icons.OrdinalsBlock9450X {...props} />,
    name: "Block 9 450x",
  },
  block_78: { icon: (props: IconProps) => <Icons.OrdinalsBlock78 {...props} />, name: "Block 78" },
  block_286: {
    icon: (props: IconProps) => <Icons.OrdinalsBlock286 {...props} />,
    name: "Block 286",
  },
  block_666: {
    icon: (props: IconProps) => <Icons.OrdinalsBlock666 {...props} />,
    name: "Block 666",
  },
  common: { icon: (props: IconProps) => <Icons.OrdinalsCommon {...props} />, name: "Common" },
  epic: { icon: (props: IconProps) => <Icons.OrdinalsEpic {...props} />, name: "Epic" },
  first_tx: {
    icon: (props: IconProps) => <Icons.OrdinalsFirstTx {...props} />,
    name: "First Transaction",
  },
  hitman: { icon: (props: IconProps) => <Icons.OrdinalsHitman {...props} />, name: "Hitman" },
  jpeg: { icon: (props: IconProps) => <Icons.OrdinalsJpeg {...props} />, name: "JPEG" },
  legacy: { icon: (props: IconProps) => <Icons.OrdinalsLegacy {...props} />, name: "Legacy" },
  legendary: {
    icon: (props: IconProps) => <Icons.OrdinalsLegendary {...props} />,
    name: "Legendary",
  },
  mythic: { icon: (props: IconProps) => <Icons.OrdinalsMythic {...props} />, name: "Mythic" },
  nakamoto: { icon: (props: IconProps) => <Icons.OrdinalsNakamoto {...props} />, name: "Nakamoto" },
  omega: { icon: (props: IconProps) => <Icons.OrdinalsOmega {...props} />, name: "Omega" },
  paliblock: {
    icon: (props: IconProps) => <Icons.OrdinalsPaliblockPalindrome {...props} />,
    name: "PaliBlock Palindrome",
  },
  palindrome: {
    icon: (props: IconProps) => <Icons.OrdinalsPalindrome {...props} />,
    name: "Palindrome",
  },
  palinception: {
    icon: (props: IconProps) => <Icons.OrdinalsPalinception {...props} />,
    name: "Palinception",
  },
  pizza: { icon: (props: IconProps) => <Icons.OrdinalsPizza {...props} />, name: "Pizza" },
  rare: { icon: (props: IconProps) => <Icons.OrdinalsRare {...props} />, name: "Rare" },
  uncommon: { icon: (props: IconProps) => <Icons.OrdinalsUncommon {...props} />, name: "Uncommon" },
  vintage: { icon: (props: IconProps) => <Icons.OrdinalsVintage {...props} />, name: "Vintage" },
};
