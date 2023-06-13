let verbose = false;

const log = str => {
  if (verbose) {
    console.log(`[health-checks] ${str}`);
  }
};

const checkEnv = nightly => _ctx => {
  const platform = require("os").platform();

  // const { GH_TOKEN, APPLEID, APPLEID_PASSWORD } = process.env;
  const { APPLEID, APPLEID_PASSWORD } = process.env;

  // if (!GH_TOKEN) {
  //   throw new Error("GH_TOKEN is not set");
  // }

  // log("GH_TOKEN is set");

  // ctx.token = GH_TOKEN;GH

  if (!nightly) {
    if (platform !== "darwin") {
      log("OS is not mac, skipping APPLEID and APPLEID_PASSWORD check");
      return;
    }

    if (!APPLEID || !APPLEID_PASSWORD) {
      throw new Error("APPLEID and/or APPLEID_PASSWORD are not net");
    } else {
      log("APPLEID and APPLEID_PASSWORD are set");
    }
  }
};

module.exports = args => {
  verbose = !!args.verbose;

  return [
    {
      title: "Check for required environment variables",
      task: checkEnv(args.nightly),
    },
  ];
};
