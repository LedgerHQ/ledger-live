import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector, discreetModeSelector } from "~/renderer/reducers/settings";
import { getMarketColor } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import FlipTicker from "~/renderer/components/FlipTicker";
import Ellipsis from "~/renderer/components/Ellipsis";
import { BoxProps } from "./Box/Box";
import { Icons } from "@ledgerhq/react-ui";

const T = styled(Box).attrs<{ color?: string; inline?: boolean; ff?: string } & BoxProps>(p => ({
  ff: p.ff || "Inter|Medium",
  horizontal: true,
  color: p.color,
}))<{
  color?: string;
  inline?: boolean;
  ff?: string;
}>`
  white-space: pre;
  text-overflow: ellipsis;
  display: ${p => (p.inline ? "inline-block" : "block")};
  flex-shrink: ${p => (p.noShrink ? "0" : "1")};
  width: ${p => (p.inline ? "" : "100%")};
  overflow: hidden;
`;
const I = ({ color = undefined, children }: { color?: string; children: React.ReactNode }) => (
  <Box color={color}>{children}</Box>
);

export type OwnProps = {
  unit?: Unit;
  val?: BigNumber | number;
  alwaysShowSign?: boolean;
  showCode?: boolean;
  withIcon?: boolean;
  color?: string;
  animateTicker?: boolean;
  disableRounding?: boolean;
  isPercent?: boolean;
  percentageTwoDecimals?: boolean;
  subMagnitude?: number;
  prefix?: React.ReactNode;
  ellipsis?: boolean;
  suffix?: string;
  showAllDigits?: boolean;
  alwaysShowValue?: boolean;
  // overrides discreet mode
  dynamicSignificantDigits?: number;
  staticSignificantDigits?: number;
  style?: React.CSSProperties;
} & React.ComponentProps<typeof T>;
const mapStateToProps = createStructuredSelector({
  discreet: discreetModeSelector,
  locale: localeSelector,
});
type Props = OwnProps & {
  discreet: boolean;
  locale: string;
};
function FormattedVal(props: Props) {
  const {
    animateTicker,
    disableRounding,
    unit,
    isPercent,
    percentageTwoDecimals,
    alwaysShowSign,
    showCode,
    withIcon,
    locale,
    color,
    ellipsis,
    subMagnitude = 0,
    prefix,
    suffix,
    showAllDigits,
    alwaysShowValue,
    discreet,
    dynamicSignificantDigits,
    staticSignificantDigits,
    ...p
  } = props;
  const valProp = props.val;
  let val: BigNumber = valProp instanceof BigNumber ? valProp : BigNumber(valProp as number);
  invariant(val, "FormattedVal require a `val` prop. Received `undefined`");
  const isZero = val.isZero();
  const isNegative = val.isNegative() && !isZero;
  let text: React.ReactNode = "";
  // FIXME move out the % feature of this component... totally unrelated to currency & annoying for flow type.
  if (isPercent) {
    if (percentageTwoDecimals) {
      text = `${alwaysShowSign ? (isNegative ? "- " : "+ ") : ""}${(isNegative
        ? val.negated()
        : val
      ).toFixed(2)} %`;
    } else {
      text = `${alwaysShowSign ? (isNegative ? "- " : "+ ") : ""}${(isNegative
        ? val.negated()
        : val
      ).toString()} %`;
    }
  } else {
    invariant(unit, "FormattedVal require a `unit` prop. Received `undefined`");
    if (withIcon && isNegative) {
      val = val.negated();
    }
    text = formatCurrencyUnit(unit, val, {
      alwaysShowSign,
      disableRounding,
      showCode,
      locale,
      subMagnitude,
      discreet: alwaysShowValue ? false : discreet,
      showAllDigits,
      dynamicSignificantDigits,
      staticSignificantDigits,
    });
  }
  if (prefix && typeof prefix === "string") text = prefix + text;
  if (suffix) text += suffix;
  if (animateTicker) {
    text = <FlipTicker value={text as string} />;
  } else if (ellipsis) {
    text = <Ellipsis>{text}</Ellipsis>;
  }
  const marketColor = getMarketColor({
    isNegative,
  });
  return (
    <T {...p} color={color || marketColor}>
      {withIcon ? (
        <Box horizontal alignItems="center">
          <Box data-testid={`arrow-${isNegative ? "down" : "up"}`} mr={1}>
            <I color={marketColor}>
              {isNegative ? (
                <Icons.ArrowDownRight size={"M"} />
              ) : isZero ? null : (
                <Icons.ArrowUpRight size={"M"} />
              )}
            </I>
          </Box>
          <Box horizontal alignItems="center">
            {text}
          </Box>
        </Box>
      ) : (
        text
      )}
    </T>
  );
}
const m: React.ComponentType<OwnProps> = connect(mapStateToProps)(FormattedVal);
export default m;
