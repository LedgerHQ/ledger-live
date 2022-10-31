import Braze from "react-native-appboy-sdk";
import getOrCreateUser from "../user";

export const start = async () => {
  const { user } = await getOrCreateUser();
  Braze.changeUser(user.id);
};
