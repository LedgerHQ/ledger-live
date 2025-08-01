module.exports = async () => {
  /**
   * Set the timezone to EST for all tests
   * This allow us to run tests directly through jest without having to manually
   * set the timezone as an env var beforehand, either manually or through a
   * custom script in package.json
   */
  process.env.TZ = "America/New_York";
};
