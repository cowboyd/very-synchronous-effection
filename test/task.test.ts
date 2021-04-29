import { Task, createTask, chain, Resolve, Reject } from '../src/index';
import expect from 'expect';

describe('task', () => {
  let task: Task<number>;
  let resolve: Resolve<number>;
  let reject: Reject;

  beforeEach(() => {
    [task, resolve, reject] = createTask<number>();
  });

  it('resolves synchronously', () => {
    let result;
    task.consume(getValue => result = getValue());
    resolve(10);
    expect(result).toEqual(10);
  });

  it('rejects synchronously', () => {
    let boom = new Error('Boom!')
    let error;
    task.consume(getValue => { try { getValue() } catch (e) { error = e }});
    reject(boom);
    expect(error).toBe(boom);
  });

  it('halts synchronously', () => {
    let errorName;
    task.consume(getValue => { try { getValue() } catch (e) { errorName = e.name }});
    task.halt();
    expect(errorName).toEqual('HaltError');
  });

  it('consumes a task that has already been resolved immediately', () => {
    resolve(10);
    let result;
    task.consume(getValue => result = getValue());
    expect(result).toEqual(10);
  });

  it('consumes a task that has already been rejected immediately', () => {
    reject(new Error('boom!'));
    let error;
    task.consume(getValue => { try { getValue() } catch (e) { error = e }});
    expect(error).toMatchObject({ message: 'boom!' });
  });

  it('consumes a task that has already been halted immediately', () => {
    task.halt();
    let errorName;
    task.consume(getValue => { try { getValue() } catch (e) { errorName = e.name }});
    expect(errorName).toEqual('HaltError');
  });

  describe('a chained child task', () => {
    let child: Task<number>;
    let error: Error;

    beforeEach(() => {
      child = chain(task, getValue => {
        let [next, resolve, reject] = createTask<number>();
        try {
          resolve(getValue() * 2);
          return next;
        } catch (e) {
          reject(error);
          throw e;
        }
      })
    });

    it('resolves synchronously', () => {
      let result;
      child.consume(getValue => result = getValue());
      resolve(10);
      expect(result).toEqual(20);
    });

    it('rejects synchronously', () => {
      let boom = new Error('Boom!')
      let error;
      task.consume(getValue => { try { getValue() } catch (e) { error = e }});
      reject(boom);
      expect(error).toBe(boom);
    });

    it('halts synchronously when the child is halted', () => {
      let errorName;
      child.consume(getValue => { try { getValue() } catch (e) { errorName = e.name }});
      child.halt();
      expect(errorName).toEqual('HaltError');
    });

    it('halts synchronously when the parent is halted', () => {
      let errorName;
      child.consume(getValue => { try { getValue() } catch (e) { errorName = e.name }});
      task.halt();
      expect(errorName).toEqual('HaltError');
    });

    it('halts all pipelines when any member in it is halted', () => {
      let errorName;
      task.consume(getValue => { try { getValue() } catch (e) { errorName = e.name }});
      child.halt();
      expect(errorName).toEqual('HaltError');
    });
  });
});
