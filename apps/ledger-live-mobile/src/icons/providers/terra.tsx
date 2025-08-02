import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";

type Props = SvgProps & { size?: number; outline?: ColorValue };

export function Terra({ size = 32, outline = "black", ...props }: Props) {
  return   <svg
   width={size}
    height={size}
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    id="Layer_1"
    x="0px"
    y="0px"
    viewBox="0 0 2500 2500"
    style={{
      enableBackground: "new 0 0 2500 2500",
    }}
    xmlSpace="preserve"
    {...props}
  >
    <style type="text/css">
      {"\n\t.st0{fill:none;}\n\t.st1{fill:#093DAC;}\n\t.st2{fill:#5492F7;}\n"}
    </style>
    <g id="Layer_x0020_1">
      <g id="_2990986561232">
        <rect y={0} className="st0" width={2500} height={2500} />
        <g>
          <path
            className="st1"
            d="M1075,1985c69,253,314,447,438,439c4,0,471-87,726-514c199-332,131-652-139-659     C2003,1258,944,1503,1075,1985z"
          />
          <path
            className="st1"
            d="M2075,357L2075,357L2075,357c-207-176-475-283-769-283c-171,0-334,37-481,102c-26,11-52,23-75,37     c-17,9-33,18-49,27l4,1c-49,34-91,73-125,118c-340,450,801,777,1410,778c281,201,359-567,85-781V357z"
          />
          <path
            className="st2"
            d="M894,367C737,603,215,769,129,743c0,0,0-1-1-1c4-7,7-14,11-21c30-57,64-112,102-164s80-100,125-146     c45-45,94-87,146-125c32-24,65-46,100-66c73-42,148-45,173-46c233,4,111,191,110,193H894z"
          />
          <path
            className="st2"
            d="M766,2031c11,74,0,366-15,391c-13,1-40,2-119-42c-41-24-81-49-119-77c-52-38-100-80-146-125     c-45-45-87-94-125-146s-72-106-102-164c-30-57-55-117-76-179s-37-126-47-192c-11-66-16-134-16-203s6-137,16-203     c11-66,27-130,47-192c4-13,9-25,13-37l0,0c90,120,194,228,283,349c84,115,201,303,224,343c147,249,170,403,181,477H766z"
          />
          <path
            className="st2"
            d="M2500,1294c0,162-31,317-87,459c-147,158-1140-231-1150-236c-136-59-549-241-586-525     c-54-409,776-694,1141-705c44,1,177,2,254,65c262,229,427,566,427,941L2500,1294z"
          />
          <path
            className="st2"
            d="M1828,2403c-108,51-227,14-196-92c59-202,578-410,693-421c14-1,20,8,14,19c-119,209-296,382-510,494H1828z"
          />
        </g>
      </g>
    </g>
  </svg>
);
}
