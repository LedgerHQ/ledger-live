// @flow
import React from "react";
import Svg, { G, Path, Rect } from "react-native-svg";

export default function LiveLogo() {
  return (
    <Svg width="159" height="91">
      <G fill="none" fillRule="evenodd">
        <Path
          d="M.5 67.5h158V4A3.5 3.5 0 0 0 155 .5H4A3.5 3.5 0 0 0 .5 4v63.5z"
          stroke="#D8D8D8"
          fill="#FFF"
        />
        <G transform="translate(0 67)">
          <Path
            d="M.5.5V20A3.5 3.5 0 0 0 4 23.5h75.5V.5H.5z"
            stroke="#D8D8D8"
            fill="#FFF"
          />
          <Rect
            fill="#E8E8E8"
            fillRule="nonzero"
            opacity=".6"
            x="27.368"
            y="11"
            width="25.263"
            height="2"
            rx="1"
          />
        </G>
        <G transform="translate(79 67)">
          <Path
            d="M.5.5v23H76a3.5 3.5 0 0 0 3.5-3.5V.5H.5z"
            stroke="#D8D8D8"
            fill="#FFF"
          />
          <Rect
            fill="#C2C2C2"
            fillRule="nonzero"
            opacity=".6"
            x="23.158"
            y="11"
            width="33.684"
            height="2"
            rx="1"
          />
        </G>
        <G transform="translate(16 20)" fill="#6490F1">
          <Rect opacity=".2" width="28" height="28" rx="14" />
          <Path
            d="M20.303 9c1.118 0 2.03.892 2.03 2v7.333c0 1.108-.912 2-2.03 2H8.03c-1.118 0-2.03-.892-2.03-2V11c0-1.108.912-2 2.03-2h2.375l1.165-1.709A.667.667 0 0 1 12.121 7h4.091c.22 0 .427.109.55.291L17.929 9h2.375zm-8.995 1.042a.667.667 0 0 1-.55.291H8.03c-.388 0-.697.302-.697.667v7.333c0 .365.31.667.697.667h12.273c.388 0 .697-.302.697-.667V11c0-.365-.309-.667-.697-.667h-2.727a.667.667 0 0 1-.551-.29l-1.165-1.71h-3.386l-1.166 1.71zm2.859 7.625c-1.871 0-3.394-1.49-3.394-3.334S12.296 11 14.167 11c1.87 0 3.394 1.489 3.394 3.333 0 1.845-1.523 3.334-3.394 3.334zm0-1.334c1.141 0 2.06-.898 2.06-2 0-1.1-.919-2-2.06-2-1.142 0-2.06.9-2.06 2 0 1.102.918 2 2.06 2z"
            fillRule="nonzero"
          />
        </G>
        <G transform="translate(60 28)" fillRule="nonzero">
          <Rect fill="#999" width="80" height="2" rx="1" />
          <Rect fill="#D8D8D8" y="10" width="56" height="2" rx="1" />
        </G>
      </G>
    </Svg>
  );
}
