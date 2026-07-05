
export enum GameState {
    Start,
    Quiz,
    End,
}

export interface Question {
    cat: string;
    scenario: string;
    data: Record<string, string>;
    hint: string;
    options: string[];
    correct: number;
    expl: string;
    math: string;
    diagram?: string;
}

export interface QuestionTemplate {
    cat: string;
    generate: () => Question;
}
