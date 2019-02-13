//@flow
import shuffle from "lodash/shuffle";
import icons from "./icons/reactNative";
import partners from "./index";

export default shuffle(
  partners.map(({ id, url }) => ({ Logo: icons[id], id, url }))
);
