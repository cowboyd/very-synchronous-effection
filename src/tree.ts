import { Operation, Scope } from './api';
import { Task, chain, createTask } from './task';
import { catchHalt } from './catch-halt';

import { createController } from './controller';
import { createCallback } from './callback';

export type Children = Set<Tree>;

export interface Tree<T = any> {
  id: number;
  task: Task<T>;
  scope: Scope;
  operation: Operation<T>;
  children: Children;
}

let ids = 1;

export function createTree<T>(operation: Operation<T>, siblings: Set<Tree<any>>): Tree<T> {
  let children: Children = new Set();

  let { start, stop, interrupt } = createController(operation, children);

  let scope: Scope = { spawn };

  let shutdown = createCallback(() => {
    interrupt();
    return chain(haltChildren(children), getValue => {
      getValue();
      return stop();
    })
  });

  let compute = createCallback(() => chain(start(scope), getValue => chain(shutdown(), () => Task.resolve(getValue()))));

  let { task: returnValue, resolve, reject } = createTask<T>();

  let task = {
    ...returnValue,
    halt() {
      returnValue.halt();
      return shutdown();
    }
  }

  function spawn<R>(operation: Operation<R>): Operation<Task<R>> {
    return () => {
      let child = createTree<R>(operation, children);
      return Task.resolve(child.task);
    }
  }

  let tree: Tree<T> = {
    id: ids++,
    operation,
    children,
    task,
    scope
  };

  siblings.add(tree);

  //this starts the actual evaluation of the operation
  compute().consume(getValue => {
    try {
      resolve(getValue());
    } catch (error) {
      reject(error);
    }
  })

  return tree;
}

function haltChildren(children: Children): Task<void> {
  return Array.from(children)
    .reverse()
    .reduce((current, child) => chain(current.consume(catchHalt), assertSuccess => {

      // There is no "value" associated with halt,
      // but if the previous halt failed, this will
      // propagate the error
      assertSuccess();

      return child.task.halt().consume(catchHalt).consume(getValue => {
        children.delete(child);
        return getValue();
      });
    }), Task.resolve())
}
