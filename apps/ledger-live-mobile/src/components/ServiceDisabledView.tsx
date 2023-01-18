import React from "react";
import styled from "styled-components/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { useNavigation } from "@react-navigation/native";
import Button from "./Button";

type Props = {
  title: string;
  TitleIcon?: React.ReactNode;
  description: string;
  subTitle?: string;
  buttonLabel: string;
  ButtonIcon?: IconType;
  onButtonPress: () => void;
  hasBackButton?: boolean;
  buttonEvent?: string;
};

/**
 * View component used by specific service disabled error components
 *
 * @param title String displayed as a title on the view
 * @param TitleIcon Icon displayed above the title
 * @param description String displayed as a text content on the view
 * @param subTitle String displayed as a subtitle (below description) on the view
 * @param buttonLabel String displayed as the text on the button
 * @param ButtonIcon Icon displayed on the button
 * @param onButtonPress A function called when the user press on the (retry) button
 * @param hasBackButton If true, a back button will be displayed in the header
 * @param buttonEvent Event triggered when the user press on the button
 */
const ServiceDisabledView: React.FC<Props> = ({
  title,
  TitleIcon,
  description,
  subTitle,
  buttonLabel,
  ButtonIcon,
  onButtonPress,
  hasBackButton = false,
  buttonEvent,
}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaContainer>
      <Flex
        px={6}
        mt={8}
        height={64}
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        {hasBackButton ? (
          <Flex>
            <TouchableOpacity onPress={handleBack}>
              <ArrowLeftMedium size={24} />
            </TouchableOpacity>
          </Flex>
        ) : null}
      </Flex>
      <Flex alignItems="center" justifyContent="center" flex={1} mx={6}>
        {TitleIcon}
        <Text variant={"h2"} mb={5} mt={7} textAlign="center">
          {title}
        </Text>
        <Text
          mb={10}
          variant={"body"}
          fontWeight={"medium"}
          textAlign="center"
          color={"neutral.c80"}
        >
          {description}
        </Text>
        <Text variant={"h3"} mb={8} mt={24} px={20} textAlign="center">
          {subTitle}
        </Text>
        <Flex alignSelf="stretch" mb={24} px={36}>
          <Button
            type="main"
            onPress={onButtonPress}
            Icon={ButtonIcon}
            outline
            iconPosition="left"
            event={buttonEvent}
          >
            {buttonLabel}
          </Button>
        </Flex>
      </Flex>
    </SafeAreaContainer>
  );
};

export default ServiceDisabledView;

const SafeAreaContainer = styled.SafeAreaView`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
`;
