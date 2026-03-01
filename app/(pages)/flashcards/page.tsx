"use client";
import Flashcard from "./components/flashcard";
import React, { useEffect, useState } from 'react';
import { Button, FormControl, FormLabel, Input, Modal, ModalDialog, Stack, Typography, Divider, Box, CircularProgress, Select, Option } from '@mui/joy';
import Add from '@mui/icons-material/Add';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faLayerGroup, faBrain, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import { Progress } from "@/components/ui/progress"
import Lottie from 'lottie-react';
import confetti from '@/app/assets/confetti.json';

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
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<FlashCardData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [numberCorrect, setNumberCorrect] = useState(0);
  const [numberIncorrect, setNumberIncorrect] = useState(0);
  const [length, setLength] = useState(0);

  const searchParams = useSearchParams();
  const title = searchParams.get('title');
  const setID = Number(searchParams.get('setID'));

 
  useEffect(() => {
    const init = async () => {
      const flashcards = await fetchData();
      setData(flashcards)
      
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



  const shuffleOptions = (arr: string[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  async function loadOptions() {
    if (filteredFlashcards.length === 0) return;
    const card = filteredFlashcards[currentIdx];
    setIsLoadingOptions(true);
    setFeedback(null);
    setSelectedOption(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: card.question, answer: card.answer }),
      });
      
      
      const data = await response.json();
     
      const distractors: string[] = data.distractors || [];
      const correctAnswer = card.answer;
      const allOptions = shuffleOptions([correctAnswer, ...distractors]);
      setOptions(allOptions);
    } catch (error) {
      setError("Error loading options");
    } finally {
      setIsLoadingOptions(false);
    }
  }

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

  useEffect(() => {
    if (view === 'learn' && filteredFlashcards.length > 0) {
      loadOptions();
    }
  }, [view, currentIdx, filteredFlashcards.length]);

  const correct = () => {
    const step = (1 / filteredFlashcards.length) * 100;
  
    setProgress((p) => {
      const newProgress = p + step;
      return newProgress >= 100 ? 100 : newProgress;
    });
  
    setCurrentIdx((i) => i + 1);
  };

  const shuffle = (array: FlashCardData[]) => { 
  for (let i = array.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1)); 
    [array[i], array[j]] = [array[j], array[i]]; 
  } 
  return array; 
}; 

  const learnMode = () => {
    setView("learn");
    setProgress(0);
    setCurrentIdx(0);
    shuffle(data); 
  }

  const processQuestion = (array: FlashCardData[]) => {
    for (let i = array.length - 1; i > 0; i--) { 
    const options = generateOptions(array[i].question, array[i].answer) 
    return options
  } 
  }

  const correctAnswer = filteredFlashcards[currentIdx]?.answer;
  

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
          <Button variant="plain" onClick={learnMode} sx={{ color: view === 'learn' ? 'white' : 'rgba(255,255,255,0.5)' }}>
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
            currentIdx < filteredFlashcards.length ? (
    <React.Fragment>
      <div className="flex justify-center items-center w-full">
        <Progress value={progress} className="w-[60%]" />
      </div>
      {filteredFlashcards.length > 0 && (
        <>
          <h1 className="mt-10 w-[60%] text-white text-center">
            {filteredFlashcards[currentIdx].question}
          </h1>
          {isLoadingOptions ? (
            <Typography sx={{ mt: 4, color: "white" }}>Loading options...</Typography>
          ) : (
            <div className="mt-8 flex flex-col gap-3 w-[60%]">
              {options.map((opt) => (
                <Button
                  key={opt}
                  variant={selectedOption === opt ? "solid" : "outlined"}
                  onClick={() => setSelectedOption(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
      <div className="flex justify-center items-center mt-10 w-full gap-3 flex-wrap">
        {feedback === "Correct!" || feedback === `Not quite. The correct answer is: ${correctAnswer}` ? (
          <Button
            color="success"
            onClick={() => {
              correct();
              setFeedback(null);
            }}
          >
            Next question
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (selectedOption == null) return;
              const correctAnswer = filteredFlashcards[currentIdx]?.answer;
              if (selectedOption === correctAnswer) {
                setFeedback("Correct!");
                setNumberCorrect(numberCorrect + 1);
              } else {
                setFeedback(`Not quite. The correct answer is: ${correctAnswer}`);
                setNumberIncorrect(numberIncorrect + 1);
              }
            }}
            disabled={selectedOption == null}
          >
            Check Answer
          </Button>
        )}
      </div>
      {feedback && (
        <Typography
          sx={{
            mt: 2,
            color: feedback === "Correct!" ? "success.plainColor" : "danger.plainColor",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {feedback}
        </Typography>
      )}
    </React.Fragment>
  ) : (
    <div className="flex flex-col items-center">
      <div className="flex flex-row justify-center items-center w-full">
      <Lottie
        animationData={confetti}
        loop={true}
        autoplay={true}
        style={{ width: 900, height: 500 }}
      />
      <Lottie
        animationData={confetti}
        loop={true}
        autoplay={true}
        style={{ width: 900, height: 500 }}
      />
      </div>
      <Typography level="h2" sx={{ color: 'white' }}>Session Complete!</Typography>
      <Typography level="h3" sx={{ color: 'white' }}>You got {numberCorrect} out of {numberCorrect + numberIncorrect} questions correct.</Typography>
      <Button onClick={learnMode} sx={{ mt: 2 }}>Restart</Button>
    </div>
  )
            )
            
          }
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