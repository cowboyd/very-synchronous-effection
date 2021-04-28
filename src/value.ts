import { createDeferred } from './deferred';

export interface Value<T> extends Promise<T> {
  consume<R>(fn: (get: () => T) => R): Value<R>;
}

export type Resolve<T> = (value: T) => void;
export type Reject = (error: Error) => void;
export type Consumer<In, Out> = (get: () => In) => Out;
export type Continuation<T> = { resolve: Resolve<T>, reject: Reject };

export function createValue<T>(): [Value<T>, Resolve<T>, Reject] {
  let settled: Result<T>;
  let deferred = createDeferred<T>()
  let consumers: Set<(result: Result<T>) => void> = new Set();

  deferred.promise.catch(() => {});


  function produce(result: Result<T>) {
    if (!settled) {
      settled = result;
      result.type === 'resolved' ?
        deferred.resolve(result.value) :
        deferred.reject(result.error);
      notify(result);
    }
  }

  function notify(result: Result<T>) {
    for (let consumer of consumers) {
      consumers.delete(consumer);
      consumer(result);
    }
  }

  function consume<R>(callback: Consumer<T,R>): Value<R> {
    let [next, resolve, reject] = createValue<R>();
    consumers.add((result) => {
      try {
        resolve(callback(() => {
          if (result.type === 'resolved') {
            return result.value;
          } else {
            throw result.error;
          }
        }))
      } catch (error) {
        reject(error);
      };
    })

    if (settled) {
      notify(settled);
    }

    return next;
  }

  function resolve(value: T) {
    produce({ type: "resolved", value });
  }

  function reject(error: Error) {
    produce({ type: "rejected", error })
  }

  let value: Value<T> = {
    consume,
    then: deferred.promise.then,
    catch: deferred.promise.catch,
    finally: deferred.promise.finally,
    [Symbol.toStringTag]: `[value]`
  }
  return [ value, resolve, reject] ;
}


type Result<T> =
  {
    type: "resolved";
    value: T;
  } |
  {
    type: "rejected";
    error: Error;
  }
