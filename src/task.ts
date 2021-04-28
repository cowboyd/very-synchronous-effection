import { Value, Consumer, createValue } from './value';
import { Operation, SpawnPoint } from './api';
import { isValue, isPromise } from './predicates';
import { createDeferred } from './deferred';

export interface Task<T> extends Value<T> {
  halt(): Value<void>;
}

class HaltError extends Error {}

export function createTask<T>(operation: Operation<T>): Task<T> {
  if (isValue(operation)) {
    return createValueTask(operation);
  } else if (isPromise(operation)) {
    return createPromiseTask(operation);
  } else if (typeof operation === 'function') {
    return createSpawnPointTask(operation);
  }
  throw new Error('invalid operation');
}

function createPromiseTask<T>(promise: Promise<T>): Task<T> {
  let [value, resolve, reject] = createValue<T>();
  let signal = createDeferred<void>();
  let didHalt = false;

  Promise.race([promise, signal])
    .then((result) => {
      if (!didHalt) {
        resolve(result as T);
      } else {
        throw new HaltError();
      }
    }, error => reject(error));

  function halt() {
    didHalt = true;
    signal.resolve();
    return value.consume(() => {})
  }

  return { halt, ...value };
}

function createValueTask<T>(value: Value<T>) {
  let consumer: Consumer<T,T> = get => get();

  let guard = value.consume(get => consumer(get))

  function halt(): Value<void> {
    consumer = () => { throw new HaltError() }
    return value.consume(() => {});
  }

  return { halt, ...guard };
}

function createSpawnPointTask<T>(point: SpawnPoint<T>): Task<T> {
  let [value, resolve, reject] = createValue<T>();

  return value.consume(getValue => {
    let scope = createScope();
    let operation = point(scope);
    return createTask(operation);
  });
}
