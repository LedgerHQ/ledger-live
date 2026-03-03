module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    (message) => /^File .+ was translated to .+ locale/.test(message.trim()),
  ],
};
