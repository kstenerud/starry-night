/**
 * @typedef {import('hast').Root} Root
 *
 * @typedef {RuleInclude | RuleName | RuleDefinition} Rule
 *
 * @typedef Grammar
 * @property {string} scopeName
 * @property {Array<string>} names
 * @property {Array<string>} extensions
 * @property {Array<string>} [extensionsWithDot]
 * @property {Array<string>} [dependencies]
 * @property {Array<Rule>} patterns
 * @property {Record<string, Rule>} [repository]
 * @property {Record<string, Rule>} [injections]
 *
 * @typedef RuleName
 * @property {string} name
 * @property {never} [include]
 * @property {never} [begin]
 * @property {never} [match]
 *
 * @typedef RuleInclude
 * @property {string} include
 * @property {never} [name]
 * @property {never} [begin]
 * @property {never} [match]
 *
 * @typedef RuleDefinition
 * @property {string} [match]
 * @property {Captures} [captures]
 * @property {string} [begin]
 * @property {Captures} [beginCaptures]
 * @property {string} [end]
 * @property {Captures} [endCaptures]
 * @property {string} [while]
 * @property {Captures} [whileCaptures]
 * @property {string} [name]
 * @property {string} [contentName]
 * @property {Array<Rule>} [patterns]
 * @property {Record<string, Rule>} [repository]
 * @property {Record<string, Rule>} [injections]
 * @property {boolean} [applyEndPatternLast]
 *
 * @typedef {Record<string, Rule>} Captures
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {GetOnigurumaUrl} [getOnigurumaUrlFetch]
 *   Get a URL to the oniguruma WASM, typically used in browsers.
 * @property {GetOnigurumaUrl} [getOnigurumaUrlFs]
 *   Get a URL to the oniguruma WASM, typically used in Node.js.
 *
 * @callback GetOnigurumaUrl
 *   Get a URL to the oniguruma WASM.
 *
 *   > 👉 **Note**: this must currently result in a version 1 URL of
 *   > `onig.wasm` from `vscode-oniguruma`.
 *
 *   > ⚠️ **Danger**: when you use this functionality, your project might break at
 *   > any time (when reinstalling dependencies), except when you make sure that
 *   > the WASM binary you load manually is what our internally used
 *   > `vscode-oniguruma` dependency expects.
 *   > To solve this, you could for example use an npm script called `dependencies`
 *   > (which runs everytime `node_modules` is changed) which copies
 *   > `vscode-oniguruma/release/onig.wasm` to the place you want to host it.
 * @returns {URL | Promise<URL>}
 *   URL object to a WASM binary.
 */

import vscodeTextmate from 'vscode-textmate'
import vscodeOniguruma from 'vscode-oniguruma'
import {getOniguruma} from './get-oniguruma.js'
import {parse} from './parse.js'
import {theme} from './theme.js'

/**
 * Create a `StarryNight` that can highlight things based on the given
 * `grammars`.
 * This is async to facilitate async loading and registering, which is currently
 * only used for WASM.
 *
 * @param {Array<Grammar>} grammars
 *   Grammars to support.
 * @param {Options} [options]
 *   Configuration (optional).
 */
