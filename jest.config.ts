import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^mapbox-gl$': '<rootDir>/__mocks__/mapbox-gl.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
