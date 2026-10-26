/**
 * An in-process event bus. THIS IS A STUB - you finish it.
 *
 * Requirements:
 *   - a handler that throws must not stop the other handlers
 *   - publish returns the number of handlers it reached
 *   - subscribing the same function twice registers it twice (do not dedupe)
 *   - publishing a name nobody listens to is fine and returns 0
 */

/** The events this system publishes. Add to it as you need to. */

/** The events this system publishes. */
export interface DomainEvents {
  "order.placed": {
    orderId: string;
    email: string;
    amountPaise: number;
  };
}

export type EventName = keyof DomainEvents;
export type Handler<K extends EventName> =
  (payload: DomainEvents[K]) => void;
export type Unsubscribe = () => void;

export interface EventBus {
  publish<K extends EventName>(
    name: K,
    payload: DomainEvents[K]
  ): number;

  subscribe<K extends EventName>(
    name: K,
    fn: Handler<K>
  ): Unsubscribe;
}

export function createEventBus(): EventBus {
  const handlers = new Map<EventName, Set<symbol>>();
  const callbacks = new Map<
    EventName,
    Map<symbol, (payload: never) => void>
  >();

  function subscribe<K extends EventName>(
    name: K,
    fn: Handler<K>
  ): Unsubscribe {
    const id = Symbol();

    if (!handlers.has(name)) {
      handlers.set(name, new Set());
      callbacks.set(name, new Map());
    }

    handlers.get(name)!.add(id);

    callbacks.get(name)!.set(
      id,
      fn as (payload: never) => void
    );

    return () => {
      handlers.get(name)?.delete(id);
      callbacks.get(name)?.delete(id);
    };
  }

  function publish<K extends EventName>(
    name: K,
    payload: DomainEvents[K]
  ): number {
    const ids = [...(handlers.get(name) ?? [])];
    let reached = 0;

    for (const id of ids) {
      const handler = callbacks.get(name)?.get(id);

      if (!handler) continue;

      reached++;

      try {
        handler(payload as never);
      } catch {
        // One failed handler must not block the others.
      }
    }

    return reached;
  }

  return { subscribe, publish };
}

/** Shared bus used by the application modules. */
export const eventBus = createEventBus();
