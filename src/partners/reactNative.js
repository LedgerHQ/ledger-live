// @flow
import shuffle from "lodash/shuffle";
import icons from "./icons/reactNative";
import partners from "./index";

const out: Array<{
  Logo: React$ComponentType<*>,
  id: string,
  url: string
}> = shuffle(partners.map(({ id, url }) => ({ Logo: icons[id], id, url })));

export default out;
