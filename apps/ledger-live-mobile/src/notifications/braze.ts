/* eslint-disable no-console */
import Braze from "react-native-appboy-sdk";
import getOrCreateUser from "../user";

export const start = async () => {
  const { user, created } = await getOrCreateUser();
  console.log("SETTING UP BRAZE USER, created :", created);
  Braze.changeUser(user.id);
  console.log("BRAZE USER SET UP WITH ID :", user.id);
};
