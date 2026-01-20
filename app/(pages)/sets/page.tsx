"use client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons'; 

import React, { useEffect, useState } from 'react';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import Stack from '@mui/joy/Stack';
import Add from '@mui/icons-material/Add';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SetData {
  title: string;
  description: string;
  id: number;
}

export default function AddSet() {
  const [data, setData] = useState<SetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const searchParams = useSearchParams();
  const classId = searchParams?.get('classId') || '';

  useEffect(() => {
    if (!classId) {
      setData([]);
      setLoading(false);
      return;
    }
    fetchData(classId);
  }, [classId]);

  const fetchData = async (classIdParam?: string) => {
    const id = classIdParam ?? classId;
    if (!id) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/sets/${id}`);
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      const responseData = await response.json();
      setData(responseData.sets || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:3000/post/${classId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });
      const result = await response.json();
      if (response.ok) {
        setOpen(false);
        setTitle('');
        setDescription('');
        fetchData(classId); 
      } else {
        setError(result.message || 'Error adding set');
      }
    } catch (error) {
      setError('Error sending data');
    }
  };

  const handleDelete = async (setID: number) => {
    try {
      const response = await fetch('http://localhost:3000/delete', {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: setID })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message || 'Error deleting set');
      } else {
        fetchData(classId);
      }
    } catch (error) {
      setError('Error deleting data');
    }
  }

  return (
    <React.Fragment>
      <div className='mb-5'>
        <Button
          variant="outlined"
          color="neutral"
          startDecorator={<Add />}
          onClick={() => setOpen(true)}
        >
          New set
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog>
          <DialogTitle>Create new set</DialogTitle>
          <DialogContent>Fill in the information of the set.</DialogContent>
          <form
            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input autoFocus required value={title} onChange={e => setTitle(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input required value={description} onChange={e => setDescription(e.target.value)} />
              </FormControl>
              <Button type="submit">Submit</Button>
            </Stack>
          </form>
        </ModalDialog>
      </Modal>

      <div>
        {loading ? (
           <svg className="mr-3 size-5 animate-spin ..." viewBox="0 0 24 24"></svg>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <ul>
            {data.map((set, index) => (
              <div
                key={index}
                className="relative flex flex-col p-8 mb-7 items-center bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                style={{ position: 'relative' }}
              >
                
                <li className="w-full">
                  
                  <div className="flex items-center justify-between w-full">
                    <Link href={{pathname: '/flashcards', query: {title: set.title, setID: set.id} }}>
                    <div>
                      <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{set.title}</h2>
                      <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">{set.description}</p>
                    </div>
                    </Link>
                    <button className="ml-4" onClick={() => handleDelete(set.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </li>
                
              </div>
            ))}
          </ul>
        )}
      </div>
    </React.Fragment>
  );
}
