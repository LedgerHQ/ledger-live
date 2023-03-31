import React, { useMemo, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

import { navigationRef } from "../rootnavigation";

export type Args = {
  headerShown?: boolean;
  title?: string;
  HeaderLeft?: React.ComponentType | null;
  HeaderRight?: React.ComponentType | null;
};

/**
 * Hook to update dynamically the react-navigation header
 *
 * The header is reset to its initial options/settings when the component calling this hook is unmounted.
 *
 * @param headerShown true (default): header is displayed, false: header is not displayed
 * @param title string displayed as the title of the header.
 * @param HeaderLeft React component displayed on the left of the header.
 *   `components/HeaderLeftBack` should be used for basic back arrow.
 *   Set to `undefined` in order to reset to the default HeaderLeft, or `null` to display nothing.
 * @param HeaderRight React component displayed on the right of the header.
 *   `components/HeaderRightClose.tsx` should be used for basic close button.
 *   Set to `undefined` in order to reset to the default HeaderRight, or `null` to display nothing.
 */
export const useSetNavigationHeader = ({
  headerShown = true,
  title,
  HeaderLeft,
  HeaderRight,
}: Args) => {
  const navigation = useNavigation();

  const initialHeaderOptions = useMemo(() => {
    const {
      headerShown: initialHeaderShown,
      headerTitle: initialHeaderTitle,
      headerLeft: initialHeaderLeft,
      headerRight: initialHeaderRight,
      title: initialTitle,
    } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigationRef.current?.getCurrentOptions() as any;

    return {
      headerShown: initialHeaderShown,
      headerTitle: initialHeaderTitle,
      headerLeft: initialHeaderLeft,
      headerRight: initialHeaderRight,
      title: initialTitle,
    };
  }, []);

  // Resets to initial header options/settings.
  // No need to reset on react-navigation navigate because the new screen that we navigate to
  // always defines a (default) header that is going to overwrite this.
  useEffect(() => {
    return () => navigation.setOptions(initialHeaderOptions);
  }, [initialHeaderOptions, navigation]);

  // Updates header on dynamic changes
  useEffect(() => {
    // Checks on `undefined`:
    // if anOption = undefined, anOption resulting from { ...initialHeaderOptions, anOption } is set to undefined
    // which results in the case of react-navigation in using the default value for anOption,
    // which can be different than the one set initially before rendering the associated component.
    // Wanted behavior: if `undefined`, then initial value
    navigation.setOptions({
      headerShown:
        headerShown === undefined
          ? initialHeaderOptions.headerShown
          : headerShown,
      title: title === undefined ? initialHeaderOptions.title : title,
      headerLeft:
        HeaderLeft === undefined ? initialHeaderOptions.headerLeft : HeaderLeft,
      headerRight:
        HeaderRight === undefined
          ? initialHeaderOptions.headerRight
          : HeaderRight,
    });
  }, [
    HeaderLeft,
    headerShown,
    HeaderRight,
    navigation,
    title,
    initialHeaderOptions,
  ]);
};
