import React, { useCallback } from "react";
import { Linking, ScrollView } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Icons, List, Link, Log } from "@ledgerhq/native-ui";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import { urls } from "../../../config/urls";
import Illustration from "../../../images/illustration/Illustration";
import EarnLight from "../../../images/illustration/Light/_003.png";
import EarnDark from "../../../images/illustration/Dark/_003.png";
import Button from "../../../components/wrappedUi/Button";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import type { TezosDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  TezosDelegationFlowParamList,
  ScreenName.DelegationStarted
>;
const Check = <Icons.CheckAloneMedium size={20} color={"success.c100"} />;

export default function DelegationStarted({ navigation, route }: Props) {
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.DelegationSummary, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.delegation);
  }, []);

  return (
    <ScrollView>
      <Flex flex={1} justifyContent="space-between" bg="background.main">
        <Flex m={6}>
          <TrackScreen category="DelegationFlow" name="Started" />
          <Flex alignItems="center">
            <Illustration
              lightSource={EarnLight}
              darkSource={EarnDark}
              size={150}
            />
          </Flex>
          <Flex py={8} alignItems="center">
            <Log>
              <Trans i18nKey="delegation.started.title" />
            </Log>
          </Flex>
          <Text variant="body" fontWeight="medium" textAlign="center" mb={6}>
            <Trans i18nKey="delegation.started.description" />
          </Text>
          <List
            items={[
              <Trans i18nKey="delegation.started.steps.0" />,
              <Trans i18nKey="delegation.started.steps.1" />,
              <Trans i18nKey="delegation.started.steps.2" />,
            ].map(wording => ({ title: wording, bullet: Check }))}
            itemContainerProps={{
              alignItems: "center",
            }}
            my={8}
          />
          <Link
            type="color"
            size="medium"
            iconPosition="right"
            Icon={Icons.ExternalLinkMedium}
            onPress={howDelegationWorks}
          >
            <Trans i18nKey="delegation.howDelegationWorks" />
          </Link>
        </Flex>
        <Flex p={6}>
          <Button event="DelegationStartedBtn" onPress={onNext} type="main">
            <Trans i18nKey="delegation.started.cta" />
          </Button>
        </Flex>
      </Flex>
    </ScrollView>
  );
}
