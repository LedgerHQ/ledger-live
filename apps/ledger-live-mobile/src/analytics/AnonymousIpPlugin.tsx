import {
  Plugin,
  PluginType,
  SegmentEvent,
} from "@segment/analytics-react-native";

export class AnonymousIpPlugin extends Plugin {
  type = PluginType.enrichment;

  execute(event: SegmentEvent) {
    (event as any).context.ip = "0.0.0.0";
    return event;
  }
}
