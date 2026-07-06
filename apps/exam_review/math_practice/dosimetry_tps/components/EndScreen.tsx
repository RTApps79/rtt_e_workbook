
import React from 'react';

interface EndScreenProps {
    score: number;
    totalQuestions: number;
    onRestart: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ score, totalQuestions, onRestart }) => {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
    return (
        <div className="p-10 text-center flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-100">Planning Session Complete</h2>
            <div className={`text-7xl font-bold my-5 ${percentage > 70 ? 'text-blue-500' : 'text-orange-500'}`}>
                {percentage}%
            </div>
            <p className="text-gray-400">You correctly answered {score} out of {totalQuestions} questions.</p>
            <p className="text-gray-500 mt-2">Review the log for any calculation errors.</p>
            <button
                onClick={onRestart}
                className="bg-blue-500 text-white font-bold py-3 px-8 rounded-md uppercase text-lg hover:bg-blue-600 transition-colors duration-200 mt-6"
            >
                New Session
            </button>
        </div>
    );
};

export default EndScreen;
