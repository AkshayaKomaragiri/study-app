import React from 'react'
import axios from 'axios'
import { LoginForm } from './components/LoginForm';

const page = () => {
  //sign in 
 
  return (
    <React.Fragment>
        <div >
            <LoginForm className="w-96 mx-auto mt-20" />
            

        </div>
        
    </React.Fragment>
  )
}

export default page