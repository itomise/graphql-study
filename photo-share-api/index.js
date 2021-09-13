const { ApolloServer } = require('apollo-server')

const typeDefs = `

  # Photo型を定義します
  type Photo {
    id: ID!
    url: String!
    name: String!
    description: String
  }

  # allPhotosはPhotoを返します
  type Query {
    totalPhotos: Int!
    allPhotos: [Photo!]!
  }

  # ミューテーションによって新たに投稿されたPhotoを返します
  type Mutation {
    postPhoto(name: String! description: String): Photo!
  }
`

let _id = 0
let photos = []

const resolvers = {
  Query: {
    totalPhotos: () => photos.length,
    allPhotos: () => photos
  },

  Mutation: {
    postPhoto(parent, args) {
      const newPhoto = {
        id: _id++,
        ...args
      }
      photos.push(newPhoto)
      return newPhoto
    }
  }
}

// サーバーのインスタンスを作成
// その際、typeDefs(スキーマ)とリゾルバを引数に取る
const server = new ApolloServer({
  typeDefs,
  resolvers
})

// Webサーバーを起動
server
  .listen()
  .then(({ url }) => console.log(`GraphQL Service running on ${url}`))