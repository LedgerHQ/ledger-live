import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { add } from "date-fns";
import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { setRatingsDataOfUserInStorage } from "../../logic/ratings";
import { ratingsDataOfUserSelector } from "../../reducers/ratings";
import { setRatingsDataOfUser } from "../../actions/ratings";

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
  const ratings = {
    enabled: true,
    happy_moments: [
      {
        route_name: "ReceiveConfirmation",
        timer: 2000,
        type: "on_leave",
      },
      {
        route_name: "ClaimRewardsValidationSuccess",
        timer: 2000,
        type: "on_enter",
      },
      {
        route_name: "SendValidationSuccess",
        timer: 2000,
        type: "on_enter",
      },
      {
        route_name: "MarketDetail",
        timer: 3000,
        type: "on_enter",
      },
    ],
    conditions: {
      not_now_delay: { days: 15 },
      disappointed_delay: { days: 90 },
      minimum_accounts_number: 0,
      minimum_app_starts_number: 3,
      minimum_duration_since_app_first_start: {
        days: 0,
      },
      minimum_number_of_app_starts_since_last_crash: 2,
    },
  }; // useFeature("learn"); // TODO : replace learn with ratings
  const dispatch = useDispatch();
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const goToEnjoy = useCallback(() => {
    setStep("enjoy");
  }, [setStep]);
  const goToDisappointed = useCallback(() => {
    setStep("disappointed");
    if (ratings?.conditions?.disappointed_delay) {
      const dateOfNextAllowedRequest: any = add(
        Date.now(),
        ratings?.conditions?.disappointed_delay,
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
    ratings?.conditions?.disappointed_delay,
    ratingsDataOfUser,
    setStep,
  ]);
  const onNotNow = useCallback(() => {
    closeModal();
    if (ratings?.conditions?.not_now_delay) {
      const dateOfNextAllowedRequest: any = add(
        Date.now(),
        ratings?.conditions?.not_now_delay,
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
    ratings?.conditions?.not_now_delay,
    ratingsDataOfUser,
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
