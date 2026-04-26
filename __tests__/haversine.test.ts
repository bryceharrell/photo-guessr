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

  it('returns an integer score for any distance', () => {
    expect(Number.isInteger(calculateScore(73))).toBe(true)
    expect(Number.isInteger(calculateScore(123.456))).toBe(true)
  })

  it('drops to roughly 37% at 100 miles (exponential characteristic distance)', () => {
    const score = calculateScore(100)
    expect(score).toBeGreaterThan(1700)
    expect(score).toBeLessThan(2000)
  })

  it('drops off faster than linear (100 miles should score below 4000)', () => {
    expect(calculateScore(100)).toBeLessThan(4000)
  })

  it('scores a 500-mile miss well below 1000', () => {
    expect(calculateScore(500)).toBeLessThan(1000)
  })

  it('never returns a negative score', () => {
    expect(calculateScore(10000)).toBeGreaterThanOrEqual(0)
  })
})
