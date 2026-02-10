
import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
    const progressPercentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="h-1 bg-black w-full">
            <div
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
