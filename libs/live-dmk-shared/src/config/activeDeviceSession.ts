import {
  type ConnectedDevice,
  type DeviceManagementKit,
  DeviceStatus,
} from "@ledgerhq/device-management-kit";
import { BehaviorSubject, type Subscription } from "rxjs";

export type ActiveDeviceSession = {
  sessionId: string;
  dmk: DeviceManagementKit;
};

type StoredActiveDeviceSession = ActiveDeviceSession & {
  subscription: Subscription;
};

type ActiveDeviceSessionPredicate = (
  session: ActiveDeviceSession,
  connectedDevice: ConnectedDevice,
) => boolean;

export class ActiveDeviceSessionRegistry {
  private readonly sessions = new Map<string, StoredActiveDeviceSession>();

  private readonly sessionsSubject = new BehaviorSubject<ActiveDeviceSession[]>([]);

  addSession(session: ActiveDeviceSession): void {
    this.removeSession(session.sessionId);

    let shouldKeepSession = true;
    const subscription = session.dmk
      .getDeviceSessionState({ sessionId: session.sessionId })
      .subscribe({
        next: state => {
          if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
            shouldKeepSession = false;
            this.removeSession(session.sessionId);
          }
        },
        error: () => {
          shouldKeepSession = false;
          this.removeSession(session.sessionId);
        },
        complete: () => {
          shouldKeepSession = false;
          this.removeSession(session.sessionId);
        },
      });

    if (!shouldKeepSession) {
      subscription.unsubscribe();
      return;
    }

    this.sessions.set(session.sessionId, { ...session, subscription });
    this.emitSessions();
  }

  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    session.subscription.unsubscribe();
    this.sessions.delete(sessionId);
    this.emitSessions();
  }

  getSession(sessionId: string): ActiveDeviceSession | null {
    const session = this.sessions.get(sessionId);

    return session ? this.toPublicSession(session) : null;
  }

  getSessions(): ActiveDeviceSession[] {
    return Array.from(this.sessions.values(), session => this.toPublicSession(session));
  }

  getConnectedDevice(sessionId: string): ConnectedDevice | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    try {
      return session.dmk.getConnectedDevice({ sessionId });
    } catch {
      this.removeSession(sessionId);
      return null;
    }
  }

  findSession(predicate: ActiveDeviceSessionPredicate): ActiveDeviceSession | null {
    for (const session of this.getSessions()) {
      const connectedDevice = this.getConnectedDevice(session.sessionId);

      if (connectedDevice && predicate(session, connectedDevice)) {
        return session;
      }
    }

    return null;
  }

  subscribe(listener: (sessions: ActiveDeviceSession[]) => void): Subscription {
    return this.sessionsSubject.subscribe(listener);
  }

  dispose(): void {
    for (const sessionId of Array.from(this.sessions.keys())) {
      this.removeSession(sessionId);
    }
  }

  clear(): void {
    this.dispose();
  }

  private emitSessions(): void {
    this.sessionsSubject.next(this.getSessions());
  }

  private toPublicSession(session: StoredActiveDeviceSession): ActiveDeviceSession {
    return {
      sessionId: session.sessionId,
      dmk: session.dmk,
    };
  }
}

export const activeDeviceSessionRegistry = new ActiveDeviceSessionRegistry();
