import timemachine from "timemachine";
import api, { toggleMockIncident } from "../test-helpers/serviceStatus";
timemachine.config({
  dateString: "February 22, 2021 13:12:59",
});
describe("Service Status", () => {
  it("should not have any incidents", async () => {
    const res = await api.fetchStatusSummary();
    expect(res.incidents).toHaveLength(0);
  });
  it("should have incidents", async () => {
    let res = await api.fetchStatusSummary();
    expect(res.incidents).toHaveLength(0);
    toggleMockIncident();
    res = await api.fetchStatusSummary();
    expect(res.incidents).toHaveLength(1);
  });
});
