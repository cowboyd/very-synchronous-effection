import { createDeferred } from './deferred';

export interface Task<T = unknown> extends Promise<T> {
  consume<R>(fn: (get: () => T) => R): Task<R>;
  halt(): Task<void>;
}

export type Resolve<T> = (value: T) => void;
export type Reject = (error: Error) => void;
export type Consumer<In, Out> = (get: () => In) => Out;

export interface NewTask<T> {
  task: Task<T>;
  resolve: Resolve<T>;
  reject: Reject;
}

export function createTask<T>(): NewTask<T> {
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
      notify();
    }
  }

  function notify() {
    let receipients = [...consumers];
    consumers.clear();
    for (let consumer of receipients) {
      consumer(settled);
    }
  }

  function consume<R>(callback: Consumer<T,R>): Task<R> {
    let { task: next, resolve, reject } = createTask<R>();
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
      notify();
    }

    return next;
  }

  function halt(): Task<void> {
    produce({ type: 'halted', error: new HaltError() });
    return consume(() => {});
  }

  function resolve(value: T) {
    produce({ type: "resolved", value });
  }

  function reject(error: Error) {
    produce({ type: "rejected", error })
  }

  let promise = deferred.promise;

  let task: Task<T> = {
    consume,
    halt,
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
    [Symbol.toStringTag]: `[object Task]`
  }
  return { task, resolve, reject };
}

interface TaskStatic {
  halt<T>(): Task<T>;
  resolve<T>(value: T): Task<T>;
  resolve<_T extends undefined>(value: void): Task<void>;
  reject<T>(error: Error): Task<T>;
}

export const Task: TaskStatic = {
  halt<T>(): Task<T> {
    let { task } = createTask<T>();
    task.halt();
    return task;
  },
  resolve<T>(value: T): Task<T> {
    let { task, resolve } = createTask<T>();
    resolve(value);
    return task;
  },
  reject<T>(error: Error) {
    let { task, reject } = createTask<T>();
    reject(error);
    return task;
  }
}

export function chain<T,R>(task: Task<T>, fn: Consumer<T,Task<R>>): Task<R> {
  let { task: chained, resolve, reject } = createTask<R>();
  task.consume(getValue => {
    try {
      let next = fn(getValue);
      next.consume(nextValue => {
        try {
          resolve(nextValue());
        } catch (error) {
          reject(error);
        }
      })
    } catch (error) {
      reject(error);
    }
  });
  return {
    ...chained,
    halt() {
      return chain(task.halt(), () => chained.halt());
    }
  }
}

export function isTask<T>(value: object | undefined): value is Task<T> {
  return !!value && Reflect.get(value, Symbol.toStringTag) === '[object Task]';
}

export function isHalt(value: object): value is HaltError {
  return !!value && value instanceof HaltError;
}

type Result<T> =
  {
    type: "resolved";
    value: T;
  } |
  {
    type: "rejected";
    error: Error;
  } |
  {
    type: "halted";
    error: HaltError;
  }

export class HaltError extends Error {
  constructor() {
    super(`awaiting the result of a halted task`);
    this.name = 'HaltError';
  }
}
