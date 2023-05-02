import { memo, useEffect } from "react";
import { page } from "./segment";
let source: string | undefined | null;
export const setTrackingSource = (s?: string) => {
  source = s;
};
function TrackPage({
  category,
  name,
  ...properties
}: {
  category: string;
  name?: string;
  [key: string]: unknown;
}) {
  useEffect(() => {
    page(category, name, {
      ...properties,
      ...(source
        ? {
            source,
          }
        : {}),
    });
    // reset source param once it has been tracked to not repeat it from further unrelated navigation
    source = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
export default memo(TrackPage);
