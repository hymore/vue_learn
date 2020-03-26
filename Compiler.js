import CompileUtils from "./CompileUtils.js";
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
export default Compiler;
