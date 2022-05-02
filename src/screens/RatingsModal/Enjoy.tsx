import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { Linking, Platform, TouchableOpacity } from "react-native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { urls } from "../../config/urls";
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
};

const Enjoy = ({ closeModal }: Props) => {
  const dispatch = useDispatch();

  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const goToStore = useCallback(() => {
    Linking.openURL(
      Platform.OS === "ios" ? urls.applestoreRate : urls.playstore,
    );
    closeModal();
    const ratingsDataOfUserUpdated = {
      ...ratingsDataOfUser,
      alreadyRated: true,
    };
    dispatch(setRatingsDataOfUser(ratingsDataOfUserUpdated));
    setRatingsDataOfUserInStorage(ratingsDataOfUserUpdated);
  }, [closeModal, dispatch, ratingsDataOfUser]);

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
        <NotNowButton onPress={closeModal} event="AddDevice">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.enjoy.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Enjoy;
