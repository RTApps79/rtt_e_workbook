
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Question } from './types';
import { generateQuestions } from './services/questionGenerator';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import EndScreen from './components/EndScreen';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import Footer from './components/Footer';

const TOTAL_QUESTIONS = 10;

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Start);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);

    const startGame = useCallback((categories?: string[]) => {
        setScore(0);
        setCurrentQuestionIndex(0);
        setQuestions(generateQuestions(TOTAL_QUESTIONS, categories));
        setGameState(GameState.Quiz);
    }, []);
    
    const restartGame = useCallback(() => {
        setGameState(GameState.Start);
    }, []);

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            setGameState(GameState.End);
        }
    };

    const renderContent = () => {
        switch (gameState) {
            case GameState.Start:
                return <StartScreen onStart={startGame} />;
            case GameState.Quiz:
                return (
                    <QuizScreen
                        question={questions[currentQuestionIndex]}
                        onAnswer={handleAnswer}
                        onNext={handleNextQuestion}
                    />
                );
            case GameState.End:
                return <EndScreen score={score} totalQuestions={questions.length} onRestart={restartGame} />;
            default:
                return <StartScreen onStart={startGame} />;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-gray-200 p-4">
            <div className="bg-gray-800 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden border border-gray-700 flex flex-col">
                {gameState !== GameState.Start && (
                    <>
                        <ProgressBar current={currentQuestionIndex} total={questions.length} />
                        <Header />
                    </>
                )}
                {renderContent()}
            </div>
            <Footer />
        </div>
    );
};

export default App;
