import React from "react";
import { useTranslation } from "react-i18next";
import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ExploreTabNavigatorStackParamList } from "./types/ExploreTabNavigator";
import { ScreenName } from "../../const/navigation";
import NewsfeedPage from "../../screens/Newsfeed";
import { BackButton } from "../../screens/OperationDetails";
import Learn from "../../screens/Learn/learn";
import ExploreTabNavigatorTabBar from "../ExploreTab/ExploreTabNavigatorTabBar";
import ExploreTabNavigatorTabBarDisabled from "../ExploreTab/ExploreTabNavigatorTabBarDisabled";
import { useIsNewsfeedAvailable } from "../../hooks/newsfeed/useIsNewsfeedAvailable";

const ExploreTab =
  createMaterialTopTabNavigator<ExploreTabNavigatorStackParamList>();

const tabBarOptions = (props: MaterialTopTabBarProps) => (
  <ExploreTabNavigatorTabBar {...props} />
);

const tabBarDisabledOptions = (props: MaterialTopTabBarProps) => (
  <ExploreTabNavigatorTabBarDisabled {...props} />
);

export default function ExploreTabNavigator() {
  const { t } = useTranslation();
  const brazeLearnFeature = useFeature("brazeLearn");
  const isNewsfeedAvailable = useIsNewsfeedAvailable();

  if (!brazeLearnFeature?.enabled && !isNewsfeedAvailable) return null;

  return (
    <ExploreTab.Navigator
      initialRouteName={ScreenName.Newsfeed}
      tabBar={
        isNewsfeedAvailable && brazeLearnFeature?.enabled
          ? tabBarOptions
          : tabBarDisabledOptions
      }
      style={{ backgroundColor: "transparent" }}
      sceneContainerStyle={{ backgroundColor: "transparent" }}
    >
      {brazeLearnFeature?.enabled && (
        <ExploreTab.Screen
          name={ScreenName.Learn}
          component={Learn}
          options={({ navigation }) => ({
            title: t("discover.sections.learn.title"),
            headerShown: true,
            animationEnabled: false,
            headerLeft: () => <BackButton navigation={navigation} />,
            headerRight: () => null,
          })}
        />
      )}

      {isNewsfeedAvailable && (
        <ExploreTab.Screen
          name={ScreenName.Newsfeed}
          component={NewsfeedPage}
          options={{
            title: t("newsfeed.title"),
          }}
        />
      )}
    </ExploreTab.Navigator>
  );
}
