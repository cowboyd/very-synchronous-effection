export * from './api';
export * from './task';
export * from './tree';
export * from './sleep';

import { Tree, createTree } from './tree';
import { Operation } from './api';
import { Task } from './task';

export const root = new Set<Tree<any>>();

export function run<T>(operation: Operation<T>): Task<T> {
  let tree = createTree<T>(operation, root);

  return tree.task;
}