export async function createStarryNight(grammars, options) {
  /** @type {Map<string, Grammar>} */
  const registered = new Map()
  /** @type {Map<string, string>} */
  const names = new Map()
  /** @type {Map<string, string>} */
  const extensions = new Map()
  /** @type {Map<string, string>} */
  const extensionsWithDot = new Map()
  let currentRegistry = await createRegistry(grammars, options)

  return {flagToScope, scopes, missingScopes, register, highlight}

  /**
   * @param {Array<Grammar>} grammars
   */
  async function register(grammars) {
    currentRegistry = await createRegistry(grammars)
  }

  /**
   * Get the grammar scope (such as `source.gfm`) associated with a grammar name
   * (such as `markdown` or `pandoc`) or grammar extension (such as `.mdwn` or
   * `.rmd`).
   *
   * This function is designed to accept the first word (when splitting on
   * spaces and tabs) that is used after the opening of a fenced code block:
   *
   * ````markdown
   * ```js
   * console.log(1)
   * ```
   * ````
   *
   * To match GitHub, this also accepts entire paths:
   *
   * ````markdown
   * ```path/to/example.js
   * console.log(1)
   * ```
   * ````
   *
   * > **Note**: languages can use the same extensions.
   * > For example, `.h` is reused by many languages.
   * > Importantly, you don’t always get the most popular language associated
   * > with an extension.
   * > For example, `.md` is registeded by a Lisp-like language instead of
   * > markdown. 🤷‍♂️
   *
   * @param {string} flag
   *   Grammar name (such as `'markdown'` or `'pandoc'`), grammar extension
   *   (such as `'.mdwn'` or `'.rmd'`), or entire file path ending in
   *   extension.
   * @returns {string | undefined}
   *   Grammar scope (such as `'source.gfm'`).
   */
  function flagToScope(flag) {
    if (typeof flag !== 'string') {
      throw new TypeError('Expected `string` for `flag`, got `' + flag + '`')
    }

    const normal = flag
      .toLowerCase()
      .replace(/^[ \t]+/, '')
      .replace(/\/*[ \t]*$/g, '')

    const scopeByName = names.get(normal)

    if (scopeByName) {
      return scopeByName
    }

    const dot = normal.lastIndexOf('.')

    if (dot === -1) {
      return extensions.get('.' + normal)
    }

    const extension = normal.slice(dot)
    return extensions.get(extension) || extensionsWithDot.get(extension)
  }

  /**
   * List all registered scopes.
   *
   * @returns {Array<string>}
   *   List of grammar scopes (such as `'source.gfm'`).
   */
  function scopes() {
    return [...registered.keys()].sort()
  }

  /**
   * List all scopes that are needed by the registered grammars, but that are
   * not registered.
   *
   * To illustrate, the `text.xml.svg` grammar needs the `text.xml` grammar.
   * When you register `text.xml.svg` without `text.xml`, it will be listed
   * here.
   *
   * @returns {Array<string>}
   *   List of grammar scopes (such as `'source.gfm'`).
   */
  function missingScopes() {
    /** @type {Set<string>} */
    const available = new Set()
    /** @type {Set<string>} */
    const needed = new Set()

    for (const [scopeName, grammar] of registered) {
      available.add(scopeName)
      if (grammar.dependencies) {
        for (const dep of grammar.dependencies) {
          needed.add(dep)
        }
      }
    }

    return [...needed].filter((d) => !available.has(d)).sort()
  }

  /**
   * Highlight `value` (code) as `scope` (a textmate scope).
   *
   * @param {string} value
   *   Code to highlight.
   * @param {string} scope
   *   Registered grammar scope to highlight as (such as `'source.gfm'`).
   * @returns {Root}
   *   Node representing highlighted code.
   */
  function highlight(value, scope) {
    if (typeof value !== 'string') {
      throw new TypeError('Expected `string` for `value`, got `' + value + '`')
    }

    if (typeof scope !== 'string') {
      throw new TypeError('Expected `string` for `scope`, got `' + scope + '`')
    }

    // `vscode-textmate` changed its internals in `7.0.3`.
    // It used to be a plain object, now it’s a map.
    // use the private API so we don’t need to cache again.
    /** @type {unknown} */
    // @ts-expect-error
    // type-coverage:ignore-next-line
    const map = currentRegistry._syncRegistry._grammars
    /* c8 ignore next 4 */
    /** @type {Grammar} */
    // @ts-expect-error
    // type-coverage:ignore-next-line
    const grammar = typeof map.get === 'function' ? map.get(scope) : map[scope]

    if (!grammar) {
      throw new Error('Expected grammar `' + scope + '` to be registered')
    }

    // @ts-expect-error: `vscode-textmate` types are wrong.
    return parse(value, grammar, currentRegistry.getColorMap())
  }

  /**
   * @param {Array<Grammar>} grammars
   * @param {Options | undefined} [options]
   */
  async function createRegistry(grammars, options) {
    for (const grammar of grammars) {
      const scope = grammar.scopeName
      for (const d of grammar.extensions) extensions.set(d, scope)
      if (grammar.extensionsWithDot)
        for (const d of grammar.extensionsWithDot)
          extensionsWithDot.set(d, scope)
      for (const d of grammar.names) names.set(d, scope)
      registered.set(scope, grammar)
    }

    const registry = new vscodeTextmate.Registry({
      onigLib: createOniguruma(options),
      // @ts-expect-error: `vscode-textmate` has much stricter types that needed
      // by textmate, or by what they actually support.
      // Given that we can’t fix the grammars provided by the world here, and
      // given that `vscode-textmate` is crying without a reason, we tell it to
      // shut up instead.
      async loadGrammar(scopeName) {
        return registered.get(scopeName)
      }
    })

    registry.setTheme(theme)

    await Promise.all(
      [...registered.keys()].map((d) => {
        return registry.loadGrammar(d)
      })
    )

    return registry
  }
}

/**
 * Small function needed for oniguruma to work.
 *
 * Idea: as this seems to be a singleton, would it help if we call it once and
 * keep the promise?
 *
 * @param {Options | undefined} [options]
 */
async function createOniguruma(options) {
  const wasmBin = await getOniguruma(options)
  await vscodeOniguruma.loadWASM(wasmBin)
  return vscodeOniguruma
}
