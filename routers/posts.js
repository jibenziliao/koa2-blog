const router = require('koa-router')()
// 处理数据库（之前已经写好，在mysql.js）
const userModel = require('../lib/mysql.js')
// 时间中间件
const moment = require('moment')
const checkNotLogin = require('../middlewares/check.js').checkNotLogin
const checkLogin = require('../middlewares/check.js').checkLogin
const md = require('markdown-it')()

// get '/'页面
router.get('/', async (ctx, next) => {
  ctx.redirect('/posts')
})
// get '/posts'页面
router.get('/posts', async (ctx, next) => {
  let res,
    postsLength,
    name = decodeURIComponent(ctx.request.querystring.split('=')[1])
  if (ctx.request.querystring) {
    console.log('ctx.request.querystring', name)
    await userModel.findDataByUser(name).then(result => {
      postsLength = result.length
    })
    await userModel.findPostByUserPage(name, 1).then(result => {
      res = result
    })
    await ctx.render('selfPosts', {
      session: ctx.session,
      posts: res,
      postsPageLength: Math.ceil(postsLength / 10)
    })
  } else {
    await userModel.findPostByPage(1).then(result => {
      res = result
    })
    await userModel.findAllPost().then(result => {
      postsLength = result.length
    })
    await ctx.render('posts', {
      session: ctx.session,
      posts: res,
      postsLength: postsLength,
      postsPageLength: Math.ceil(postsLength / 10)
    })
  }
})

router.post('/posts/page', async (ctx, next) => {
  let page = ctx.request.body.page
  await userModel
    .findPostByUserPage(page)
    .then(result => {
      ctx.body = result
    })
    .catch(() => {
      ctx.body = 'error'
    })
})

router.post('/posts/self/page', async (ctx, next) => {
  let data = ctx.request.body
  await userModel
    .findPostByUserPage(data.name, data.page)
    .then(result => {
      ctx.body = result
    })
    .catch(() => {
      ctx.body = 'error'
    })
})

router.get('/create', async (ctx, next) => {
  await ctx.render('create', { session: ctx.session })
})

// psot '/create'
router.post('/create', async (ctx, next) => {
  let title = ctx.request.body.title,
    content = ctx.request.body.content,
    id = ctx.session.id,
    name = ctx.session.user,
    time = moment().format('YYYY-MM-DD HH:mm'),
    avator = null,
    newContent = content.replace(/[<">']/g, target => {
      return {
        '<': '&lt;',
        '"': '&quot;',
        '>': '&gt;',
        "'": '&#39;'
      }[target]
    }),
    newTitle = title.replace(/[<">']/g, target => {
      return {
        '<': '&lt;',
        '"': '&quot;',
        '>': '&gt;',
        "'": '&#39;'
      }[target]
    })
  await userModel.findUserData(ctx.session.user).then(res => {
    avator = res[0]['avator']
  })
  await userModel
    .insertPost([name, newTitle, md.render(content), content, id, time, avator])
    .then(() => {
      ctx.body = true
    })
    .catch(err => {
      console.dir(err)
      ctx.body = false
    })
})

router.get('/posts/:postId', async (ctx, next) => {
  let commentRes,
    res,
    pageOne,
    resPv = null
  await userModel.findDataById(ctx.params.postId).then(result => {
    res = result
    resPv = parseInt(result[0]['pv'])
    resPv += 1
  })
  await userModel.updatePostPv([resPv, ctx.params.postId])
  await userModel.findCommentByPage(1, ctx.params.postId).then(result => {
    pageOne = result
  })
  await userModel.findCommentById(ctx.params.postId).then(result => {
    commentRes = result
  })
  await ctx.render('sPost', {
    session: ctx.session,
    posts: res[0],
    commentLength: commentRes.length,
    commentPageLength: Math.ceil(commentRes.length / 10),
    pageOne: pageOne
  })
})
module.exports = router
