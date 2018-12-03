// @flow

import uuid from "uuid/v4";
import db from "./db";

// a user is an anonymous way to identify a same instance of the app
let user;

export default async () => {
  if (!user) {
    user = await db.get("user");
  }
  if (!user) {
    user = { id: uuid() };
    await db.update("user", user);
    return { user, created: true };
  }
  return { user, created: false };
};
