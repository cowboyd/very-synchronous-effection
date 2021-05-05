import { sleep } from '../src/index';

export function createNumber(value: number) {
  return function*() {
    yield sleep(1);
    return value;
  }
}

export function *blowUp() {
  yield sleep(1);
  throw new Error('boom');
}
