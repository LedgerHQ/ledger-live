
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function stx({size, color = "currentColor"}: Props) {
  return <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width={size} height={size} viewBox="0 0 24 24"><g><path d="M 14.308594 14.109375 L 16.820312 17.910156 L 14.941406 17.910156 L 11.996094 13.445312 L 9.046875 17.910156 L 7.179688 17.910156 L 9.691406 14.121094 L 6.089844 14.121094 L 6.089844 12.679688 L 17.910156 12.679688 L 17.910156 14.109375 Z M 14.308594 14.109375 " fill={color} /><path d="M 17.910156 9.839844 L 17.910156 11.289062 L 6.089844 11.289062 L 6.089844 9.839844 L 9.621094 9.839844 L 7.140625 6.089844 L 9.015625 6.089844 L 11.996094 10.617188 L 14.984375 6.089844 L 16.859375 6.089844 L 14.378906 9.839844 Z M 17.910156 9.839844 " fill={color} /></g></svg>;
}
export default stx;