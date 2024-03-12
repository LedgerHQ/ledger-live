import {
  DestinationPlugin,
  IdentifyEventType,
  isNumber,
  isString,
  isBoolean,
  isDate,
  PluginType,
  TrackEventType,
  UserInfoState,
  isObject,
  objectToString,
  SegmentAPISettings,
  UpdateType,
  JsonMap,
  SegmentBrazeSettings,
  unknownToString,
} from "@segment/analytics-react-native";
import Braze, { GenderTypes, MonthsAsNumber } from "@braze/react-native-sdk";

const deepCompare = (obj1: any, obj2: any) => {
  // Check if both parameters are objects
  if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
    return obj1 === obj2;
  }

  // Get the keys of each object
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Check if the number of keys is the same
  if (keys1.length !== keys2.length) {
    return false;
  }

  // Iterate through keys and recursively compare values
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
      return false;
    }
  }

  // If all checks passed, the objects are deeply equal
  return true;
};

const flush = () => {
  Braze.requestImmediateDataFlush();
};

interface AttributionProperties {
  network: string;
  campaign: string;
  adGroup: string;
  creative: string;
}

const defaultProperties: AttributionProperties = {
  network: "",
  campaign: "",
  adGroup: "",
  creative: "",
};

export class BrazePlugin extends DestinationPlugin {
  type = PluginType.destination;
  key = "Appboy";
  private lastSeenTraits: UserInfoState | undefined;
  private revenueEnabled = false;

  update(settings: SegmentAPISettings, _: UpdateType) {
    const brazeSettings = settings.integrations[this.key] as SegmentBrazeSettings;
    if (brazeSettings.logPurchaseWhenRevenuePresent === true) {
      this.revenueEnabled = true;
    }
  }

  /**
   * Cleans up the attributes to only send valid values to Braze SDK
   * @param value value of any type
   * @returns value if type is valid, undefined if the type is not supported by Braze
   */
  private sanitizeAttribute = (
    value: unknown,
  ): string | number | boolean | Date | string[] | null | undefined => {
    // All basic values
    if (value === null || isNumber(value) || isString(value) || isBoolean(value) || isDate(value)) {
      return value;
    }

    // Arrays and objects we will attempt to serialize
    if (Array.isArray(value)) {
      return value.map(v => {
        if (isObject(v)) {
          return objectToString(v) ?? "";
        }
        return `${v}`;
      });
    }

    if (isObject(value)) {
      return objectToString(value);
    }

    return undefined;
  };

  identify(event: IdentifyEventType) {
    //check to see if anything has changed.
    //if it hasn't changed don't send event
    console.log("EVENT", event);
    const identical =
      this.lastSeenTraits?.traits === undefined
        ? false
        : deepCompare(this.lastSeenTraits.traits, event.traits);

    if (
      this.lastSeenTraits?.userId === event.userId &&
      this.lastSeenTraits?.anonymousId === event.anonymousId &&
      identical
    ) {
      return;
    } else {
      if (event.userId !== undefined && event.userId !== null) {
        Braze.changeUser(event.userId);
      }

      if (event.traits?.birthday !== undefined) {
        const birthday = new Date(event.traits.birthday);
        if (birthday !== undefined && birthday !== null && !isNaN(birthday.getTime())) {
          const data = new Date(event.traits.birthday);
          Braze.setDateOfBirth(
            data.getFullYear(),
            // getMonth is zero indexed
            (data.getMonth() + 1) as MonthsAsNumber,
            data.getDate(),
          );
        } else {
          this.analytics?.logger.warn(
            `Birthday found "${event.traits?.birthday}" could not be parsed as a Date. Try converting to ISO format.`,
          );
        }
      }

      if (event.traits?.email !== undefined) {
        Braze.setEmail(event.traits.email);
      }

      if (event.traits?.firstName !== undefined) {
        Braze.setFirstName(event.traits.firstName);
      }

      if (event.traits?.lastName !== undefined) {
        Braze.setLastName(event.traits.lastName);
      }

      if (event.traits?.gender !== undefined) {
        const validGenders = ["m", "f", "n", "o", "p", "u"];
        const isValidGender = validGenders.indexOf(event.traits.gender) > -1;
        if (isValidGender) {
          Braze.setGender(event.traits.gender as GenderTypes[keyof GenderTypes]);
        }
      }

      if (event.traits?.phone !== undefined) {
        Braze.setPhoneNumber(event.traits.phone);
      }

      if (event.traits?.address !== undefined) {
        if (event.traits.address.city !== undefined) {
          Braze.setHomeCity(event.traits.address.city);
        }
        if (event.traits?.address.country !== undefined) {
          Braze.setCountry(event.traits.address.country);
        }
      }

      const appBoyTraits = [
        "birthday",
        "email",
        "firstName",
        "lastName",
        "gender",
        "phone",
        "address",
      ];

      Object.entries(event.traits ?? {}).forEach(([key, value]) => {
        const sanitized = this.sanitizeAttribute(value);
        if (sanitized !== undefined && appBoyTraits.indexOf(key) < 0) {
          console.log("SET CUSTOM ATTRIBUTE", key, sanitized);
          Braze.setCustomUserAttribute(key, sanitized);
        }
      });

      this.lastSeenTraits = {
        anonymousId: event.anonymousId ?? "",
        userId: event.userId,
        traits: event.traits,
      };
    }
    return event;
  }

