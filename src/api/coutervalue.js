/**
 * @flow
 * @module api/countervalue
 */
import querystring from 'querystring'
import axios from 'axios'
import type { Currency, Unit, CounterValuesPairing, Histoday } from '../types'
import { formatCounterValueDay } from '../helpers/countervalue'

const convertToSatCent = (currency: Currency, fiatUnit: Unit, value: number): number =>
  value * 10 ** (fiatUnit.magnitude - currency.units[0].magnitude)

/**
 * @memberof api/countervalue
 */
export async function fetchCurrentCounterValues(
  currencies: Currency[],
  fiatUnit: Unit,
): Promise<CounterValuesPairing<number>> {
  const { data }: { data: mixed } = await axios.get(
    'https://min-api.cryptocompare.com/data/pricemulti?' +
      querystring.stringify({
        extraParams: 'ledger-test',
        fsyms: currencies.map(c => c.units[0].code).join(','),
        tsyms: fiatUnit.code,
      }),
  )
  const out = {}
  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (data && typeof data === 'object') {
    Object.keys(data).forEach(ticker => {
      const currency = currencies.find(c => c.units[0].code === ticker)
      const map = data[ticker]
      if (currency && map && typeof map === 'object') {
        const value = map[fiatUnit.code]
        if (typeof value === 'number') {
          out[ticker] = {
            [fiatUnit.code]: convertToSatCent(currency, fiatUnit, value),
          }
        }
      }
    })
  }
  return out
}

/**
 * @memberof api/countervalue
 */
export async function fetchHistodayCounterValues(
  currency: Currency,
  fiatUnit: Unit,
): Promise<Histoday> {
  const { data }: { data: mixed } = await axios.get(
    'https://min-api.cryptocompare.com/data/histoday?' +
      querystring.stringify({
        extraParams: 'ledger-test',
        fsym: currency.units[0].code,
        tsym: fiatUnit.code,
        allData: 1,
      }),
  )
  const out = {}

  // we'll replace in-place the map to convert the crypto to a sats/cents mapping
  if (data && typeof data === 'object' && Array.isArray(data.Data)) {
    for (const item of data.Data) {
      if (!item || typeof item !== 'object') continue
      const { time, close } = item
      if (typeof close !== 'number' || typeof time !== 'number') continue
      const day = formatCounterValueDay(new Date(time * 1000))
      out[day] = convertToSatCent(currency, fiatUnit, close)
    }
  }

  return out
}

/**
 * @memberof api/countervalue
 */
export function fetchHistodayCounterValuesMultiple(
  currencies: Currency[],
  fiatUnit: Unit,
): Promise<CounterValuesPairing<Histoday>> {
  return Promise.all(
    currencies.map(currency => fetchHistodayCounterValues(currency, fiatUnit)),
  ).then(all => {
    const data = {}
    all.forEach((histoday, i) => {
      const currency = currencies[i]
      data[currency.units[0].code] = {
        [fiatUnit.code]: histoday,
      }
    })
    return data
  })
}
