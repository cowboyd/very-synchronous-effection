export * from './api';
export * from './task';
export * from './tree';

import { Tree, createTree } from './tree';
import { Operation } from './api';
import { Task, isHalt } from './task';

export const root = new Set<Tree<any>>();

export function run<T>(operation: Operation<T>): Task<T> {
  let tree = createTree<T>(operation, root);

  return tree.task.consume(getValue => {
    try {
      return getValue();
    } catch (error) {
      if (!isHalt(error)) {
        console.warn('unhandle task error');
        console.warn(error);
      }
      throw error;
    }
  })
}
