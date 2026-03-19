import React, { useState } from 'react'

export default function Calculator() {
  const [value, setValue] = useState('')

  const onButton = (v) => setValue((prev) => prev + v)
  const onClear = () => setValue('')
  const onCalc = () => {
    try {
      // eslint-disable-next-line no-eval
      // Simple evaluation for prototype only
      const result = eval(value)
      setValue(String(result))
    } catch (e) {
      setValue('Error')
    }
  }

  return (
    <div className="calculator">
      <input className="display" value={value} readOnly />
      <div className="keys">
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map((k) => (
          <button
            key={k}
            onClick={() => (k === '=' ? onCalc() : k === 'C' ? onClear() : onButton(k))}
            className="key"
          >
            {k}
          </button>
        ))}
        <button className="key clear" onClick={onClear}>C</button>
      </div>
    </div>
  )
}
