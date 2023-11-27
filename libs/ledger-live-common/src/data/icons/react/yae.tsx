
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function yae({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24"><path d="m 20.119031,14.12236 -4.162297,8.49925 h -5.862737 l 4.162298,-8.49925 -2.08213,-4.2466824 h 5.86568 L 20.120013,14.12236 Z M 9.743705,9.8776403 13.904041,1.3783898 H 8.0403228 L 3.8799873,9.8776403 5.9601548,14.126284 h 5.8637182 z" fill={color} /></svg>;
}
export default yae;