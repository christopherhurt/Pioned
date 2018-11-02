export const Modes = {
  MENU: 1,
  GAME: 2,
  INVENTORY: 3,
};

export class Context {
  constructor(mode) {
    this.mode = mode;

    this.ready = {};
    for (let mode in Modes) {
      this.ready[mode] = true;
    }
  }

  getMode() {
    return this.mode;
  }

  trySwitchModes(mode, cond) {
    if (!cond) {
      this.ready[mode] = true;
    } else if (this.ready[mode]) {
      this.mode = mode;
      this.ready[mode] = false;
      return true;
    }
    return false;
  }
}
