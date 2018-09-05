import request from 'superagent'
import uJoin from 'url-join'
import template from 'template-url'
import qs from 'qs'
import merge from 'lodash.merge'
import mapValues from 'lodash.mapvalues'

// options that can be resolved if they are functions
const fns = [
  'root', 'url', 'credentials',
  'headers', 'options', 'data'
]
const result = (fn, arg) => typeof fn === 'function' ? fn(arg) : fn
const resolveFunctions = (o) =>
  mapValues(o, (v, k) =>
    fns.includes(k) ? result(v, o) : v
  )

export const getRequestOptions = (defaultOptions, localOptions) => {
  const resolved = merge({}, resolveFunctions(defaultOptions), resolveFunctions(localOptions))
  const templated = template(resolved.url, resolved)
  const url = resolved.root ? uJoin(resolved.root, templated) : templated
  return {
    ...resolved,
    url,
    method: resolved.method.toLowerCase()
  }
}

export default (defaultOptions, localOptions) => {
  const options = getRequestOptions(defaultOptions, localOptions)
  const req = request[options.method](options.url)

  if (options.plugins) {
    options.plugins.forEach((p) => req.use(p))
  }
  if (options.options) {
    req.query(qs.stringify(options.options, { strictNullHandling: true }))
  }
  if (options.headers) req.set(options.headers)
  if (options.data) req.send(options.data)
  if (options.credentials) req.withCredentials()

  let out = req.then((res) => res) // coerce to promise
  if (options.onError) out = out.catch(options.onError)
  return out
}