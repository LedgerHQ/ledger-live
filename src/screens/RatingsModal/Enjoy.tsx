import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { Linking, Platform, TouchableOpacity } from "react-native";
import { add } from "date-fns";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { urls } from "../../config/urls";
import { setRatingsDataOfUserInStorage } from "../../logic/ratings";
import {
  ratingsDataOfUserSelector,
  ratingsHappyMomentSelector,
} from "../../reducers/ratings";
import { setRatingsDataOfUser } from "../../actions/ratings";
import { track } from "../../analytics";

const NotNowButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

type Props = {
  closeModal: any;
};

const Enjoy = ({ closeModal }: Props) => {
  const ratingsFeature = useFeature("ratings");

  const dispatch = useDispatch();
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const ratingsHappyMoment = useSelector(ratingsHappyMomentSelector);
  const goToStore = useCallback(() => {
    track("RedirectedToStore", { source: ratingsHappyMoment.route_name });
    Linking.openURL(
      Platform.OS === "ios" ? urls.applestoreRate : urls.playstore,
    );
    closeModal();
    const ratingsDataOfUserUpdated = {
      ...ratingsDataOfUser,
      alreadyRated: true,
      doNotAskAgain: true,
    };
    dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
    setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
  }, [closeModal, dispatch, ratingsDataOfUser, ratingsHappyMoment.route_name]);
  const onNotNow = useCallback(() => {
    track("NotNow", { source: ratingsHappyMoment.route_name });
    closeModal();
    if (ratingsDataOfUser.alreadyClosedFromEnjoyStep) {
      const ratingsDataOfUserUpdated = {
        ...ratingsDataOfUser,
        doNotAskAgain: true,
      };
      dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
      setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
    } else if (ratingsFeature?.params?.conditions?.satisfied_then_not_now_delay) {
      const dateOfNextAllowedRequest: any = add(
        Date.now(),
        ratingsFeature?.params?.conditions?.satisfied_then_not_now_delay,
      );
      const ratingsDataOfUserUpdated = {
        ...ratingsDataOfUser,
        dateOfNextAllowedRequest,
        alreadyClosedFromEnjoyStep: true,
      };
      dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
      setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
    }
  }, [
    closeModal,
    dispatch,
    ratingsFeature?.params?.conditions?.satisfied_then_not_now_delay,
    ratingsDataOfUser,
    ratingsHappyMoment.route_name,
  ]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        <Trans i18nKey="ratings.enjoy.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        my={6}
      >
        <Trans i18nKey="ratings.enjoy.description" />
      </Text>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToStore} event="AddDevice" type="main">
          <Trans i18nKey="ratings.enjoy.cta.rate" />
        </Button>
        <NotNowButton onPress={onNotNow} event="AddDevice">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.enjoy.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Enjoy;
