import React, {useState} from 'react'
import HyprGroupsChild, {SelectOption} from '../components/Groups/HyprGroupsChild'

export default function Design({}) {
  const [num, setNum] = useState<number>(5)
  const [text, setText] = useState<string>('hello')
  const [choice, setChoice] = useState<string>('b')
  const [flag, setFlag] = useState<boolean>(true)

  const options: SelectOption[] = [
    {value: 'a', label: 'Option A'},
    {value: 'b', label: 'Option B', isDefault: true},
    {value: 'c', label: 'Option C'}
  ]

  return (
    <div className="container" style={{display: 'grid', gap: '12px', maxWidth: 480}}>
      <div>
        <label>Number:</label>
        <HyprGroupsChild
          type="number"
          variable={num}
          min={0}
          max={10}
          onChangeValue={(v) => (typeof v === 'number' ? setNum(v) : setNum(Number(v) || 0))}
        />
        <div>Value: {String(num)}</div>
      </div>

      <div>
        <label>Text:</label>
        <HyprGroupsChild type="text" variable={text} onChangeValue={(v) => setText(String(v))} />
        <div>Value: {text}</div>
      </div>

      <div>
        <label>Select:</label>
        <HyprGroupsChild
          type="select"
          variable={choice}
          selectOptions={options}
          onChangeValue={(v) => setChoice(String(v))}
        />
        <div>Value: {choice}</div>
      </div>

      <div>
        <label>Switch:</label>
        <HyprGroupsChild type="switch" variable={flag} onChangeValue={(v) => setFlag(Boolean(v))} />
        <div>Value: {String(flag)}</div>
      </div>
    </div>
  )
}

// Created by lynhe on Sunday, September 28, 2025