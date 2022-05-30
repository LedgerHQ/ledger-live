// @flow
import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { add, isBefore, parseISO } from "date-fns";
import type { Account } from "@ledgerhq/live-common/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { accountsSelector } from "../reducers/accounts";
import {
  ratingsModalOpenSelector,
  ratingsCurrentRouteNameSelector,
  ratingsHappyMomentSelector,
  ratingsDataOfUserSelector,
} from "../reducers/ratings";
import {
  setRatingsModalOpen,
  setRatingsCurrentRouteName,
  setRatingsHappyMoment,
  setRatingsDataOfUser,
} from "../actions/ratings";
import { languageSelector } from "../reducers/settings";
import { track } from "../analytics";

export type RatingsHappyMoment = {
    /** Name of the route that will trigger the rating flow */
    route_name: string,
    /** In milliseconds, delay before triggering the rating flow */
    timer: number,
    /** Whether the rating flow is triggered when entering or when leaving the screen */
    type: "on_enter" | "on_leave",
};

export type RatingsDataOfUser = {
    /** Date of the first time the user oppened the app */
    appFirstStartDate?: Date,
    /** Number of times the user oppened the application */
    numberOfAppStarts?: number,
    /** Number of times the user oppened the application since the last time his app crashed */
    numberOfAppStartsSinceLastCrash?: number,
    /** If set, we will not prompt the rating flow again before this date unless the user triggers it manually from the settings */
    dateOfNextAllowedRequest?: Date,
    /** Whether or not the user clicked on the "Not now" cta from the Enjoy step of the ratings flow */
    alreadyClosedFromEnjoyStep?: boolean,
    /** Whether or not the user already rated the app */
    alreadyRated?: boolean,
    /** If true, we will not prompt the rating flow again unless the user triggers it manually from the settings */
    doNotAskAgain?: boolean,
    /** "satisfied" if user clicked on the "Satisfied" cta in the ratings flow, "disappointed" if user clicked on the "I'm disappointed" in the ratings flow */
    satisfaction?: string,
};

const ratingsDataOfUserAsyncStorageKey = "ratingsDataOfUser";

const getCurrentRouteName = (
  state: NavigationState | Required<NavigationState["routes"][0]>["state"],
): Routes | undefined => {
  if (state.index === undefined || state.index < 0) {
    return undefined;
  }
  const nestedState = state.routes[state.index].state;
  if (nestedState !== undefined) {
    return getCurrentRouteName(nestedState);
  }
  return state.routes[state.index].name;
};

async function getRatingsDataOfUserFromStorage() {
  const ratingsDataOfUser = await AsyncStorage.getItem(
    ratingsDataOfUserAsyncStorageKey,
  );

  return JSON.parse(ratingsDataOfUser);
}

async function setRatingsDataOfUserInStorage(ratingsDataOfUser) {
  await AsyncStorage.setItem(
    ratingsDataOfUserAsyncStorageKey,
    JSON.stringify(ratingsDataOfUser),
  );
}

