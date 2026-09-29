import { EventEmitter } from "node:events";

declare global { var nexadeskEvents: EventEmitter | undefined; }

function bus() {
  if (!globalThis.nexadeskEvents) globalThis.nexadeskEvents = new EventEmitter();
  return globalThis.nexadeskEvents;
}

export function publishLocalEvent(organizationId: string, ticketId?: string) {
  bus().emit(organizationId, JSON.stringify({ ticketId, at: Date.now() }));
}

export function subscribeLocalEvents(organizationId: string, listener: (payload: string) => void) {
  bus().on(organizationId, listener);
  return () => bus().off(organizationId, listener);
}
