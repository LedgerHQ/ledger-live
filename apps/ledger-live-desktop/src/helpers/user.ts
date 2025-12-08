import { v4 as uuid } from "uuid";
import { setKey, getKey } from "~/renderer/storage";

/**
 * @deprecated Use userIdSelector from reducers/identities instead.
 * This function is kept for backward compatibility during migration.
 * All usages should be migrated to use the new identities system with userIdSelector.
 *
 * Migration example:
 * ```typescript
 * import { userIdSelector } from "~/renderer/reducers/identities";
 * const userId = userIdSelector(state);
 * if (userId) {
 *   const userIdString = userId.exportUserIdFor__PURPOSE__();
 *   // use userIdString
 * }
 * ```
 */
export default async () => {
  let user = await getKey("app", "user");
  if (!user) {
    user = {
      id: uuid(),
    };
    setKey("app", "user", user);
  }
  return user;
};
/**
 * @deprecated Use userIdSelector from reducers/identities instead.
 * This function is kept only for migration purposes in initIdentities.
 * All other usages should be migrated to use the new identities system.
 */
export const getUserId = () => {
  if (typeof window === "object") {
    const { localStorage } = window;
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = uuid();
      localStorage.setItem("userId", userId);
      return userId;
    }
    return localStorage.getItem("userId");
  }
  throw new Error("user is only to be called from renderer");
};