const useRatings = () => {
  const ratingsFeature = useFeature("ratings");

  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const ratingsOldRoute = useSelector(ratingsCurrentRouteNameSelector);
  const ratingsHappyMoment = useSelector(ratingsHappyMomentSelector);
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const accounts: Account[] = useSelector(accountsSelector);
  const currAppLanguage = useSelector(languageSelector);

  const accountsWithAmountCount = useMemo(() => accounts.filter(account => account.balance?.gt(0)).length, [accounts]);

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
      ratingsFeature?.params?.conditions?.minimum_accounts_number;
    if (minimumAccountsNumber && accountsWithAmountCount < minimumAccountsNumber) {
      return false;
    }

    // minimum app start number criteria
    const minimumAppStartsNumber: number =
    ratingsFeature?.params?.conditions?.minimum_app_starts_number;
    if (ratingsDataOfUser.numberOfAppStarts < minimumAppStartsNumber) {
      return false;
    }

    // duration since first app start long enough criteria
    const minimumDurationSinceAppFirstStart: Duration =
      ratingsFeature?.params?.conditions?.minimum_duration_since_app_first_start;
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
      ratingsFeature?.params?.conditions?.minimum_number_of_app_starts_since_last_crash;
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
    accountsWithAmountCount,
    ratingsFeature?.params?.conditions?.minimum_accounts_number,
    ratingsFeature?.params?.conditions?.minimum_app_starts_number,
    ratingsFeature?.params?.conditions?.minimum_duration_since_app_first_start,
    ratingsFeature?.params?.conditions?.minimum_number_of_app_starts_since_last_crash,
  ]);

  const isHappyMomentTriggered = useCallback(
    (happyMoment: RatingsHappyMoment, ratingsNewRoute?: string) =>
      (happyMoment.type === "on_enter" &&
        happyMoment.route_name === ratingsNewRoute) ||
      (happyMoment.type === "on_leave" &&
        happyMoment.route_name === ratingsOldRoute),
    [ratingsOldRoute],
  );

  const onRouteChange = useCallback(
    ratingsNewRoute => {
      if (ratingsHappyMoment?.timeout) {
        clearTimeout(ratingsHappyMoment?.timeout);
      }

      if (!areRatingsConditionsMet()) return;

      for (const happyMoment of ratingsFeature?.params?.happy_moments) {
        if (isHappyMomentTriggered(happyMoment, ratingsNewRoute)) {
          const timeout = setTimeout(() => {
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
      dispatch(setRatingsCurrentRouteName(ratingsNewRoute));
    },
    [
      areRatingsConditionsMet,
      ratingsHappyMoment?.timeout,
      dispatch,
      ratingsFeature?.params?.happy_moments,
      isHappyMomentTriggered,
      setRatingsModalOpenCallback,
    ],
  );

  const updateRatingsDataOfUserInStateAndStore = useCallback(ratingsDataOfUserUpdated => {
    dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
    setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
  }, [dispatch]);

  const initRatings = useCallback(() => {
    if (!ratingsFeature?.enabled) return;

    navigation.addListener("state", e => {
      const navState = e?.data?.state;
      if (navState && navState.routeNames) {
        const currentRouteName = getCurrentRouteName(navState);
        onRouteChange(currentRouteName);
      }
    });
  }, [navigation, ratingsFeature?.enabled, onRouteChange]);

  const initRatingsData = useCallback(() => {
    getRatingsDataOfUserFromStorage().then(ratingsDataOfUser => {
      updateRatingsDataOfUserInStateAndStore({
        ...ratingsDataOfUser,
        appFirstStartDate: ratingsDataOfUser?.appFirstStartDate || Date.now(),
        numberOfAppStarts: (ratingsDataOfUser?.numberOfAppStarts ?? 0) + 1,
        numberOfAppStartsSinceLastCrash:
          (ratingsDataOfUser?.numberOfAppStartsSinceLastCrash ?? 0) + 1,
      });
    });
  }, []);

  const cleanRatings = useCallback(() => {
    navigation.removeListener("state");
  }, [navigation]);

  const ratingsInitialStep = useMemo(
    () => (ratingsDataOfUser?.alreadyClosedFromEnjoyStep ? "enjoy" : "init"),
    [ratingsDataOfUser?.alreadyClosedFromEnjoyStep],
  );

  const handleSettingsRateApp = useCallback(() => {
    dispatch(
      setRatingsHappyMoment({
        route_name: "Settings",
      }),
    );
    track("button_clicked", {
      flow: "review",
      button: "manual_review",
      source: "Settings",
      params: ratingsFeature?.params,
    });
    setRatingsModalOpenCallback(true);
  }, [dispatch, ratingsFeature?.params, setRatingsModalOpenCallback]);

  const handleRatingsSetDateOfNextAllowedRequest = useCallback((delay, additionalParams) => {
    if (delay !== null && delay !== undefined) {
      const dateOfNextAllowedRequest: Date = add(
        Date.now(),
        delay
      );
      updateRatingsDataOfUserInStateAndStore({
        ...ratingsDataOfUser,
        dateOfNextAllowedRequest,
        ...additionalParams,
      });
    }
  }, [ratingsDataOfUser, updateRatingsDataOfUserInStateAndStore]);

  const handleEnjoyNotNow = useCallback(() => {
    if (ratingsDataOfUser?.alreadyClosedFromEnjoyStep) {
      updateRatingsDataOfUserInStateAndStore({
        ...ratingsDataOfUser,
        doNotAskAgain: true,
        alreadyClosedFromEnjoyStep: false,
      });
    } else {
      handleRatingsSetDateOfNextAllowedRequest(
        ratingsFeature?.params?.conditions?.satisfied_then_not_now_delay,
        {
          alreadyClosedFromEnjoyStep: true,
        },
      );
    }
  }, [
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsDataOfUser,
    ratingsFeature?.params?.conditions?.satisfied_then_not_now_delay,
    updateRatingsDataOfUserInStateAndStore,
  ]);

  const handleGoToStore = useCallback(() => {
    updateRatingsDataOfUserInStateAndStore({
      ...ratingsDataOfUser,
      alreadyRated: true,
      doNotAskAgain: true,
    });
  }, [ratingsDataOfUser, updateRatingsDataOfUserInStateAndStore]);

  const handleSatisfied = useCallback(() => {
    updateRatingsDataOfUserInStateAndStore({
      ...ratingsDataOfUser,
      satisfaction: "satisfied",
    });
  }, [ratingsDataOfUser, updateRatingsDataOfUserInStateAndStore]);

  return {
    initRatings,
    initRatingsData,
    cleanRatings,
    handleSettingsRateApp,
    handleRatingsSetDateOfNextAllowedRequest,
    handleEnjoyNotNow,
    handleGoToStore,
    handleSatisfied,
    ratingsFeatureParams: ratingsFeature?.params,
    ratingsInitialStep,
    isRatingsModalOpen,
    ratingsHappyMoment,
    setRatingsModalOpen: setRatingsModalOpenCallback,
  };
};

export default useRatings;
