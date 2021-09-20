const { authorizeWithGithub } = require('../lib')
const fetch = require('node-fetch')

module.exports = {

  async addFakeUsers(parent, { count }, { db }) {
    const randomUserApi = `https://randomuser.me/api/?results=${count}`

    const { results } = await fetch(randomUserApi)
      .then(res => res.json())

    const users = results.map(r => ({
      githubLogin: r.login.username,
      name: `${r.name.first} ${r.name.last}`,
      avatar: r.picture.thumbnail,
      githubToken: r.login.sha1
    }))

    await db.collection('users').insert(users)

    return users
  },

  async fakeUserAuth(parent, { githubLogin }, { db }) {
    const user = await db.collection('users').findOne({ githubLogin })

    if (!user) {
      throw new Error(`Cannot find user with githubLogin ${githubLogin}`)
    }

    return {
      token: user.githubToken,
      user
    }
  },

  async postPhoto(parent, args, { db, currentUser }) {
    if (!currentUser) {
      throw new Error('Only an authorized user can post a photo')
    }

    const newPhoto = {
      ...args.input,
      userID: currentUser.githubLogin,
      created: new Date()
    }

    const { insertedIds } = await db.collection('photos').insert(newPhoto)
    newPhoto.id = insertedIds[0]

    return newPhoto
  },

  async githubAuth(parent, { code }, { db }) {
    // 1. Githubからデータを取得する
    let {
      message,
      access_token,
      avatar_url,
      login,
      name
    } = await authorizeWithGithub({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code
    })

    // 2.メッセージがある場合は何らかのエラーが発生している
    if (message) {
      throw new Error(message)
    }

    // 3. データをひとつのオブジェクトにまとめる
    let latestUserInfo = {
      name,
      githubLogin: login,
      githubToken: access_token,
      avatar: avatar_url
    }

    // 4. 新しい情報を元にレコードを追加したり更新したりする
    await db
      .collection('users')
      .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true })

    const user = await db
      .collection('users')
      .findOne({ githubLogin: login })

      // 5. ユーザーデータとトークンを返す
    return { user, token: access_token }
  }

}