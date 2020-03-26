import { Dep } from "./CompileUtils.js";
import Compiler from "./Compiler.js";

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
export default Vue;
