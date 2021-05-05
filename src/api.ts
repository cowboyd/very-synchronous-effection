import { Task } from './task';

export type OperationIterator<T> = Generator<Operation<any>, T, any>;

export type OperationFn<T> = (scope: Scope) => Operation<T>;

export type Operation<T> = Promise<T> | OperationIterator<T> | Task<T> |  undefined | OperationFn<T>;

export interface Scope {
  spawn<T>(operation: Operation<T>): Operation<Task<T>>;
}

export const forever = undefined;
