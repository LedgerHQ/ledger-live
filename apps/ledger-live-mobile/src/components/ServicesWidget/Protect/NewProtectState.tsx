import { IconBoxList, Icons, Tag, Divider } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Button from "../../Button";
import { ScreenName } from "../../../const/navigation";
import { StackNavigatorNavigation } from "../../RootNavigator/types/helpers";
import { ManagerNavigatorStackParamList } from "../../RootNavigator/types/ManagerNavigator";

const items = [
  {
    title: "servicesWidget.protect.status.new.0.title",
    Icon: Icons.ShieldCheckMedium,
  },
  {
    title: "servicesWidget.protect.status.new.1.title",
    Icon: Icons.LockAltMedium,
  },
  {
    title: "servicesWidget.protect.status.new.2.title",
    Icon: Icons.MicrochipMedium,
  },
  {
    title: "servicesWidget.protect.status.new.3.title",
    Icon: Icons.ChartNetworkMedium,
  },
];

function NewProtectState({ params }: { params: Record<string, string> }) {
  const { t } = useTranslation();
  const navigation =
    useNavigation<StackNavigatorNavigation<ManagerNavigatorStackParamList>>();
  const { learnMoreURI } = params || {};

  const source = "ledgerlive://myledger";

  const onLearnMore = useCallback(() => {
    Linking.canOpenURL(learnMoreURI).then(() =>
      Linking.openURL(`${learnMoreURI}&source=${source}`),
    );
  }, [learnMoreURI]);

  const onAlreadySubscribe = useCallback(() => {
    navigation.navigate(ScreenName.ProtectLogin);
  }, [navigation]);

  return (
    <>
      <Divider my={8} />
      <IconBoxList
        items={items.map(item => ({
          Icon: item.Icon,
          title: t(item.title),
        }))}
      />
      <Button type="main" outline={false} onPress={onLearnMore} mb={6}>
        {t(`servicesWidget.protect.status.new.actions.learnMore`)}
      </Button>
      <Button type="default" outline={false} onPress={onAlreadySubscribe}>
        {t(`servicesWidget.protect.status.new.actions.alreadySubscribed`)}
      </Button>
    </>
  );
}

const StateTag = () => {
  const { t } = useTranslation();

  return (
    <Tag
      color="primary.c80"
      textColor="neutral.c00"
      ellipsizeMode="tail"
      size="medium"
    >
      {t(`servicesWidget.protect.status.new.title`)}
    </Tag>
  );
};

NewProtectState.StatusTag = StateTag;

export default NewProtectState;
