import { APIRequestContext } from "@playwright/test";

export class SpeculosDriver {
  readonly request: APIRequestContext;

  constructor(speculosApiContext: APIRequestContext) {
    this.request = speculosApiContext;
  }

  /**
   * Press left button and release it.
   */
  async pressLeftButton() {
    await this.request.post(`/button/left`, { data: { action: "press-and-release" } });
  }

  /**
   * Press right button and release it.
   * @returns List of speculos events
   */
  async pressRightButton() {
    await this.request.post(`/button/right`, { data: { action: "press-and-release" } });
  }

  /**
   * Press both buttons and release them.
   */
  async pressBothButtons() {
    await this.request.post(`/button/both`, { data: { action: "press-and-release" } });

    // Reset events for next use
    await this.request.delete(`/events`);
  }

  async getLastEvents() {
    const screen = await (await this.request.get(`/events`)).json();

    const lastEvent = screen.events[screen.events.length - 1];
    let recipientAddress = "";

    if (lastEvent.text === "Approve" || lastEvent.text === "Reject") {
      for (let i = 0; i < screen.events.length; i++) {
        if (screen.events[i].text.startsWith("Address")) {
          recipientAddress += screen.events[i + 1].text;
        }
      }
    }

    return { recipientAddress };
  }
}
