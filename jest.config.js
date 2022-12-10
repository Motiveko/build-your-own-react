const config = {
  transform: {
    '\\.js$': 'babel-jest'  // jest 실행시 js파일을 babel을 한번 돌린다.(설정을 읽는다.)
  },
  testEnvironment: 'jsdom' // jest-environment-jsdom 설치 필요
}

export default config;