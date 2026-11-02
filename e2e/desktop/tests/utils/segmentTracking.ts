import { expect, type Page, type Response } from "@playwright/test";
import { step } from "tests/misc/reporters/step";

const SEGMENT_TRACK_URL = "https://api.segment.io/v1/t";

export class SegmentTracking {
  private readonly trackResponses: Response[] = [];

  constructor(private readonly page: Page) {}

  private readonly hasAcceptedEventWithUserId = () =>
    this.trackResponses.some(
      response => response.status() === 200 && !!response.request().postDataJSON()?.userId,
    );

  @step("Record the events the app sends to Segment")
  recordTrackedEvents(): Promise<void> {
    this.page.on("response", response => {
      if (response.url() === SEGMENT_TRACK_URL) this.trackResponses.push(response);
    });
    return Promise.resolve();
  }

  @step("Expect Segment to accept an event tracked with the user id")
  async expectEventTrackedWithUserId() {
    await expect
      .poll(this.hasAcceptedEventWithUserId, {
        message: `No ${SEGMENT_TRACK_URL} request carrying a userId got a 200`,
      })
      .toBe(true);
  }
}
