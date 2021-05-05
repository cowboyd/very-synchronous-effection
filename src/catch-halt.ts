import { Consumer, isHalt } from './task';

export const catchHalt: Consumer<unknown, void> = getValue => {
  try {
    getValue();
  } catch (error) {
    if (!isHalt(error)) {
      throw error;
    }
  }
}
