// @flow
import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { add, isBefore, parseISO } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { accountsCountSelector } from "../reducers/accounts";
import {
  ratingsModalOpenSelector,
  ratingsCurrentRouteSelector,
  ratingsHappyMomentSelector,
  ratingsDataOfUserSelector,
} from "../reducers/ratings";
import {
  setRatingsModalOpen,
  setRatingsCurrentRoute,
  setRatingsHappyMoment,
} from "../actions/ratings";
import { languageSelector } from "../reducers/settings";
import { track } from "../analytics";

const ratingsDataOfUserAsyncStorageKey = "ratingsDataOfUser";

const getCurrentRoute = (
  state: NavigationState | Required<NavigationState["routes"][0]>["state"],
): Routes | undefined => {
  if (state.index === undefined || state.index < 0) {
    return undefined;
  }
  const nestedState = state.routes[state.index].state;
  if (nestedState !== undefined) {
    return getCurrentRoute(nestedState);
  }
  return state.routes[state.index].name;
};

export async function getRatingsDataOfUserFromStorage() {
  const ratingsDataOfUser = await AsyncStorage.getItem(
    ratingsDataOfUserAsyncStorageKey,
  );

  return JSON.parse(ratingsDataOfUser);
}

export async function setRatingsDataOfUserInStorage(ratingsDataOfUser) {
  await AsyncStorage.setItem(
    ratingsDataOfUserAsyncStorageKey,
    JSON.stringify(ratingsDataOfUser),
  );
}

const useRatings = () => {
  const ratings = useFeature("ratings");

  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const ratingsOldRoute = useSelector(ratingsCurrentRouteSelector);
  const ratingsHappyMoment = useSelector(ratingsHappyMomentSelector);
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const currAppLanguage = useSelector(languageSelector);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const setRatingsModalOpenCallback = useCallback(
    isRatingsModalOpen => {
      dispatch(setRatingsModalOpen(isRatingsModalOpen));
    },
    [dispatch],
  );

  const areRatingsConditionsMet = useCallback(() => {
    if (currAppLanguage !== "en") return false;

    if (!ratingsDataOfUser) return false;

    // criterias depending on last answer to the ratings flow
    if (ratingsDataOfUser.doNotAskAgain) return false;

    if (
      ratingsDataOfUser.dateOfNextAllowedRequest &&
      isBefore(
        Date.now(),
        typeof ratingsDataOfUser.dateOfNextAllowedRequest === "string"
          ? parseISO(ratingsDataOfUser.dateOfNextAllowedRequest)
          : ratingsDataOfUser.dateOfNextAllowedRequest,
      )
    ) {
      return false;
    }

    // minimum accounts number criteria
    const minimumAccountsNumber: number =
      ratings?.params?.conditions?.minimum_accounts_number;
    if (minimumAccountsNumber && accountsCount < minimumAccountsNumber) {
      return false;
    }

    // minimum app start number criteria
    const minimumAppStartsNumber: number =
      ratings?.params?.conditions?.minimum_app_starts_number;
    if (ratingsDataOfUser.numberOfAppStarts < minimumAppStartsNumber) {
      return false;
    }

    // duration since first app start long enough criteria
    const minimumDurationSinceAppFirstStart: any =
      ratings?.params?.conditions?.minimum_duration_since_app_first_start;
    const dateAllowedAfterAppFirstStart = add(
      ratingsDataOfUser?.appFirstStartDate,
      minimumDurationSinceAppFirstStart,
    );
    if (
      ratingsDataOfUser?.appFirstStartDate &&
      isBefore(Date.now(), dateAllowedAfterAppFirstStart)
    ) {
      return false;
    }

    // No crash in last session criteria
    const minimumNumberOfAppStartsSinceLastCrash: number =
      ratings?.params?.conditions?.minimum_number_of_app_starts_since_last_crash;
    if (
      ratingsDataOfUser.numberOfAppStartsSinceLastCrash <
      minimumNumberOfAppStartsSinceLastCrash
    ) {
      return false;
    }

    return true;
  }, [
    currAppLanguage,
    ratingsDataOfUser,
    accountsCount,
    ratings?.params?.conditions?.minimum_accounts_number,
    ratings?.params?.conditions?.minimum_app_starts_number,
    ratings?.params?.conditions?.minimum_duration_since_app_first_start,
    ratings?.params?.conditions?.minimum_number_of_app_starts_since_last_crash,
  ]);

  const isHappyMomentTriggered = useCallback(
    (happyMoment: any, ratingsNewRoute?: string) =>
      (happyMoment.type === "on_enter" &&
        happyMoment.route_name === ratingsNewRoute) ||
      (happyMoment.type === "on_leave" &&
        happyMoment.route_name === ratingsOldRoute),
    [ratingsOldRoute],
  );

  const triggerRouteChange = useCallback(
    ratingsNewRoute => {
      if (!areRatingsConditionsMet()) return;

      if (ratingsHappyMoment?.timeout) {
        clearTimeout(ratingsHappyMoment?.timeout);
      }

      for (const happyMoment of ratings?.params?.happy_moments) {
        if (isHappyMomentTriggered(happyMoment, ratingsNewRoute)) {
          const timeout = setTimeout(() => {
            track("ReviewPromptStarted", { source: happyMoment.route_name });
            setRatingsModalOpenCallback(true);
          }, happyMoment.timer);
          dispatch(
            setRatingsHappyMoment({
              ...happyMoment,
              timeout,
            }),
          );
        }
      }
      dispatch(setRatingsCurrentRoute(ratingsNewRoute));
    },
    [
      areRatingsConditionsMet,
      ratingsHappyMoment,
      dispatch,
      ratings?.params?.happy_moments,
      isHappyMomentTriggered,
      setRatingsModalOpenCallback,
    ],
  );

  useEffect(() => {
    if (!ratings?.enabled) return;

    navigation.addListener("state", e => {
      const navState = e?.data?.state;
      if (navState && navState.routeNames) {
        const currentRoute = getCurrentRoute(navState);
        triggerRouteChange(currentRoute);
      }
    });

    return () => {
      navigation.removeListener("state");
    };
  }, [navigation, ratings?.enabled, triggerRouteChange]);

  return [isRatingsModalOpen, setRatingsModalOpenCallback];
};

export default useRatings;
