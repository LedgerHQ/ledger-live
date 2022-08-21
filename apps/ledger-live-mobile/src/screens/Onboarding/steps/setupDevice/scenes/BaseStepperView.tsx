import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RenderTransitionProps } from "@ledgerhq/native-ui/components/Navigation/FlowStepper";
import {
  Flex,
  FlowStepper,
  Icons,
  Transitions,
  SlideIndicator,
  ScrollListContainer,
} from "@ledgerhq/native-ui";

import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { DeviceNames } from "../../../types";
import Button from "../../../../../components/PreventDoubleClickButton";

const transitionDuration = 500;

const Scene = ({ children }: { children: React.ReactNode }) => (
  <Flex flex={1}>{children}</Flex>
);

export type Metadata = {
  id: string;
  illustration: JSX.Element;
  drawer: null | { route: string; screen: string };
};

const InfoButton = ({ target }: { target: Metadata["drawer"] }) => {
  const navigation = useNavigation();

  if (target)
    return (
      <Button
        Icon={Icons.InfoRegular}
        onPress={() =>
          navigation.navigate(target.route, { screen: target.screen })
        }
      />
    );

  return null;
};

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
`;

const ImageHeader = ({
  activeIndex,
  onBack,
  metadata,
}: {
  activeIndex: number;
  onBack: () => void;
  metadata: Metadata[];
}) => {
  const stepData = metadata[activeIndex];

  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      height={48}
    >
      <Button Icon={Icons.ArrowLeftMedium} onPress={onBack} />
      {metadata.length <= 1 ? null : (
        <SlideIndicator
          slidesLength={metadata.length}
          activeIndex={activeIndex}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onChange={() => {}}
        />
      )}
      <Flex width={48}>
        <InfoButton target={stepData.drawer} />
      </Flex>
    </Flex>
  );
};

const renderTransitionSlide = ({
  activeIndex,
  previousActiveIndex,
  status,
  duration,
  children,
}: RenderTransitionProps) => (
  <Transitions.Slide
    status={status}
    duration={duration}
    direction={(previousActiveIndex || 0) < activeIndex ? "left" : "right"}
    style={[StyleSheet.absoluteFill, { flex: 1 }]}
  >
    {children}
  </Transitions.Slide>
);

export function BaseStepperView({
  onNext,
  steps,
  metadata,
  deviceModelId,
  params,
}: {
  onNext: () => void;
  steps: any[];
  metadata: Metadata[];
  deviceModelId: DeviceNames;
  params: any;
}) {
  const [index, setIndex] = React.useState(0);
  const navigation = useNavigation();

  const nextPage = useCallback(() => {
    if (index < metadata.length - 1) {
      setIndex(index + 1);
    } else {
      onNext();
    }
  }, [index, onNext, metadata.length]);

  const handleBack = useCallback(
    () => (index === 0 ? navigation.goBack() : setIndex(index - 1)),
    [index, navigation],
  );

  return (
    <StyledSafeAreaView>
      <FlowStepper
        activeIndex={index}
        header={ImageHeader}
        renderTransition={renderTransitionSlide}
        transitionDuration={transitionDuration}
        progressBarProps={{ opacity: 0 }}
        extraProps={{ onBack: handleBack, metadata }}
      >
        {steps.map((Children, i) => (
          <Scene key={Children.id + i}>
            <ScrollListContainer contentContainerStyle={{ padding: 16 }}>
              <Flex
                mb={30}
                mx={8}
                justifyContent="center"
                alignItems="flex-start"
              >
                {metadata[i]?.illustration}
              </Flex>
              <Children
                onNext={nextPage}
                deviceModelId={deviceModelId}
                {...params}
              />
            </ScrollListContainer>
            {Children.Next ? (
              <Flex p={6}>
                <Children.Next
                  onNext={nextPage}
                  deviceModelId={deviceModelId}
                />
              </Flex>
            ) : null}
          </Scene>
        ))}
      </FlowStepper>
    </StyledSafeAreaView>
  );
}

export default BaseStepperView;
