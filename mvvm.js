// import CompileUtils from "./compileUtils";
class Compiler {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    let fragment = this.node2fragment(this.el);
    this.compile(fragment);
    this.el.appendChild(fragment);
  }
  isElementNode(node) {
    return node.nodeType === 1;
  }
  node2fragment(node) {
    let fragment = document.createDocumentFragment();
    let firstChild;
    while ((firstChild = node.firstChild)) {
      fragment.appendChild(firstChild);
    }
    return fragment;
  }
  isDirective(attrName) {
    return attrName.startsWith("v-");
  }
  compileText(node) {
    let content = node.textContent;
    if (/\{\{(.+?)\}\}/.test(content)) {
      CompileUtils["text"](node, content, this.vm);
    }
  }
  compileElement(node) {
    let attributes = node.attributes;
    [...attributes].forEach(attr => {
      let { name, value: expr } = attr;
      if (this.isDirective(name)) {
        let [, directive] = name.split("-");
        let [directiveName, eventName] = directive.split(":");
        CompileUtils[directiveName](node, expr, this.vm, eventName);
      }
    });
  }

  compile(node) {
    let childnodes = node.childNodes;
    [...childnodes].forEach(child => {
      if (this.isElementNode(child)) {
        this.compileElement(child);
        this.compile(child);
      } else {
        this.compileText(child);
      }
    });
  }
}
CompileUtils = {
  model(node, expr, vm) {
    let hanlder = this.updater["modelUpdater"];
    let value = this.getValue(expr, vm);
    hanlder(node, value);
    new Watcher(vm, expr, newValue => {
      hanlder(node, newValue);
    });
  },
  html(node, expr, vm) {},

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
  getEvent(expr, vm) {
    return vm.$data[expr].bind(vm);
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
    }
  }
};
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
class Dep {
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
// 数据劫持
class Observer {
  constructor(data) {
    this.observer(data);
  }
  observer(data) {
    if (data && typeof data === "object") {
      for (let key in data) this.defineReactive(data, key, data[key]);
    }
  }
  defineReactive(obj, key, value) {
    this.observer(value);
    let dep = new Dep();
    Object.defineProperty(obj, key, {
      get() {
        Dep.target && dep.add(Dep.target);
        return value;
      },
      set: nv => {
        if (nv !== value) {
          this.observer(nv);
          value = nv;
          dep.notify();
        }
      }
    });
  }
}
class Vue {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    let computed = options.computed;
    let methods = options.methods;
    for (let key in methods) {
      Object.defineProperty(this.$data, key, {
        get: () => {
          return methods[key];
        }
      });
    }
    for (let key in computed) {
      Object.defineProperty(this.$data, key, {
        get: () => {
          return computed[key].call(this);
        }
      });
    }
    if (this.$el) {
      new Observer(this.$data);
      this.proxy(this.$data);
      new Compiler(this.$el, this);
    }
  }
  // 取值代理
  proxy(data) {
    for (let key in data) {
      Object.defineProperty(this, key, {
        get() {
          return data[key];
        },
        set: nv => {
          data[key] = nv;
        }
      });
    }
  }
}
