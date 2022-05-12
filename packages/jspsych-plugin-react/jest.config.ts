module.exports = {
  displayName: "jspsych-plugin-react",
  preset: "../../jest.preset.ts",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    }
  },
  transform: {
    "^.+\\.[tj]s$": "ts-jest",
    "^.+\\.(md|mdx)$": "jest-transformer-mdx",
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../../coverage/packages/jspsych-plugin-react"
};
