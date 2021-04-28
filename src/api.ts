import { createTask, Task } from './task';
import { Value } from './value';

export type OperationIterator<T> = Generator<Operation<any>, T, any>;

export type SpawnPoint<T> = (scope: Scope) => Operation<T>;

export type Operation<T> = Promise<T> | OperationIterator<T> | Value<T> | SpawnPoint<T>;

export interface Scope {
  spawn<T>(operation: Operation<T>): Operation<Task<T>>;
}

export function spawn<T>(operation: Operation<T>): Operation<Task<T>> {
  return scope => scope.spawn(operation);
}

export function run<T>(operation: Operation<T>): Task<T> {
  let task = createTask(operation);
  task.consume(getValue => {
    try {
      return getValue();
    } catch (error) {
      console.warn(`unhandle exception`);
      throw error;
    }
  });
  return task;
}
