import type { Opts, Res } from ".";

// Dummy function - to please typescript
const dummy = (_?: Opts): Res => ({
  fontFamily: "",
  fontWeight: "normal",
});

export default dummy;
