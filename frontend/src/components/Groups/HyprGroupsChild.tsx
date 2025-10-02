import React, {useEffect, useState} from 'react'
import './HyprGroupsChild.css'

type VariableType = number | string | boolean

export type SelectOption = {
    value: string
    label: string
    isDefault?: boolean
}

interface HyprGroupsChildProps extends React.HTMLAttributes<HTMLElement> {
    type: 'number' | 'text' | 'select' | 'switch'
    variable: VariableType
    min?: number
    max?: number
    selectOptions?: SelectOption[]
    className?: string
    onChangeValue?: (value: VariableType) => void
    helpText?: string
}

export default function HyprGroupsChild(
    {
        type,
        variable,
        min,
        max,
        className,
        selectOptions,
        onChangeValue,
        helpText,
        ...rest
    }: HyprGroupsChildProps) {
    const [value, setValue] = useState<VariableType>(variable)

    useEffect(() => {
        setValue(variable)
    }, [variable])

    const handleChange = (next: VariableType) => {
        if (type === 'number' && typeof next === 'number') {
            if ((min !== undefined && next < min) || (max !== undefined && next > max)) {
                return
            }
        }
        setValue(next)
        onChangeValue?.(next)
    }

    switch (type) {
        case 'number': {
            const numVal = typeof value === 'number' ? value : Number(value ?? 0)
            return (
                <div className="hypr-groups-child__number-container">
                    <button className={className ?? '' + "hypr-groups-child__number hypr-groups-child-input"}
                            onClick={() => handleChange(numVal - 1)}>-
                    </button>
                    <button className={className ?? '' + "hypr-groups-child__number hypr-groups-child-input"}
                            onClick={() => handleChange(numVal + 1)}>+
                    </button>
                    <input
                        type="number"
                        className={className ?? '' + "hypr-groups-child__number hypr-groups-child-input"}
                        min={min}
                        max={max}
                        value={Number.isNaN(numVal) ? '' : numVal}
                        style={{ appearance: 'textfield' }}
                        onChange={(e) => {
                            const v = e.target.value
                            handleChange(v === '' ? '' : Number(v))
                        }}
                        {...rest}
                    />
                </div>
            )
        }
        case 'text': {
            return (
                <input
                    type="text"
                    className={className ?? '' + "hypr-groups-child__text-input hypr-groups-child-input"}
                    value={typeof value === 'string' ? value : String(value ?? '')}
                    onChange={(e) => handleChange(e.target.value)}
                    {...rest}
                />
            )
        }
        case 'select': {
            const options = selectOptions ?? []
            let selected  = ''
            if (typeof value === 'string' && options.some((o) => o.value === value)) {
                selected = value
            } else {
                const def = options.find((o) => o.isDefault) ?? options[0]
                selected  = def?.value ?? ''
            }
            return (
                <select
                    className={className ?? '' + "hypr-groups-child__select hypr-groups-child-input"}
                    value={selected}
                    onChange={(e) => handleChange(e.target.value)}
                    {...rest}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )
        }
        case 'switch': {
            const checked = Boolean(value)
            return (
                <input
                    type="checkbox"
                    className={className}
                    checked={checked}
                    onChange={(e) => handleChange(e.target.checked)}
                    {...rest}
                />
            )
        }
        default:
            return null
    }
}

// Created by lynhe on Sunday, September 28, 2025