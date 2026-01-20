"use client"
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'; 
import { useState, useEffect } from 'react'; 
import Link from 'next/link';
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
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Jwt } from 'jsonwebtoken';

interface Class{
  name: string;
  id: string;
}
const page = () => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});
     const [data, setData] = useState<Class[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [name, setName] = useState("");
       const [open, setOpen] = useState(false);
    const handleMouseMove = (e: React.MouseEvent<HTMLElement>, index: number) => {
      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      setPositions(prev => ({ ...prev, [index]: { x, y } }));
    };

      useEffect(() => {
        fetchData();
      }, [open]);
    
     const fetchData = async () => {
  try {
    const storedJwt = localStorage.getItem("jwt");
    if (!storedJwt) {
      setError("No session found. Please log in.");
      setLoading(false);
      return;
    }

    // The login returns an object like { id, name, email, token }
    const userData = JSON.parse(storedJwt);
    const token = userData.token; // Ensure you are extracting the .token property

    const response = await fetch('http://localhost:3000/classes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Ensure there is a SPACE after 'Bearer'
        'Authorization': `Bearer ${token}` 
      }
    });

    if (response.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }

    const responseData = await response.json();
    setData(responseData.classes || []);
    setLoading(false);
  } catch (err: any) {
    setError(err.message);
    setLoading(false);
  }
};

    

      const handleSubmit = async () => {
        setError(null);
        setLoading(true);
    try {
      const storedJwt = localStorage.getItem("jwt"); 
       if (!storedJwt) {
      setError("No session found. Please log in.");
      setLoading(false);
      return;
    }
    const userData = JSON.parse(storedJwt);
    const token = userData.token;
      const response = await fetch(`http://localhost:3000/postClass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (response.ok) {
        setOpen(false);
        setName('');
        
      } else {
        setError(result.message || 'Error adding class');
      }
    } catch (error) {
      setError('Error sending data' + error);
    }
  }; 

    const handleDelete = async (classId: string) => {
    try {
      console.log(classId);
      const response = await fetch('http://localhost:3000/deleteClass', {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ classId: classId })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message || 'Error deleting set');
      } else {
        fetchData();
      }
    } catch (error) {
      setError('Error deleting data');
    }
  }

  return (
    <React.Fragment>
        <div className='mb-5 mt-5 flex justify-center'>
        <Button
          variant="outlined"
          color="neutral"
          startDecorator={<Add />}
          onClick={() => setOpen(true)}
        >
          New Class
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog>
          <DialogTitle>Create Class</DialogTitle>
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
                <Input autoFocus required value={name} onChange={e => setName(e.target.value)} />
              </FormControl>
              <FormControl>
              </FormControl>
              <Button type="submit">Submit</Button>
            </Stack>
          </form>
        </ModalDialog>
      </Modal>
         <div className='ml-10 mr-10'>
        {loading ? (
        //  <svg className="mr-3 size-5 animate-spin" viewBox="0 0 24 24"></svg>
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.map((Class, index) => (
              <div key={index}>
                
                  <li
                    onMouseMove={(e) => handleMouseMove(e, index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="relative w-full h-60 rounded-xl p-px bg-gray-900 backdrop-blur-md text-gray-800 overflow-hidden shadow-lg cursor-pointer"
                  >
                    <h1 className="text-zinc-400 text-xl font-bold ml-2 mt-4"><Link href={{ pathname: '/sets', query: { classId: Class.id } }}><p>{Class.name}</p></Link>
                   
                  <Menu as="div" className="absolute top-0 right-0 mr-4 mt-4" >
                    <MenuButton className="inline-flex w-full justify-center gap-x-1.5  bg-white/10  text-sm font-semibold text-white inset-ring-1 inset-ring-white/5 hover:bg-white/20" >
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                    </MenuButton>

                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 outline-1 -outline-offset-1 outline-white/10 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                    >
                      <div className="py-1">
                        <MenuItem >
                    
                        <a onClick={() => handleDelete(Class.id)} className="block px-4 py-2 text-sm text-gray-300 data-focus:bg-white/5 data-focus:text-white data-focus:outline-hidden">
                          Delete
                        </a>
                      </MenuItem>
                      
                      </div>
                    </MenuItems>
                  </Menu>
                
 

                    </h1>

                    
                    <div
                      className={`pointer-events-none blur-3xl rounded-full bg-gradient-to-r from-blue-500 via-indigo-800 to-purple-300 size-40 absolute z-0 transition-opacity duration-450 ${
                        hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ top: (positions[index]?.y || 0) - 120, left: (positions[index]?.x || 0) - 120 }}
                    />
                  </li>
                
                
              </div>
            ))}
          </ul>
        )}
        </div>
    </React.Fragment>
  )
}

export default page 





//  <div
//                 ref={divRef}
//                 onMouseMove={handleMouseMove}
//                 onMouseEnter={() => setVisible(true)}
//                 onMouseLeave={() => setVisible(false)}
//                 className="relative w-80 h-60 rounded-xl p-px bg-gray-900 backdrop-blur-md text-gray-800 overflow-hidden shadow-lg cursor-pointer"
//             >
//                 <h1 className="text-zinc-400 text-xl font-bold ml-2 mt-4">
//                     title
//                 </h1>
//                 <div
//                     className={`pointer-events-none blur-3xl rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-300 size-40 absolute z-0 transition-opacity duration-450 ${visible ? 'opacity-100' : 'opacity-0'}`}
//                     style={{ top: position.y - 120, left: position.x - 120 }}
//                 />
//                 <p className="text-zinc-400 text-sm/6 mt-2 ml-2 mb-2">
//                     description
//                 </p>
//             </div>
//     </div> 