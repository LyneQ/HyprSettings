import React, {useState} from 'react';
import {CircleQuestionMark} from "lucide-react"
import './HyprToolTip.css';

type FormatType = 'icon' | 'text';

interface HyprToolTipProps {
    format: FormatType;
    children: React.ReactNode;
}

export default function HyprToolTip({children, format}: HyprToolTipProps) {

    const [tooltipVisible, setTooltipVisible] = useState<boolean>(true);

    const handleMouseEnter = () => {
        setTooltipVisible(true);
    }

    const handleMouseLeave = () => {
        setTooltipVisible(false);E
    }

    switch (format) {
        case 'icon':
            return (
                <div className="hypr-tooltip" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <CircleQuestionMark className="hypr-tooltip-icon-main" />
                    {tooltipVisible && <div className="hypr-tooltip-content">{children}</div>}
                </div>
            )
        case 'text':
            return (
                <div className="hypr-tooltip" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <p className="hypr-tooltip-text-main">*</p>
                    {tooltipVisible && <div className="hypr-tooltip-content">{children}</div>}
                </div>
            )
    }
}

// Created by lynhe on Thursday, October 02, 2025