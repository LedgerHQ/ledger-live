// @flow

// Infer a "pname" aka short id version of process name

const pname = typeof window === "undefined" ? "main" : "renderer";

export default pname;
