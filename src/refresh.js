export class RefreshManager {
  constructor() {
    this.table = {};
  }

  register(key, frames, rate) {
    this.table[key] = {
      frames,
      rate,
      index: 0,
      prev: -1,
      refresh: true,
    };
  }

  update(key) {
    const time = new Date().getTime();
    const r = this.table[key];
    r.index = (time % (r.rate * r.frames)) / r.rate | 0;
    r.refresh = (r.index !== r.prev);
    r.prev = r.index;
  }

  updateIfFalse(key) {
    const time = new Date().getTime();
    const r = this.table[key];
    r.index = (time % (r.rate * r.frames)) / r.rate | 0;
    if (!r.refresh) {
      r.refresh = (r.index !== r.prev);
    }
    r.prev = r.index;
  }

  index(key) {
    return this.table[key].index;
  }

  set(key) {
    this.table[key].refresh = true;
  }

  reset(key) {
    this.table[key].refresh = false;
  }

  get(key) {
    return this.table[key].refresh;
  }
}
