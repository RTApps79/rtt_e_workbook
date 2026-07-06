
import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface QuizScreenProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    onNext: () => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ question, onAnswer, onNext }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [patientId, setPatientId] = useState('');

    useEffect(() => {
        setSelectedAnswer(null);
        setShowHint(false);
        setPatientId(String(Math.floor(Math.random() * 90000) + 10000));
    }, [question]);

    const handleOptionClick = (index: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(index);
        onAnswer(index === question.correct);
    };

    const getButtonClass = (index: number) => {
        if (selectedAnswer === null) {
            return 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-500';
        }
        if (index === question.correct) {
            return 'bg-green-700 border-green-500';
        }
        if (index === selectedAnswer && index !== question.correct) {
            return 'bg-red-700 border-red-500 opacity-60';
        }
        return 'bg-gray-700 border-gray-600 opacity-50 cursor-default';
    };

    return (
        <div className="p-6 md:p-10">
            <div className="flex justify-between items-center mb-2">
                <span className="system-status font-mono text-sm text-green-400">{question.cat}</span>
                <button
                    onClick={() => setShowHint(!showHint)}
                    className="bg-transparent border-none text-gray-500 cursor-pointer text-xs underline hover:text-orange-400"
                >
                    [ Show Formula ]
                </button>
            </div>
            
            {showHint && (
                <div className="text-orange-400 font-mono mb-4 text-center text-sm p-2 bg-black/20 rounded">
                    {question.hint}
                </div>
            )}

            <div className="bg-black border border-gray-700 rounded-md p-5 mb-6 shadow-inner">
                <div className="border-b border-gray-700 pb-2 mb-3 font-bold text-white">
                    PATIENT CHART: <span className="text-green-400">{patientId}</span>
                </div>
                <p className="mb-4 text-white">{question.scenario}</p>
                <table className="w-full text-sm font-mono">
                    <tbody>
                        {Object.entries(question.data).map(([key, value]) => (
                            <tr key={key} className="border-b border-gray-800 last:border-b-0">
                                <td className="py-2 text-gray-500 w-2/5">{key}</td>
                                <td className="py-2 text-green-400">{value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleOptionClick(index)}
                        disabled={selectedAnswer !== null}
                        className={`p-4 rounded-md text-left font-mono border transition-all duration-200 ${getButtonClass(index)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {selectedAnswer !== null && (
                <div className="bg-gray-900 p-5 rounded-md mt-6 border-l-4 border-blue-500">
                    <h3 className="text-xl font-bold text-blue-500 mb-2">Calculation Log</h3>
                    <p className="text-sm text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: question.expl }}></p>
                    
                    {question.diagram && (
                        <div className="my-4 p-2 bg-black rounded border border-gray-700 flex justify-center">
                            <div dangerouslySetInnerHTML={{ __html: question.diagram }} />
                        </div>
                    )}

                    <div className="bg-black text-white p-4 font-mono text-sm rounded-md border border-dashed border-gray-700 whitespace-pre-wrap">
                        {question.math}
                    </div>
                    <button
                        onClick={onNext}
                        className="bg-blue-500 text-white font-bold py-2 px-6 rounded-md uppercase text-sm hover:bg-blue-600 transition-colors duration-200 mt-5 w-full sm:w-auto"
                    >
                        Next Calculation
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuizScreen;
