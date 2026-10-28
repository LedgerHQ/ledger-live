import React from "react";

type IconProps = { className?: string };

// Line icon in the style of the Lumen symbols (24px grid, 1.5 stroke, `currentColor`); Lumen has a
// Bluetooth symbol but no USB one, so this one is drawn like `@ledgerhq/icons-ui`'s `Usb`.
export function UsbIcon({ className }: IconProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 17C11.337 17 10.7011 17.2634 10.2322 17.7322C9.76339 18.2011 9.5 18.837 9.5 19.5C9.5 20.163 9.76339 20.7989 10.2322 21.2678C10.7011 21.7366 11.337 22 12 22C12.663 22 13.2989 21.7366 13.7678 21.2678C14.2366 20.7989 14.5 20.163 14.5 19.5C14.5 18.837 14.2366 18.2011 13.7678 17.7322C13.2989 17.2634 12.663 17 12 17ZM12 17V2M12 2L14.25 4.25M12 2L9.75 4.25M12 15.22L8.06 14.34C7.14 14.13 6.49 13.32 6.49 12.38V10.98M12 13.65L16.07 12.42C16.91 12.16 17.49 11.38 17.49 10.5V9.48M16.75 6H18.25C18.8023 6 19.25 6.44772 19.25 7V8.5C19.25 9.05228 18.8023 9.5 18.25 9.5H16.75C16.1977 9.5 15.75 9.05228 15.75 8.5V7C15.75 6.44772 16.1977 6 16.75 6ZM6.5 7.5C6.03587 7.5 5.59075 7.68437 5.26256 8.01256C4.93437 8.34075 4.75 8.78587 4.75 9.25C4.75 9.71413 4.93437 10.1592 5.26256 10.4874C5.59075 10.8156 6.03587 11 6.5 11C6.96413 11 7.40925 10.8156 7.73744 10.4874C8.06563 10.1592 8.25 9.71413 8.25 9.25C8.25 8.78587 8.06563 8.34075 7.73744 8.01256C7.40925 7.68437 6.96413 7.5 6.5 7.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// An emulated device with a cloud on its screen. The device keeps its own colors (black body,
// white screen); a faint `currentColor` outline keeps the body visible on a dark canvas.
export function MockServerIcon({ className }: IconProps) {
  return (
    <svg
      width={19}
      height={28}
      viewBox="0 0 87 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 12.1428C0 5.43653 5.43654 0 12.1429 0H72.8571C79.5635 0 85 5.43654 85 12.1429V115.111C85 121.818 79.5635 127.254 72.8571 127.254H12.1429C5.43654 127.254 0 121.818 0 115.111V12.1428Z"
        fill="black"
        stroke="currentColor"
        strokeOpacity={0.6}
        strokeWidth={3}
      />
      <path
        d="M6.09644 13.1114C6.09644 9.08761 9.35836 5.82568 13.3822 5.82568H71.6679C75.6917 5.82568 78.9536 9.08761 78.9536 13.1114V95.6828C78.9536 99.7066 75.6917 102.969 71.6679 102.969H13.3821C9.35836 102.969 6.09644 99.7066 6.09644 95.6828V13.1114Z"
        fill="white"
      />
      <path
        d="M84.9917 15.5786V15.5786C86.0647 15.5786 86.9346 16.4485 86.9346 17.5215V28.6695C86.9346 29.7425 86.0647 30.6123 84.9917 30.6123V30.6123V15.5786Z"
        fill="black"
      />
      <rect x="61.9534" y="112.683" width="14.5714" height="7.28571" rx="3.64286" fill="white" />
      <path
        d="M56.4205 50.0429C62.1992 50.5451 66.4745 55.5216 65.9577 61.1601C65.4644 66.4333 60.8837 70.4739 55.4104 70.4739H29.5708C23.7452 70.4739 19.0001 65.9083 19.0001 60.247C18.9766 54.9281 23.1344 50.4766 28.5842 49.9972H28.5607C29.7823 42.5325 36.9938 37.4419 44.6753 38.6518C50.6653 39.5877 55.3634 44.1533 56.3266 49.9744L56.4205 50.0429Z"
        fill="black"
      />
    </svg>
  );
}
