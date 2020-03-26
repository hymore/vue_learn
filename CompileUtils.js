// 观察者
class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    this.oldvalue = this.getValue(expr, vm);
  }
  getValue() {
    Dep.target = this;
    let value = CompileUtils.getValue(this.expr, this.vm);
    Dep.target = null;
    return value;
  }
  update() {
    let newValue = CompileUtils.getValue(this.expr, this.vm);
    if (newValue !== this.oldvalue) {
      this.cb(newValue);
    }
  }
}
export class Dep {
  constructor() {
    this.subs = [];
  }
  add(watcher) {
    this.subs.push(watcher);
  }
  notify() {
    this.subs.forEach(watcher => {
      watcher.update();
    });
  }
}
const CompileUtils = {
  model(node, expr, vm) {
    let hanlder = this.updater["modelUpdater"];
    let value = this.getValue(expr, vm);
    hanlder(node, value);
    new Watcher(vm, expr, newValue => {
      hanlder(node, newValue);
    });
    node.addEventListener("input", e => {
      let newValue = e.target.value;
      let arr = expr.split(".");
      let [name] = arr.splice(-1);
      let res = arr.reduce((p, c) => {
        return p[c];
      }, vm.$data);
      res[name] = newValue;
    });
  },
  html(node, expr, vm) {
    let hanlder = this.updater["htmlUpdater"];
    let value = this.getValue(expr, vm);
    hanlder(node, value);
    new Watcher(vm, expr, newValue => {
      hanlder(node, newValue);
    });
  },

  text(node, expr, vm) {
    let hanlder = this.updater["textUpdater"];
    let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      new Watcher(vm, args[1], () => {
        hanlder(node, this.getConentValue(expr, vm));
      });
      return this.getValue(args[1], vm);
    });

    hanlder(node, content);
  },
  on(node, expr, vm, eventName) {
    node.addEventListener(eventName, e => {
      vm.$data[expr].call(vm, e);
    });
  },
  getValue(expr, vm) {
    return expr.split(".").reduce((data, current) => {
      return data[current];
    }, vm.$data);
  },
  getConentValue(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getValue(args[1], vm);
    });
  },
  updater: {
    modelUpdater(node, value) {
      node.value = value;
    },
    textUpdater(node, value) {
      node.textContent = value;
    },
    htmlUpdater(node, value) {
      node.innerHTML = value;
    }
  }
};

export default CompileUtils;
