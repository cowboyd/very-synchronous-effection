import { Tree } from '../tree';

export interface Controller<T> {
  (tree: Tree<T>): void;
};
