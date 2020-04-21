// @flow

import uuid from "uuid/v4";
import { getUser, setUser } from "./db";

// a user is an anonymous way to identify a same instance of the app
let user;

export default async () => {
  if (!user) {
    user = await getUser();
  }
  if (!user) {
    user = { id: uuid() };
    await setUser(user);
    return { user, created: true };
  }
  return { user, created: false };
};
