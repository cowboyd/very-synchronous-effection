import { Task, createTask, chain, Resolve, Reject, NewTask } from '../src/index';
import expect from 'expect';

describe('task', () => {
  let task: Task<number>;
  let controls: NewTask<number>;
  let resolve: Resolve<number>;
  let reject: Reject;

  beforeEach(() => {
    controls = createTask<number>();
    task = controls.task;
    resolve = controls.resolve;
    reject = controls.reject;
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
        let { task: next, resolve, reject } = createTask<number>();
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

    it('halts the child task when it is halted', () => {
      let errorName;
      child.consume(getValue => { try { getValue() } catch (e) { errorName = e.name }});
      child.halt();
      expect(errorName).toEqual('HaltError');
    });
  });

  describe('chaining a multistep pipeline', () => {
    let first: Task<number>;
    let second: NewTask<number>;
    let third: NewTask<number>;
    let pipeline: Task<number>;

    beforeEach(() => {
      first = Task.resolve(1);
      second = createTask<number>();
      third = createTask<number>();
      pipeline = chain(chain(first, () => second.task), () => third.task);
    });

    it('is not resolved', () => {
      let result;
      pipeline.consume(get => result = get());
      expect(result).toBeUndefined();
    });

    describe('when only the second link is resolved', () => {
      beforeEach(() => {
        second.resolve(2);
      });

      it('is still not resolved', () => {
        let result;
        pipeline.consume(get => result = get());
        expect(result).toBeUndefined();
      });
    });

    describe('when both links are resolved', () => {
      beforeEach(() => {
        second.resolve(2);
        third.resolve(3);
      });

      it('becomes resolved', () => {
        let result;
        pipeline.consume(get => result = get());
        expect(result).toBe(3);
      });
    });

    describe('when the pipeline is halted', () => {
      beforeEach(() => {
        pipeline.halt();
      });
      it('halts the whole thing', async () => {
        expect(pipeline).rejects.toMatchObject({ name: 'HaltError' });
      });
    });

    describe('when the all links are resolved, but the last link is rejected', () => {
      beforeEach(() => {
        second.resolve(5);
        third.reject(new Error('last step failed'));
      });

      it('rejects the pipeline', () => {

      });
    });

  });
});
