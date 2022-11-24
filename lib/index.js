// 全局注入hoc
const utils = require('./utils')
const generator = require('@babel/generator').default
const { generateImportHocNode, mergeOptions, matchsFile, generateCallExpressionNode } = utils

module.exports = ({ types }) => {
  const imported = []

  /** 在文件头部引入我们全局注入的hoc */
  function bulidImportHandler(path, options) {
    const ast = generateImportHocNode(options)
    path.node.body.unshift(...ast)
  }

  /** 高阶组件包裹导出的组件 */
  function bulidExportHandler(path, options) {
    const exportDefaultNode = path.node.body.find(item => types.isExportDefaultDeclaration(item))
    let callExpression
    switch (exportDefaultNode.declaration.type) {
      /** 处理export default Demo情况 */
      case 'Identifier': {
        callExpression = generateCallExpressionNode(options, [types.identifier(exportDefaultNode.declaration.name)])
        break;
      }
      /**  处理export default isInit(Demo) 情况 */
      case 'CallExpression': {
        // TODO 此处还有些问题
        callExpression = generateCallExpressionNode(options, [
          types.callExpression(
            types.identifier(exportDefaultNode.declaration.callee.name),
            exportDefaultNode.declaration.arguments,
          ),
        ]);
        console.log('CallExpression', generator(callExpression).code)
        break;
      }
      /** 处理export default function(): JSX 情况 */
      case 'FunctionDeclaration': {
        callExpression = generateCallExpressionNode(options, [
          types.functionExpression(
            exportDefaultNode.declaration.id,
            exportDefaultNode.declaration.params,
            exportDefaultNode.declaration.body,
          ),
        ]);
        break;
      }
      /** 处理export default class extends Component {} 情况 */
      case 'ClassDeclaration': {
        callExpression = generateCallExpressionNode(options, [
          types.classExpression(
            exportDefaultNode.declaration.id,
            exportDefaultNode.declaration.superClass,
            exportDefaultNode.declaration.body,
          ),
        ]);
        break;
      }
      /** 处理export default () => <View>demo</View> 情况 */
      case 'ArrowFunctionExpression': {
        callExpression = generateCallExpressionNode(options, [
          types.arrowFunctionExpression(
            exportDefaultNode.declaration.params,
            exportDefaultNode.declaration.body,
          ),
        ]);
        break;
      }
    }
    // path.replaceWith(callExpression)
    exportDefaultNode.declaration = callExpression
  }

  return {
    visitor: {
      Program(path) {
        if (this.opts && !typeof this.opts === 'object') {
          return console.error('[inject-hoc-babel]:options need to be an object.')
        }
        const options = mergeOptions(this.opts)
        // 获取编译目标文件的路径
        const filePath = this.filename || this.file.opts.filename || 'unknown'
        if (matchsFile(options, filePath)) { return }
        // 防止多次引入
        if (imported.includes(filePath)) { return }
        imported.push(filePath)
        // 处理import
        bulidImportHandler(path, options)
        // 处理export
        bulidExportHandler(path, options)
        console.log(111, imported)
        console.log(2222222, generator(path.node).code)
      }
      // ImportDeclaration(path) {
      //   if (this.opts && !typeof this.opts === 'object') {
      //     return console.error('[inject-hoc-babel]:options need to be an object.')
      //   }
      //   const options = mergeOptions(this.opts)
      //   // 获取编译目标文件的路径
      //   const filePath = this.filename || this.file.opts.filename || 'unknown'
      //   if (matchsFile(options, filePath)) { return }
      //   // 防止多次引入
      //   if (imported.includes(filePath)) { return }
      //   imported.push(filePath)
      //   const ast = generateImportHocNode(options)
      //   // parent.node.body.unshift(...ast)
      //   const hocList = options.hocList
      //   path.insertBefore(ast)
      // },

      // // // // 导出时处理
      // ExportDefaultDeclaration(path, state) {
      //   if (this.opts && !typeof this.opts === 'object') {
      //     return console.error('[inject-hoc-babel]:options need to be an object.')
      //   }
      //   const options = mergeOptions(this.opts)
      //   // 获取编译目标文件的路径
      //   const filePath = this.filename || this.file.opts.filename || 'unknown'
      //   if (matchsFile(options, filePath)) { return }
      //   // 防止多次引入
      //   if (exported.includes(filePath)) { return }
      //   exported.push(filePath)

      //   switch (path.node.declaration.type) {
      //     /** 处理export default Demo情况 */
      //     case 'Identifier': {
      //       callExpression = generateCallExpressionNode(options, [types.identifier(path.node.declaration.name)])
      //       break;
      //     }
      //     /** 处理export default isInit(Demo) 情况 */
      //     case 'CallExpression': {
      //       callExpression = generateCallExpressionNode(options, [
      //         types.callExpression(
      //           types.identifier(path.node.declaration.callee.name),
      //           path.node.declaration.arguments,
      //         ),
      //       ]);
      //       console.log('CallExpression', generator(callExpression).code)
      //       break;
      //     }
      //     /** 处理export default function(): JSX 情况 */
      //     case 'FunctionDeclaration': {
      //       callExpression = generateCallExpressionNode(options, [
      //         types.functionExpression(
      //           path.node.declaration.id,
      //           path.node.declaration.params,
      //           path.node.declaration.body,
      //         ),
      //       ]);
      //       break;
      //     }
      //     /** 处理export default class extends Component {} 情况 */
      //     case 'ClassDeclaration': {
      //       callExpression = generateCallExpressionNode(options, [
      //         types.classExpression(
      //           path.node.declaration.id,
      //           path.node.declaration.superClass,
      //           path.node.declaration.body,
      //         ),
      //       ]);
      //       break;
      //     }
      //     /** 处理export default () => <View>demo</View> 情况 */
      //     case 'ArrowFunctionExpression': {
      //       callExpression = generateCallExpressionNode(options, [
      //         types.arrowFunctionExpression(
      //           path.node.declaration.params,
      //           path.node.declaration.body,
      //         ),
      //       ]);
      //       break;
      //     }
      //   }
      //   const parent = path.findParent(item => item.type === 'Program')
      //   path.replaceWith(types.exportDefaultDeclaration(callExpression))
      // }
    }
  }
}