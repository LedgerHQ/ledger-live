import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

process.env = {
  ...process.env,
  NODE_ENV: (process.env || {}).NODE_ENV || "production",
};
