/* eslint-disable react/no-array-index-key */

import React, { PureComponent } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Step, { Status } from "./Step";

const Container = styled(Box)`
  position: sticky;
  top: -20px;
  z-index: 2;
`;

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  justifyContent: "center",
  relative: true,
}))`
  margin-bottom: 25px;
  z-index: 2;
`;

const Bar = styled.div<{
  start: number;
  end: number;
  current: number;
  disabled: Array<number> | undefined | null;
}>`
  background: ${p => p.theme.colors.palette.text.shade20};
  flex-grow: 1;
  height: 1px;
  left: ${p => p.start}%;
  position: absolute;
  overflow: hidden;
  right: ${p => p.end}%;
  top: 8px;
  z-index: 1;

  &:after,
  &:before {
    bottom: 0;
    content: "";
    display: block;
    left: 0;
    position: absolute;
    right: auto;
    top: 0;
    transition: right ease-in-out 0.4s;
  }

  &:after {
    background: ${p => p.theme.colors.wallet};
    right: ${p => (p.current === 0 ? 0 : `${p.current}%`)};
    z-index: 1;
  }

  &:before {
    background: ${p => p.theme.colors.palette.text.shade20};
    left: ${p => (p.disabled ? `${p.disabled[0]}%` : 0)};
    right: ${p => (p.disabled ? `${p.disabled[1]}%` : "auto")};
    z-index: 2;
  }
`;

const indexToPercent = (index: number, itemsLength: number): number =>
  100 - (100 / (itemsLength - 1)) * index;

type ItemBase = {
  label?: React.ReactNode;
  excludeFromBreadcrumb?: boolean;
};

type Props<Item extends ItemBase> = {
  currentStep: number;
  items: Array<Item>;
  stepsDisabled: Array<number>;
  stepsErrors: Array<number>;
  mb?: number;
};

class Breadcrumb<Item extends ItemBase> extends PureComponent<Props<Item>> {
  static defaultProps = {
    stepsDisabled: [],
    stepsErrors: [],
  };

  render() {
    const { items, stepsDisabled, stepsErrors, currentStep, mb } = this.props;
    const itemsLength = items.length;
    const start = 100 / itemsLength / 2;
    const currentStepInteger =
      // FIXME deprecated the implicit accept of string values
      typeof currentStep === "string" ? parseInt(currentStep, 10) : currentStep;

    return (
      <Container>
        <Box mb={mb} bg="palette.background.paper" relative>
          <Wrapper>
            {items
              .filter(i => !i.excludeFromBreadcrumb)
              .map((item, i) => {
                let status: Status = "next";
                const stepIndex = currentStepInteger;
                if (i === stepIndex) {
                  status = "active";
                }
                if (i < stepIndex) {
                  status = "valid";
                }
                if (stepsErrors.includes(i)) {
                  status = "error";
                }
                if (stepsDisabled.includes(i)) {
                  status = "disable";
                }
                return (
                  <Step key={i} status={status} number={i + 1}>
                    {item.label}
                  </Step>
                );
              })}
          </Wrapper>
          <Bar
            end={start}
            start={start}
            disabled={
              stepsDisabled.length > 0
                ? [
                    stepsDisabled[0] === 0 ? 0 : indexToPercent(stepsDisabled[0] + 1, itemsLength),
                    indexToPercent(stepsDisabled[stepsDisabled.length - 1], itemsLength),
                  ]
                : null
            }
            current={!currentStep ? 100 : indexToPercent(currentStepInteger, itemsLength)}
          />
        </Box>
      </Container>
    );
  }
}
export default Breadcrumb;
