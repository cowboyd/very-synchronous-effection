import { Operation, Scope } from './api';
import { Task, Resolve, Reject, chain, createTask, isHalt } from './task';
import { createController } from './controller';

export interface Tree<T> {
  task: Task<T>;
  scope: Scope;
  operation: Operation<T>;
  resolve: Resolve<T>;
  reject: Reject;
  children: Set<Tree<any>>;
}

export function createTree<T>(operation: Operation<T>, siblings: Set<Tree<any>>): Tree<T> {
  let start = createController(operation);
  let [task, resolve, reject] = createTask<T>();

  let children = new Set<Tree<any>>();

  function spawn<R>(operation: Operation<R>): Operation<Task<R>> {
    let child = createTree<R>(operation, children);

    return Task.resolve(child.task.consume(getValue => {
      try {
        return getValue();
      } catch (error) {
        if (!isHalt(error)) {
          reject(error);
        }
        throw error;
      }
    }))
  }

  let tree: Tree<T> = {
    operation,
    resolve,
    reject,
    children,
    task: chain(task, getValue => {
      return Array.from(children)
        .reverse()
        .reduce((current, child) => {
          return chain(current, () => child.task.halt());
        }, Task.halt())
        .consume(teardown => {
          try {
            // this will surface errors in teardown if any
            // TODO: double-check this
            teardown();

            return getValue();
          } finally {
            siblings.delete(tree);
          }
        });
    }),
    scope: { spawn }
  };

  siblings.add(tree);

  start(tree)

  return tree;
}
