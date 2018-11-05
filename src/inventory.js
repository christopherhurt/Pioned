export class Inventory {
  constructor() {
    this.items = {};

    this.NONE = '[NONE]';
    this.add(this.NONE, 1);
    this.selected = this.NONE;
  }

  getItemIDS() {
    let arr = [];
    for (let id in this.items) {
      const num = this.items[id];
      if (num > 0) {
        arr.push(id);
      }
    }
    return arr;
  }

  unselect() {
    this.selected = this.NONE;
  }

  select(id) {
    if (this.verify(id, 1)) {
      this.selected = id;
    }
    else {
      this.selected = this.NONE;
    }
  }

  _has(id) {
    return id in this.items;
  }

  verify(id, n) {
    return this._has(id) && this.items[id] >= n;
  }

  add(id, n) {
    if (!this._has(id)) {
      this.items[id] = 0;
    }
    this.items[id] += n;
  }

  remove(id, n) {
    if (!this.verify(id, n)) {
      throw new Error(`Cannot remove ${n} items of type: ${id}`);
    }

    this.items[id] -= n;
    if (this.items[id] === 0) {
      this.unselect();
    }
  }
}
