import { useState, useRef, useEffect } from 'react'
import { useCurrencyRate } from '../hooks/useCurrencyRate'

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const JPY_FORMATTER = new Intl.NumberFormat('ja-JP', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const QUICK_AMOUNTS = [1000, 5000, 10000, 20000]

export default function CurrencyConverter() {
  const { rate, date, loading, error } = useCurrencyRate()
  
  const [jpyValue, setJpyValue] = useState('')
  const [usdValue, setUsdValue] = useState('')
  const [direction, setDirection] = useState('jpy-to-usd')
  
  // Track which field was last edited to avoid calculation loops
  const lastEditedRef = useRef(null)

  function handleJpyChange(e) {
    const value = e.target.value
    setJpyValue(value)
    lastEditedRef.current = 'jpy'

    if (!value || !rate) {
      setUsdValue('')
      return
    }

    const jpy = parseFloat(value.replace(/,/g, ''))
    if (!isNaN(jpy)) {
      const usd = jpy / rate
      setUsdValue(USD_FORMATTER.format(usd))
    } else {
      setUsdValue('')
    }
  }

  function handleUsdChange(e) {
    const value = e.target.value
    setUsdValue(value)
    lastEditedRef.current = 'usd'

    if (!value || !rate) {
      setJpyValue('')
      return
    }

    const usd = parseFloat(value.replace(/,/g, ''))
    if (!isNaN(usd)) {
      const jpy = usd * rate
      setJpyValue(JPY_FORMATTER.format(jpy))
    } else {
      setJpyValue('')
    }
  }

  function handleSwap() {
    setDirection((prev) => (prev === 'jpy-to-usd' ? 'usd-to-jpy' : 'jpy-to-usd'))
    
    // Swap values
    const tempJpy = jpyValue
    const tempUsd = usdValue
    
    setJpyValue(tempUsd)
    setUsdValue(tempJpy)
    
    lastEditedRef.current = null
  }

  function handleQuickAmount(amount) {
    setJpyValue(JPY_FORMATTER.format(amount))
    lastEditedRef.current = 'jpy'

    if (rate) {
      const usd = amount / rate
      setUsdValue(USD_FORMATTER.format(usd))
    }
  }

  if (loading) {
    return (
      <section className="currency-converter">
        <h2 className="section-title">Currency Converter</h2>
        <div className="converter-loading">
          <p className="loading-text">Loading rate...</p>
        </div>
      </section>
    )
  }

  if (error || !rate) {
    return (
      <section className="currency-converter">
        <h2 className="section-title">Currency Converter</h2>
        <div className="converter-error">
          <p className="error-text">Rate unavailable</p>
          {error && <p className="error-detail">{error}</p>}
        </div>
      </section>
    )
  }

  return (
    <section className="currency-converter">
      <h2 className="section-title">Currency Converter</h2>
      
      <div className="converter-rate">
        <p className="rate-display">
          1 USD = {JPY_FORMATTER.format(rate)} JPY
        </p>
        {date && (
          <p className="rate-date">as of {date}</p>
        )}
      </div>

      <div className="converter-inputs">
        <div className="converter-field">
          <label htmlFor="jpy-input">JPY (¥)</label>
          <input
            id="jpy-input"
            type="text"
            inputMode="decimal"
            value={jpyValue}
            onChange={handleJpyChange}
            placeholder="0"
          />
        </div>

        <button
          type="button"
          className="swap-btn"
          onClick={handleSwap}
          aria-label="Swap currencies"
        >
          ⇄
        </button>

        <div className="converter-field">
          <label htmlFor="usd-input">USD ($)</label>
          <input
            id="usd-input"
            type="text"
            inputMode="decimal"
            value={usdValue}
            onChange={handleUsdChange}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="quick-amounts">
        <p className="quick-label">Quick amounts:</p>
        <div className="quick-buttons">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              className="quick-btn"
              onClick={() => handleQuickAmount(amount)}
            >
              ¥{JPY_FORMATTER.format(amount)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
