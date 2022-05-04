import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { add } from "date-fns";
import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
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
  setStep: any;
};

const Init = ({ closeModal, setStep }: Props) => {
  const ratingsFeature = useFeature("ratings");
  const dispatch = useDispatch();
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const ratingsHappyMoment = useSelector(ratingsHappyMomentSelector);
  const goToEnjoy = useCallback(() => {
    setStep("enjoy");
    track("Satisfied", { source: ratingsHappyMoment.route_name });
  }, [ratingsHappyMoment.route_name, setStep]);
  const goToDisappointed = useCallback(() => {
    setStep("disappointed");
    track("Disappointed", { source: ratingsHappyMoment.route_name });
    if (ratingsFeature?.params?.conditions?.disappointed_delay) {
      const dateOfNextAllowedRequest: any = add(
        Date.now(),
        ratingsFeature?.params?.conditions?.disappointed_delay,
      );
      const ratingsDataOfUserUpdated = {
        ...ratingsDataOfUser,
        dateOfNextAllowedRequest,
      };
      dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
      setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
    }
  }, [
    dispatch,
    ratingsFeature?.params?.conditions?.disappointed_delay,
    ratingsDataOfUser,
    ratingsHappyMoment.route_name,
    setStep,
  ]);
  const onNotNow = useCallback(() => {
    closeModal();
    track("NotNow", { source: ratingsHappyMoment.route_name });
    if (ratingsFeature?.params?.conditions?.not_now_delay) {
      const dateOfNextAllowedRequest: any = add(
        Date.now(),
        ratingsFeature?.params?.conditions?.not_now_delay,
      );
      const ratingsDataOfUserUpdated = {
        ...ratingsDataOfUser,
        dateOfNextAllowedRequest,
      };
      dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
      setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
    }
  }, [
    closeModal,
    dispatch,
    ratingsFeature?.params?.conditions?.not_now_delay,
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
        <Trans i18nKey="ratings.init.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        my={6}
      >
        <Trans i18nKey="ratings.init.description" />
      </Text>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToEnjoy} outline event="AddDevice" type="shade">
          <Trans i18nKey="ratings.init.cta.enjoy" />
        </Button>
        <Button
          onPress={goToDisappointed}
          outline
          event="AddDevice"
          type="shade"
          mt={3}
        >
          <Trans i18nKey="ratings.init.cta.disappointed" />
        </Button>
        <NotNowButton onPress={onNotNow} event="AddDevice">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.init.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Init;
