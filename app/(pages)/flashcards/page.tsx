"use client";
import Flashcard from "./components/flashcard";
import React, { useEffect, useState } from 'react';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Stack from '@mui/joy/Stack';
import Add from '@mui/icons-material/Add';
import {useSearchParams} from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'; 
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'; 


export default function FlashcardPage({SearchParams}) {
  
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<FlashCardData[]>([]);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [selectedCard, setSelectedCard] = useState<FlashCardData>();
    const [currentIdx, setCurrentIdx] = useState<number>(0);
    const [currentCard, setCurrentCard] = useState<FlashCardData | undefined>();

    interface FlashCardData {
      question: string;
     answer: string;
     flashcardSetId: number;
 
}
    const searchParams = useSearchParams();
    const title = searchParams.get('title');
    const setID = Number(searchParams.get('setID'));
    const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/flashcards');
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      const responseData = await response.json();
      setData(responseData.flashcards || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:3000/postFlashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, answer, flashcardSetId: Number(setID) }),
      });
      const result = await response.json();
      console.log(result);
      if (response.ok) {
        setOpen(false);
        setQuestion('');
        setAnswer('');
        fetchData(); 
      } else {
        setError(result.message || 'Error adding set');
      }
    } catch (error) {
      setError('Error sending data');
    }
  }; 

  

 
  const filteredFlashcards = data.filter(f => f.flashcardSetId === setID);

  useEffect(() => {
    if (currentIdx >= filteredFlashcards.length && filteredFlashcards.length > 0) {
      setCurrentIdx(filteredFlashcards.length - 1);
    }
  }, [filteredFlashcards.length]);
  
  useEffect(() => {
      fetchData();
    }, []);
  return (
 
   
    <React.Fragment>
      <div>
        <header className="mb-4 font-sans">
        <h1 className="text-3xl mt-5 mb-10 text-slate-300 font-sans text-4xl" style={{ textAlign: 'center' }}>{title}</h1>
        </header>
      
      <div className='mb-10' style={{ textAlign: 'center' }}>
        <Button
          className="text-slate-300"
          variant="outlined"
          color="neutral"
          startDecorator={<Add />}
          onClick={() => setOpen(true)} >
            Add new card to set
        </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog>
          
         
          <form
            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Prompt</FormLabel>
                <Input autoFocus required value={question} onChange={e => setQuestion(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Answer</FormLabel>
                <Input required value={answer} onChange={e => setAnswer(e.target.value)} />
              </FormControl>
              <Button type="submit">Add</Button>
            </Stack>
          </form>
        </ModalDialog>
      </Modal>
         <div className="min-h-screen m-0">
      <div className="flex flex-col justify-center items-center mx-auto">
        {filteredFlashcards.length > 0 && (
          <div className="flex flex-row items-center mb-4">
            <button
              onClick={() => setCurrentIdx(idx => Math.max(0, idx - 1))}
              disabled={currentIdx === 0}
              className={`p-2 ${currentIdx === 0 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-white hover:text-gray-200'}`}
              aria-disabled={currentIdx === 0}
            >
              <FontAwesomeIcon icon={faChevronLeft} size="lg" className="mr-4" />
            </button>
            <Flashcard
              prompt={filteredFlashcards[currentIdx]?.question}
              answer={filteredFlashcards[currentIdx]?.answer}
            />
            <button
              onClick={() => setCurrentIdx(idx => Math.min(filteredFlashcards.length - 1, idx + 1))}
              disabled={currentIdx === filteredFlashcards.length - 1}
              className={`p-2 ${currentIdx === filteredFlashcards.length - 1 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-white hover:text-gray-200'}`}
              aria-disabled={currentIdx === filteredFlashcards.length - 1}
            >
              <FontAwesomeIcon icon={faChevronRight} size="lg" className="ml-4" />
            </button>
          </div>
        )}
        {filteredFlashcards.length === 0 && <p>No flashcards in this set.</p>}
      </div> 
      <div>
        <h1>Quiz</h1>

      </div>
      </div>
      </React.Fragment>
  );
}