import { Plugin, PluginType, SegmentEvent } from "@segment/analytics-react-native";

export class AnonymousIpPlugin extends Plugin {
  type = PluginType.enrichment;

  execute(event: SegmentEvent) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (event?.context) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      event.context.ip = "0.0.0.0";
    }
    return event;
  }
}
