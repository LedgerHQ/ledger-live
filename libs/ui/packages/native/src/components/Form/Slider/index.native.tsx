import React, { useCallback } from "react";
import styled from "styled-components/native";
import RnRangeSlider from "rn-range-slider";
import Text from "../../Text";
import { Label, MinMaxTextContainer, Notch, Rail, RailSelected, Thumb } from "./components";

export type SliderProps = {
  step: number;
  min: number;
  max: number;
  value: number;
  onChange: (low: number, high: number) => void;
  onTouchStart?: (low: number, high: number) => void;
  onTouchEnd?: (low: number, high: number) => void;
  disabled?: boolean;
};

const SliderContainer = styled.View`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const Slider = ({
  value,
  min,
  max,
  step,
  onChange,
  onTouchEnd,
  onTouchStart,
  disabled,
}: SliderProps) => {
  const renderRail = useCallback(() => <Rail />, []);
  const renderRailSelected = useCallback(() => <RailSelected />, []);
  const renderLabel = useCallback((value) => <Label>{value}</Label>, []);
  const renderNotch = useCallback(() => <Notch />, []);

  return (
    <SliderContainer>
      <RnRangeSlider
        style={{
          width: "100%",
        }}
        min={min}
        max={max}
        low={value}
        disabled={disabled}
        step={step}
        disableRange={true}
        floatingLabel={true}
        renderThumb={Thumb}
        renderRail={renderRail}
        renderRailSelected={renderRailSelected}
        renderLabel={renderLabel}
        renderNotch={renderNotch}
        onValueChanged={onChange}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
      <MinMaxTextContainer>
        <Text variant={"small"} fontWeight={"medium"} color={"neutral.c70"}>
          {min}
        </Text>
        <Text variant={"small"} fontWeight={"medium"} color={"neutral.c70"}>
          {max}
        </Text>
      </MinMaxTextContainer>
    </SliderContainer>
  );
};

export default Slider;
