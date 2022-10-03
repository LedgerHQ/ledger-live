import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3EFFFF";

function ABT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M4.875 7.865L12 3.75l7.125 4.115v8.27L12 20.25l-7.125-4.115v-8.27zm.684 7.478l2.857-1.654 1.45-2.539L5.56 8.658v6.685zm.343.593l5.776 3.337V16.08L8.65 14.345l-2.748 1.59v.001zM18.44 8.681l-4.269 2.47 1.449 2.537 2.82 1.631V8.681zm-.322-.606l-5.757-3.324v3.231l1.47 2.574 4.287-2.48zm-4.536 3.417l-.879.508 1.744 1.009-.865-1.518zm-.34-.596l-.88-1.545v2.055l.88-.51zm-3.648 2.111L11.335 12l-.876-.507-.863 1.514zm-.259.942l2.342 1.341v-2.696l-2.342 1.355zM5.901 8.064l4.305 2.49 1.472-2.576v-3.25L5.901 8.063zm12.218 7.86l-2.727-1.577-3.03 1.755v3.148l5.757-3.325zm-3.412-1.973l-2.345-1.357v2.716l2.345-1.36zm-3.909-3.053l.88.508V9.355l-.88 1.543z"  /></Svg>;
}

ABT.DefaultColor = DefaultColor;
export default ABT;