import { useSelector } from "LLD/hooks/redux";
import { themeSelector } from "~/renderer/actions/general";

import darkCollapse from "./dark/collapse.json";
import darkExpand from "./dark/expand.json";
import lightCollapse from "./light/collapse.json";
import lightExpand from "./light/expand.json";

const animations = {
  dark: { collapse: darkCollapse, expand: darkExpand },
  light: { collapse: lightCollapse, expand: lightExpand },
};

export function useAnimationData() {
  const theme = useSelector(themeSelector);
  return { ...animations[theme], themeKey: theme };
}
