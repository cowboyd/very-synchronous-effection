import { Value } from './value';

export function isPromise<T>(value: unknown): value is Promise<T> {
  return !!value && typeof ((value as Promise<T>).then) === 'function'
}

export function isValue<T>(value: unknown): value is Value<T> {
  return isPromise(value) && typeof ((value as Value<T>).consume) === 'function';
}
