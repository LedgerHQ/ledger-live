// @flow

// TODO should drop this file!

export type T = (?string, ?Object) => string;

export type ConfirmationDefaults = {
  confirmationsNb: ?{
    min: number,
    def: number,
    max: number,
  },
};
