
import React, { useState } from 'react';
import { questionTemplates } from '../services/questionGenerator';

interface StartScreenProps {
    onStart: (categories?: string[]) => void;
}

const allCategories = [...new Set(questionTemplates.map(q => q.cat))];

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [practiceMode, setPracticeMode] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategories);

    const handleCategoryChange = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCategories.length === allCategories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(allCategories);
        }
    };

    return (
        <div className="p-10 text-center flex flex-col items-center">
            <div className="text-6xl mb-4">🖥️</div>
            <h2 className="text-3xl font-bold text-gray-100">Dosimetry & Treatment Planning</h2>
            <p className="text-gray-400 max-w-lg mx-auto my-4">
                Review ARRT Sections 3 & 4.<br />
                <strong className="text-orange-400">Warning:</strong> Patient charts contain distractor variables.
            </p>

            {!practiceMode ? (
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button
                        onClick={() => onStart()}
                        className="bg-blue-500 text-white font-bold py-3 px-8 rounded-md uppercase text-lg hover:bg-blue-600 transition-colors duration-200"
                    >
                        Start Full Quiz
                    </button>
                    <button
                        onClick={() => setPracticeMode(true)}
                        className="bg-gray-700 text-white font-bold py-3 px-8 rounded-md uppercase text-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                        Practice Specific Skills
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-2xl mt-6 text-left">
                    <h3 className="text-xl font-bold text-center text-blue-400 mb-2">Select Practice Topics</h3>
                    <p className="text-center text-xs text-gray-500 mb-4">All questions are dynamically generated for endless practice.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-4 bg-gray-900/50 rounded-lg">
                        {allCategories.map(cat => (
                            <label key={cat} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"
                                    checked={selectedCategories.includes(cat)}
                                    onChange={() => handleCategoryChange(cat)}
                                />
                                <span className="text-gray-300 font-mono text-sm">{cat}</span>
                            </label>
                        ))}
                    </div>
                     <div className="flex justify-center items-center mt-4 gap-4">
                        <button onClick={toggleSelectAll} className="text-xs text-gray-400 hover:text-white underline">
                            {selectedCategories.length === allCategories.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
                         <button
                            onClick={() => onStart(selectedCategories)}
                            disabled={selectedCategories.length === 0}
                            className="bg-green-600 text-white font-bold py-3 px-8 rounded-md uppercase text-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                           Start Practice ({selectedCategories.length})
                        </button>
                        <button onClick={() => setPracticeMode(false)} className="text-gray-400 py-2 px-4 hover:text-white">
                            Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StartScreen;
