import { Task } from './task';

export type OperationIterator<T> = Generator<Operation<any>, T, any>;

export type Operation<T> = Promise<T> | OperationIterator<T> | Task<T> |  undefined;

export interface Scope {
  spawn<T>(operation: Operation<T>): Operation<Task<T>>;
}

export const forever = undefined;
