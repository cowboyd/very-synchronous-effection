export * from './api';
export * from './task';
export * from './call-frame';
export * from './sleep';

import { CallFrame, createCallFrame } from './call-frame';
import { Operation } from './api';
import { Task } from './task';

export const root = new Set<CallFrame<any>>();

export function run<T>(operation: Operation<T>): Task<T> {
  let tree = createCallFrame<T>(operation, root);

  return tree.task;
}
