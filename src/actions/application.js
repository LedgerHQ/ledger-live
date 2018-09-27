// @flow

export const unlock = () => ({
  type: "APPLICATION_SET_DATA",
  payload: {
    isLocked: false,
  },
});
export const lock = () => ({
  type: "APPLICATION_SET_DATA",
  payload: {
    isLocked: true,
  },
});
