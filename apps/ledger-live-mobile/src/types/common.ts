// TODO should drop this file!,
// FIXME then drop it, i'm not here for that.
export type T = (
  arg0: string | null | undefined,
  arg1: Record<string, any> | null | undefined,
) => string;
export type ConfirmationDefaults = {
  confirmationsNb:
    | {
        min: number;
        def: number;
        max: number;
      }
    | null
    | undefined;
};
