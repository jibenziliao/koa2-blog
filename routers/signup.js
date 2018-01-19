const router = require('koa-router')()
// 处理数据库（之前已经写好，在mysql.js）
const userModel = require('../lib/mysql.js')
const checkNotLogin = require('../middlewares/check.js').checkNotLogin
const checkLogin = require('../middlewares/check.js').checkLogin
// 加密
const md5 = require('md5')
const moment = require('moment')
const fs = require('fs')

router.get('/signup', async (ctx, next) => {
  await checkNotLogin(ctx)
  await ctx.render('signup', { session: ctx.session })
})
// POST '/signup' 注册页
router.post('/signup', async (ctx, next) => {
  console.log(ctx.request.body)
  let user = {
    name: ctx.request.body.name,
    pass: ctx.request.body.password,
    repeatpass: ctx.request.body.repeatpass,
    avator: ctx.request.body.avator
  }
  await userModel.findDataByName(user.name).then(async result => {
    console.log(result)
    if (result.length) {
      try {
        throw Error('用户存在')
      } catch (error) {
        //处理err
        console.log(error)
      }
      ctx.body = {
        data: 1
      }
    } else if (user.pass !== user.repeatpass || user.pass === '') {
      ctx.body = {
        data: 2
      }
    } else {
      let base64Data = user.avator.replace(/^data:image\/\w+;base64,/, '')
      let dataBuffer = new Buffer(base64Data, 'base64')
      let getName =
        Number(
          Math.random()
            .toString()
            .substr(3)
        ).toString(36) + Date.now()
      let upload = await new Promise((resolve, reject) => {
        fs.writeFile('./public/images/' + getName + '.png', dataBuffer, err => {
          if (err) {
            throw err
            reject(false)
          }
          resolve(true)
        })
      })
      if (upload) {
        await userModel
          .insertData([user.name, md5(user.pass), getName + '.png', moment().format('YYYY-MM-DD HH:mm:ss')])
          .then(res => {
            ctx.body = {
              data: 3
            }
            console.log('注册成功')
          })
      } else {
        consol.log('头像上传失败')
        ctx.body = {
          data: 4
        }
      }
    }
  })
})
module.exports = router
