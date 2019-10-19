// @flow
import shuffle from "lodash/shuffle";
import icons from "./icons/react";
import partners from ".";

type PartnerList = Array<{
  Logo: React$ComponentType<*>,
  id: string,
  url: string
}>;

const shuffledPartners = shuffle(partners);

const out: boolean => PartnerList = (dark = false) =>
  shuffledPartners.map(({ id, url }) => ({
    Logo: dark ? icons[`${id}Dark`] : icons[id],
    id,
    url
  }));

export default out;
