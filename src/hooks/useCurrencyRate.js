import { useEffect, useState } from 'react'

const API_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=JPY'

/**
 * Hook to fetch the latest USD/JPY exchange rate
 */
export function useCurrencyRate() {
  const [rate, setRate] = useState(null)
  const [date, setDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchRate() {
      try {
        const response = await fetch(API_URL)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        
        if (data.rates && data.rates.JPY) {
          setRate(data.rates.JPY)
          setDate(data.date || null)
          setError(null)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Failed to fetch currency rate:', err)
        setError(err.message)
        setRate(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRate()
  }, [])

  return {
    rate,
    date,
    loading,
    error,
  }
}
