import nock from "nock";

export default async () => {
  // Cleans every active mock
  nock.cleanAll();
};
