const types = require('@babel/types');

/** 默认配置 */
const defaultOptions = {
  /** 哪些文件不参与 */
  exclude: ['node_modules'],
  /** 注入的页面文件路径 */
  include: [],
  /** 参与编辑的文件类型 */
  test: /\.tsx$/,
  /** 需要注入的高阶组件:[{name: '', path: '', include: []}] */
  hocList: []
}

/** 
 * @desc 判断哪些文件不参与编译
 * @return true 不编译 false 编译
 */
function matchsFile(options, filename) {
  const { exclude, include, test, hocList } = options
  // exclude包含的直接排除
  const isExclued = exclude.find((name) => name && filename.includes(name))
  if (isExclued) { return true }
  // 只编译tsx、jsx
  const isTsxOrJsx = test.test(filename)
  if (!isTsxOrJsx) { return true }
  // 只编译include包含的文件
  // const isInclude = include.find(name => {
  //   return name && filename.includes(path.resolve(__dirname, name))
  // })
  // if (!isInclude) { return true }
  return false
}

/** 
 * @desc 生成import
 * @return ast
 */
function generateImportHocNode(options) {
  const hocList = options.hocList
  return hocList.map(hocItem => {
    return types.importDeclaration(
      [types.importDefaultSpecifier(types.identifier(hocItem.name))],
      types.stringLiteral(hocItem.path),
    )
  })
}

/**  */
function generateCallExpressionNode(options, params) {
  const hocList = options.hocList
  if (hocList.length === 1) {
    return types.callExpression(types.identifier(hocList[0].name), params);
  }
  return types.callExpression(types.identifier(hocList.pop().name), [generateCallExpressionNode(hocList, params)])
}

/** 合并配置 */
function mergeOptions(options) {
  return Object.assign(defaultOptions, options)
}

module.exports = {
  mergeOptions,
  matchsFile,
  generateImportHocNode,
  generateCallExpressionNode
}