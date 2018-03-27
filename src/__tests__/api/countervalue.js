// @flow
import { getCurrencyByCoinType, getFiatUnit } from '@ledgerhq/currencies'
import {
  fetchCurrentCounterValues,
  fetchHistodayCounterValues,
  fetchHistodayCounterValuesMultiple,
} from '../../api/coutervalue'

test('fetchCurrentCounterValues', async () => {
  const res = await fetchCurrentCounterValues(
    [getCurrencyByCoinType(0), getCurrencyByCoinType(2)],
    getFiatUnit('EUR'),
  )
  expect(res.BTC).toBeTruthy()
  expect(res.LTC).toBeTruthy()
  expect(res.BTC.EUR).toBeGreaterThan(0)
  expect(res.LTC.EUR).toBeGreaterThan(0)
})

test('fetchHistodayCounterValues', async () => {
  const res = await fetchHistodayCounterValues(getCurrencyByCoinType(0), getFiatUnit('USD'))
  // 100 days at least
  expect(Object.keys(res).length).toBeGreaterThan(100)
})

test('fetchHistodayCounterValuesMultiple', async () => {
  const res = await fetchHistodayCounterValuesMultiple(
    [getCurrencyByCoinType(0), getCurrencyByCoinType(2)],
    getFiatUnit('USD'),
  )
  expect(res.BTC).toBeTruthy()
  expect(res.LTC).toBeTruthy()
  expect(res.BTC.USD).toBeTruthy()
  expect(res.LTC.USD).toBeTruthy()
  // 100 days at least
  expect(Object.keys(res.BTC.USD).length).toBeGreaterThan(100)
  expect(Object.keys(res.LTC.USD).length).toBeGreaterThan(100)
})