  track(event: TrackEventType) {
    const eventName = event.event;
    const revenue = this.extractRevenue(event.properties, "revenue");

    if (event.event === "Install Attributed") {
      if (event.properties?.campaign !== undefined && event.properties?.campaign !== null) {
        const attributionData: unknown = event.properties.campaign;
        let network: string, campaign: string, adGroup: string, creative: string;

        if (isObject(attributionData)) {
          network =
            unknownToString(attributionData.source, true, undefined, undefined) ??
            defaultProperties.network;
          campaign =
            unknownToString(attributionData.name, true, undefined, undefined) ??
            defaultProperties.campaign;
          adGroup =
            unknownToString(attributionData.ad_group, true, undefined, undefined) ??
            defaultProperties.adGroup;
          creative =
            unknownToString(attributionData.ad_creative, true, undefined, undefined) ??
            defaultProperties.creative;
        } else {
          network = defaultProperties.network;
          campaign = defaultProperties.campaign;
          adGroup = defaultProperties.adGroup;
          creative = defaultProperties.creative;
        }
        Braze.setAttributionData(network, campaign, adGroup, creative);
      }
    }

    if (eventName === "Order Completed" || eventName === "Completed Order") {
      this.logPurchaseEvent(event);
    } else if (this.revenueEnabled === true && revenue !== 0 && revenue !== undefined) {
      this.logPurchaseEvent(event);
    } else {
      Braze.logCustomEvent(eventName, event.properties);
    }
    return event;
  }

  flush() {
    flush();
  }

  extractRevenue = (properties: JsonMap | undefined, key: string) => {
    if (!properties) {
      return 0;
    }

    const revenue = properties[key];
    if (revenue !== undefined && revenue !== null) {
      switch (typeof revenue) {
        case "string":
          return parseFloat(revenue);
        case "number":
          return revenue;
        default:
          return 0;
      }
    } else {
      return 0;
    }
  };

  logPurchaseEvent(event: TrackEventType) {
    // Make USD as the default currency.
    let currency = "USD";
    const revenue = this.extractRevenue(event.properties, "revenue");
    if (typeof event.properties?.currency === "string" && event.properties.currency.length === 3) {
      currency = event.properties.currency;
    }
    if (event.properties) {
      const appBoyProperties = Object.assign({}, event.properties);
      delete appBoyProperties.currency;
      delete appBoyProperties.revenue;

      if (appBoyProperties.products !== undefined && appBoyProperties.products !== null) {
        const products = (appBoyProperties.products as unknown[]).slice(0);
        delete appBoyProperties.products;

        products.forEach(product => {
          const productDict = Object.assign({}, isObject(product) ? product : {});
          const productId =
            unknownToString(productDict.product_id, true, undefined, undefined) ?? "";
          const productRevenue = this.extractRevenue(productDict as unknown as JsonMap, "price");
          const productQuantity = isNumber(productDict.quantity) ? productDict.quantity : 1;
          delete productDict.product_id;
          delete productDict.price;
          delete productDict.quantity;
          const productProperties = Object.assign({}, appBoyProperties, productDict);
          Braze.logPurchase(
            unknownToString(productId) ?? "",
            String(productRevenue),
            currency,
            productQuantity,
            productProperties,
          );
        });
      } else {
        Braze.logPurchase(event.event, String(revenue), currency, 1, appBoyProperties);
      }
    } else {
      Braze.logPurchase(event.event, String(revenue), currency, 1);
    }
  }
}
