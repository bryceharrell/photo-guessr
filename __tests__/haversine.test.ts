import { haversineDistance, calculateScore } from '../lib/haversine'

describe('haversineDistance', () => {
  it('returns ~0 for identical coordinates', () => {
    expect(haversineDistance(40.7128, -74.006, 40.7128, -74.006)).toBeCloseTo(0, 1)
  })

  it('calculates ~2445 miles between New York and Los Angeles', () => {
    const dist = haversineDistance(40.7128, -74.006, 34.0522, -118.2437)
    expect(dist).toBeGreaterThan(2400)
    expect(dist).toBeLessThan(2500)
  })

  it('calculates ~213 miles between London and Paris', () => {
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522)
    expect(dist).toBeGreaterThan(200)
    expect(dist).toBeLessThan(225)
  })
})

describe('calculateScore', () => {
  it('returns 5000 for 0 miles', () => {
    expect(calculateScore(0)).toBe(5000)
  })

  it('returns 4000 for 100 miles', () => {
    expect(calculateScore(100)).toBe(4000)
  })

  it('returns 0 for 500 miles', () => {
    expect(calculateScore(500)).toBe(0)
  })

  it('returns 0 (not negative) for distances over 500 miles', () => {
    expect(calculateScore(1000)).toBe(0)
  })
})
