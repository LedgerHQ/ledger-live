import Transport from "@ledgerhq/hw-transport";
import { Observable } from "rxjs";

export enum ToggleTypeP2 {
  EnterChecking = 0x00,
  ExitChecking = 0x01,
}

export type ToggleOnboardingEarlyCheckCmdEvent = { type: "success" };

/**
 * During the onboarding, makes the device enter or exit the early security check steps
 *
 * This command only puts (or moves out) the device to the state/step of the early security check.
 * It does not starts any "security checks".
 *
 * This new “checking” APDU is only supported in WELCOME and WELCOME_STEP2 onboarding state.
 * This command will throw an error if the device is not in one of those 2 onboarding state.
 *
 * @param transport a Transport instance
 * @param p2 the APDU p2 value limited to ToggleTypeP2 enum values representing enter or exit
 * @returns An observable that emits a success event. Otherwise throws an error.
 */
export function toggleOnboardingEarlyCheckCmd({
  transport,
  p2,
}: {
  transport: Transport;
  p2: ToggleTypeP2;
}): Observable<ToggleOnboardingEarlyCheckCmdEvent> {
  return new Observable((subscriber) => {
    transport
      .send(0xe0, 0x03, 0x00, p2)
      .then(() => {
        subscriber.next({ type: "success" });
        subscriber.complete();
      })
      .catch((error) => {
        subscriber.error(error);
      });
  });
}
