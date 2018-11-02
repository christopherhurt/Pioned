export class Inventory {
  constructor() {
    this.items = {};
  }

  getItems() {
    return this.items;
  }

  verify(id, n) {
    return id in this.items && this.items[id] >= n;
  }

  add(id, n) {
    if (!(id in this.items)) {
      this.items[id] = 0;
    }
    this.items[id] += n;
  }

  remove(id, n) {
    if (!this.verify(id, n)) {
      throw new Error(`Cannot remove ${n} items of type: ${id}`);
    }
    this.items[id] -= n;
  }
}
