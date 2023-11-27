
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function link({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 4.5L10.6508 5.29125L6.975 7.45875L5.625 8.25V15.75L6.97425 16.5413L10.6845 18.7087L12.0338 19.5L13.383 18.7087L17.0258 16.5413L18.375 15.75V8.25L17.0258 7.45875L13.3492 5.29125L12 4.5ZM8.3235 14.1675V9.8325L12 7.665L15.6765 9.8325V14.1675L12 16.335L8.3235 14.1675Z" fill={color} /></svg>;
}
export default link;