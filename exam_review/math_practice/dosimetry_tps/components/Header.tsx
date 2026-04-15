
import React from 'react';

const Header: React.FC = () => {
    return (
        <div className="bg-gray-900 p-4 sm:p-6 flex justify-between items-center border-b-2 border-blue-500">
            <h1 className="text-xl sm:text-2xl text-blue-500 font-mono uppercase tracking-wider">
                TPS Console <span className="text-xs opacity-70">v4.0</span>
            </h1>
            <div className="font-mono text-xs sm:text-sm text-green-400">CALC_MODE: ACTIVE</div>
        </div>
    );
};

export default Header;
