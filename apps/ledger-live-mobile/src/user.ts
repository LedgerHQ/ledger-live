import { v4 as uuid } from "uuid";
import { getUser, setUser, updateUser as _updateUser } from "./db";
import type { MaybeUser } from "./types/store";
// Nb a user is an anonymous way to identify a same instance of the app
let user: MaybeUser;

async function updateUser() {
  user = {
    id: uuid(),
  };
  await _updateUser(user);
  return {
    user,
    created: false,
  };
}

export default async () => {
  if (!user) {
    user = await getUser();
  }

  if (!user) {
    user = {
      id: uuid(),
    };
    await setUser(user);
    return {
      user,
      created: true,
    };
  }

  return {
    user,
    created: false,
  };
};
export { updateUser };
