import { StepDescription } from '../../types';
import { msg } from '../../utils';

export class DetoxGenymotionManager {
  static setLocation(lat: number, lon: number): StepDescription {
    return msg(`Set location to (${lat}, ${lon})`, { latitude: lat, longitude: lon });
  }

  static getGenymotionManager(): StepDescription {
    return msg('Get Genymotion manager');
  }
}
