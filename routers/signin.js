const router = require('koa-router')()
// 处理数据库（之前已经写好，在mysql.js）
const userModel = require('../lib/mysql.js')
// 加密
const md5 = require('md5')
// get '/signin'登录页面
router.get('/signin', async(ctx, next) => {
  await ctx.render('signin', {session: ctx.session})
})
// post '/signin'登录页面
router.post('/signin', async(ctx, next) => {
  console.log(ctx.request.body)
  let name = ctx.request.body.name
  let pass = ctx.request.body.password

  // 这里先查找用户名存在与否，存在则判断密码正确与否，不存在就返回false
  await userModel
    .findDataByName(name)
    .then(result => {
      // console.log(reslut)
      var res = JSON.parse(JSON.stringify(result))
      if (name === res[0]['name'] && md5(pass) === res[0]['pass']) {
        ctx.body = 'true'
        // ctx.flash.success='登录成功!'
        ctx.session.user = res[0]['name']
        ctx.session.id = res[0]['id']
        console.log('ctx.session.id', ctx.session.id)
        // ctx.redirect('/posts')
        console.log('session', ctx.session)
        console.log('登录成功')
      }
    })
    .catch(err => {
      ctx.body = 'false'
      console.log('用户名或密码错误!')
      // ctx.redirect('/signin')
    })
})
module.exports = router