import { Task } from './task';

export function isPromise<T>(value: unknown): value is Promise<T> {
  return !!value && typeof ((value as Promise<T>).then) === 'function'
}

export function isTask<T>(value: unknown): value is Task<T> {
  return isPromise(value) && typeof ((value as Task<T>).consume) === 'function';
}

export function isGenerator(value: any): value is Iterator<unknown> {
  return value && typeof(value.next) === 'function';
}
