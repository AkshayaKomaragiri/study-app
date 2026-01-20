"use client";
import Flashcard from "./components/flashcard";
import React, { useEffect, useState } from 'react';
import { Button, FormControl, FormLabel, Input, Modal, ModalDialog, Stack, Typography, Divider, Box, CircularProgress, Select, Option } from '@mui/joy';
import Add from '@mui/icons-material/Add';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faLayerGroup, faBrain, faMicrochip } from '@fortawesome/free-solid-svg-icons';

interface FlashCardData {
  question: string;
  answer: string;
  flashcardSetId: number;
}

interface QuizQuestion {
  question: string;
  correctAnswer: string;
}

export default function FlashcardPage() {
  const [view, setView] = useState<'flashcards' | 'learn'>('flashcards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<FlashCardData[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2:1b');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const searchParams = useSearchParams();
  const title = searchParams.get('title');
  const setID = Number(searchParams.get('setID'));

  // PRE-FETCHING LOGIC: Generate quiz as soon as data is available
  useEffect(() => {
    const init = async () => {
      const flashcards = await fetchData();
      if (flashcards && flashcards.length > 0) {
        generateQuiz(flashcards);
      }
    };
    init();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/flashcards');
      if (!response.ok) throw new Error('Network response was not ok.');
      const responseData = await response.json();
      const flashcards = responseData.flashcards || [];
      setData(flashcards);
      return flashcards.filter((f: any) => f.flashcardSetId === setID);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async (cardsToUse = filteredFlashcards) => {
    if (cardsToUse.length === 0 || isGenerating) return;
    setIsGenerating(true);
    console.log("Ollama: Starting Question Generation...");

    const cardsContext = cardsToUse
      .map((f, i) => `Card ${i + 1}: Q: ${f.question} | A: ${f.answer}`)
      .join('\n');

    const prompt = `Act as a strict exam creator. Based on these cards:\n${cardsContext}\nGenerate 25 questions. Format: Q: [Question] A: [Answer] ---`;

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: selectedModel, 
          messages: [{ role: 'user', content: prompt }],
          stream: false 
        }),
      });

      const result = await response.json();
      console.log("Ollama Thinking Result:", result.response); // VISIBLE IN CONSOLE
      parseQuestions(result.response);
    } catch (err) {
      setError("Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const checkAnswerWithAI = async () => {
    if (!userAnswer.trim()) return;
    setIsChecking(true);
    const currentQ = quizQuestions[quizIdx];

    // STRICT PROMPT: Prevent AI from being "too nice"
    const prompt = `STRICT GRADING SYSTEM.
    Question: ${currentQ.question}
    Reference Correct Answer: ${currentQ.correctAnswer}
    User's Attempt: ${userAnswer}
    
    If the user's attempt is wrong or nonsensical, you MUST say "Incorrect". 
    Only say "Correct" if the core meaning matches.
    Only say "Close" if they are 90% there but missed a tiny detail.
    Explain the difference.`;

    try {
      console.log("Ollama: Checking Answer...");
      const resp = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: selectedModel, 
          messages: [{ role: 'user', content: prompt }],
          stream: false 
        }),
      });
      const result = await resp.json();
      console.log("Ollama Grading Logic:", result.response); // VISIBLE IN CONSOLE
      setAiFeedback(result.response);
    } catch (e) {
      setAiFeedback("Error checking answer.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:3000/postFlashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, flashcardSetId: Number(setID) }),
      });
      if (response.ok) {
        setOpen(false);
        setQuestion('');
        setAnswer('');
        fetchData();
      }
    } catch (error) {
      setError('Error sending data to server');
    }
  };

  const filteredFlashcards = data.filter(f => f.flashcardSetId === setID);

  const parseQuestions = (text: string) => {
    const pairs = text.split('---');
    const parsed: QuizQuestion[] = pairs.map(p => {
      const qMatch = p.match(/Q: (.*)/);
      const aMatch = p.match(/A: (.*)/);
      return {
        question: qMatch ? qMatch[1].trim() : '',
        correctAnswer: aMatch ? aMatch[1].trim() : ''
      };
    }).filter(q => q.question !== '');
    setQuizQuestions(parsed);
  };

  const nextQuestion = () => {
    setUserAnswer('');
    setAiFeedback('');
    setQuizIdx(prev => prev + 1);
  };

  return (
    <React.Fragment>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
        <Box sx={{ width: 80, borderRight: '1px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 10, gap: 2 }}>
          <Button variant="plain" onClick={() => setView('flashcards')} sx={{ color: view === 'flashcards' ? 'white' : 'rgba(255,255,255,0.5)' }}>
            <Stack alignItems="center">
              <FontAwesomeIcon icon={faLayerGroup} />
              <Typography level="body-xs" textColor="inherit">Cards</Typography>
            </Stack>
          </Button>
          <Divider sx={{ bgcolor: 'white', width: '60%', opacity: 0.5 }} />
          <Button variant="plain" onClick={() => setView('learn')} sx={{ color: view === 'learn' ? 'white' : 'rgba(255,255,255,0.5)' }}>
            <Stack alignItems="center">
              <FontAwesomeIcon icon={faBrain} />
              <Typography level="body-xs" textColor="inherit">Learn</Typography>
            </Stack>
          </Button>
        </Box>

        <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography level="h1" sx={{ color: 'white', mb: 4 }}>{title}</Typography>

          {view === 'flashcards' ? (
            <>
              <Button startDecorator={<Add />} onClick={() => setOpen(true)} sx={{ mb: 6 }}>Add new card</Button>
              {filteredFlashcards.length > 0 ? (
                <Stack direction="row" spacing={4} alignItems="center">
                  <Button variant="plain" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} sx={{ color: 'white' }}>
                    <FontAwesomeIcon icon={faChevronLeft} size="2x" />
                  </Button>
                  <Flashcard prompt={filteredFlashcards[currentIdx].question} answer={filteredFlashcards[currentIdx].answer} />
                  <Button variant="plain" onClick={() => setCurrentIdx(i => Math.min(filteredFlashcards.length - 1, i + 1))} disabled={currentIdx === filteredFlashcards.length - 1} sx={{ color: 'white' }}>
                    <FontAwesomeIcon icon={faChevronRight} size="2x" />
                  </Button>
                </Stack>
              ) : <Typography textColor="white">No cards yet.</Typography>}
              <Typography sx={{ mt: 4, color: 'rgba(255,255,255,0.6)' }}>{currentIdx + 1} / {filteredFlashcards.length}</Typography>
            </>
          ) : (
            <Box sx={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <Typography textColor="white" startDecorator={<FontAwesomeIcon icon={faMicrochip} />}>AI Model:</Typography>
                <Select value={selectedModel} onChange={(_, newValue) => setSelectedModel(newValue!)} sx={{ minWidth: 200, bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  <Option value="llama3.2:1b">Llama 3.2 (Fastest)</Option>
                  <Option value="phi3:mini">Phi-3 Mini (Balanced)</Option>
                  <Option value="llama3.1">Llama 3.1 (Smartest)</Option>
                </Select>
              </Box>

              {isGenerating && quizQuestions.length === 0 ? (
                <Stack alignItems="center" spacing={2} sx={{ mt: 10 }}>
                  <CircularProgress size="lg" />
                  <Typography textColor="white">AI is background-preparing your quiz...</Typography>
                </Stack>
              ) : quizIdx < quizQuestions.length ? (
                <Stack spacing={3} sx={{ mt: 4 }}>
                  <Typography level="h4" textColor="white">Question {quizIdx + 1} of {quizQuestions.length}</Typography>
                  <Typography level="body-lg" sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 4, borderRadius: 'md', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {quizQuestions[quizIdx].question}
                  </Typography>
                  <Input autoFocus placeholder="Type your answer..." value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !aiFeedback) checkAnswerWithAI(); }} disabled={!!aiFeedback} sx={{ p: 2 }} />
                  {!aiFeedback ? (
                    <Button onClick={checkAnswerWithAI} loading={isChecking} disabled={!userAnswer}>Check Answer</Button>
                  ) : (
                    <Stack spacing={3}>
                      <Box sx={{ p: 3, borderRadius: 'md', bgcolor: 'rgba(0,0,0,0.2)', borderLeft: '4px solid lightblue' }}>
                        <Typography sx={{ color: 'lightblue', textAlign: 'left' }}>{aiFeedback}</Typography>
                      </Box>
                      <Button color="success" onClick={nextQuestion}>Next Question</Button>
                    </Stack>
                  )}
                </Stack>
              ) : (
                <Stack spacing={2} sx={{ mt: 10 }}>
                  <Typography textColor="white" level="h4">All set! Questions generated.</Typography>
                  <Button onClick={() => generateQuiz()}>Refresh Quiz</Button>
                </Stack>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog sx={{ bgcolor: 'background.surface', color: 'text.primary', minWidth: 400 }}>
          <Typography level="h4" mb={2}>Add New Flashcard</Typography>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <Stack spacing={2}>
              <FormControl><FormLabel>Prompt</FormLabel><Input autoFocus required value={question} onChange={e => setQuestion(e.target.value)} /></FormControl>
              <FormControl><FormLabel>Answer</FormLabel><Input required value={answer} onChange={e => setAnswer(e.target.value)} /></FormControl>
              <Button type="submit">Add Card</Button>
            </Stack>
          </form>
        </ModalDialog>
      </Modal>
    </React.Fragment>
  );
}