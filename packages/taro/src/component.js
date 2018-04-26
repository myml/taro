import { isEmptyObject } from './util'
import { enqueueRender } from './render-queue'
import { updateComponent } from './lifecycle'

class Component {
  static defaultProps = {}
  $components = {}
  $$components = {}
  $path = ''
  $name = ''
  $isComponent = true
  $props = {}
  nextProps = {}
  _dirty = true
  _disable = true
  _pendingStates = []
  _pendingCallbacks = []

  constructor (props) {
    this.state = {}
    this.props = props || {}
  }

  _initData ($root, $parent) {
    this.$app = getApp()
    this.$root = $root || null
    this.$parent = $parent || null
    this.defaultData = {}
    this.$data = $parent ? $parent.$data : {}

    let path = this.$path.split('$$').pop()
    this.$data[`$$${path}`] = this.$data[`$$${path}`] || {}
    this.$data = this.$data[`$$${path}`]
    for (let k in this.state) {
      this.$data[k] = this.state[k]
    }
    if (this.props) {
      for (let k in this.props) {
        this.$data[k] = this.props[k]
      }
    }

    if (this.$$components && !isEmptyObject(this.$$components)) {
      Object.getOwnPropertyNames(this.$$components).forEach(name => {
        this.$$components[name]._initData(this.$root || this, this)
      })
    }
    if (this.$$dynamicComponents && !isEmptyObject(this.$$dynamicComponents)) {
      Object.getOwnPropertyNames(this.$$dynamicComponents).forEach(name => {
        this.$$dynamicComponents[name]._initData(this.$root || this, this)
      })
    }
  }
  _init (scope) {
    this.$scope = scope
    this.$app = getApp()
    if (this.$$components && !isEmptyObject(this.$$components)) {
      Object.getOwnPropertyNames(this.$$components).forEach(name => {
        this.$$components[name]._init(this.$scope)
      })
    }
    if (this.$$dynamicComponents && !isEmptyObject(this.$$dynamicComponents)) {
      Object.getOwnPropertyNames(this.$$dynamicComponents).forEach(name => {
        this.$$dynamicComponents[name]._init(this.$scope)
      })
    }
  }
  // rewrite when compile
  _createData () {
    return this.state
  }

  setState (state, callback) {
    if (state) {
      (this._pendingStates = this._pendingStates || []).push(state)
    }
    if (typeof callback === 'function') {
      (this._pendingCallbacks = this._pendingCallbacks || []).push(callback)
    }
    if (!this._disable) {
      enqueueRender(this)
    }
  }

  getState () {
    const { _pendingStates, state, props } = this
    const stateClone = Object.assign({}, state)
    delete stateClone.__data
    if (!_pendingStates.length) {
      return stateClone
    }
    const queue = _pendingStates.concat()
    this._pendingStates.length = 0
    queue.forEach((nextState) => {
      if (typeof nextState === 'function') {
        nextState = nextState.call(this, stateClone, props)
      }
      Object.assign(stateClone, nextState)
    })
    return stateClone
  }

  forceUpdate (callback) {
    if (typeof callback === 'function') {
      (this._pendingCallbacks = this._pendingCallbacks || []).push(callback)
    }
    updateComponent(this, true)
  }
}

export default Component
