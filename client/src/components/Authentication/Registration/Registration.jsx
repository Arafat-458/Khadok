import React, { useRef, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { updateProfile } from 'firebase/auth';
import auth from '../../firebase.init'
import { isAdminEmail } from '../adminAccess'

const Registration = () => {
    //this is react firebase hooks
    const[
        createUserWithEmailAndPassword,
        user,
        loading,
        error,
    ] = useCreateUserWithEmailAndPassword(auth);
    const navigate = useNavigate();
    const [reservedEmailError, setReservedEmailError] = useState('');
    useEffect(() => {
        if (user) {
            updateProfile(user, { displayName: nameRef.current.value }).catch(error => console.error('Error updating profile:', error));
            navigate('/home');
        }
    }, [user, navigate]);
    const nameRef = useRef('');
    const emailRef = useRef('');
    const passwordRef = useRef('');
    const handleSubmit = e =>{
    e.preventDefault();
    const name =nameRef.current.value;
    const email =emailRef.current.value;
    const password =passwordRef.current.value;  
    if (isAdminEmail(email)) {
      setReservedEmailError('Sorry, এই account শুধু admin-এর জন্য…');
      return;
    }
    setReservedEmailError('');
        createUserWithEmailAndPassword(email, password);

}
if(user){
    navigate('/home');
}
let errorElement;
if(error){
 errorElement = <div role="alert" className="alert alert-error shadow-lg">
  
  <span>{error?.message}</span>
</div>;
} 
let loadingElement;
if(error){
 loadingElement = <>
<button className="btn btn-square">
  <span className="loading loading-spinner"></span>
</button>

<button className="btn">
  <span className="loading loading-spinner"></span>
  loading
</button>
</>;
} 
 return (
    <section className="w-96 h-screen" style={{margin:'0 auto'}}>
   
          <div className="card bg-base-100 shadow-xl mt-20" >
  <div className="card-body">
    <h2 className="text-center text-4xl text-white font-bold mt-5">Signup</h2>
<form onSubmit={handleSubmit} className='flex flex-col gap-5 mt-10'>
    <input ref={nameRef} type="text" name="name" id="1" placeholder='Enter your Name' className='p-3 rounded-md text-lg font-semibold border-0 outline-none' autoComplete="name"/>
     <input ref={emailRef} type="email" name="email" id="2" placeholder='Enter your Email' className='p-3 rounded-md text-lg font-semibold border-0 outline-none' autoComplete="email"/>
     <input ref={passwordRef} type="password" name="password" id="3" placeholder='Enter your Password' className='p-3 rounded-md text-lg font-semibold border-0 outline-none' autoComplete="new-password"/>
    {/*if error */}
    {reservedEmailError && <div role="alert" className="alert alert-error shadow-lg"><span>{reservedEmailError}</span></div>}
    {errorElement}
         {/*if loading */}
     {loadingElement}
  <input type="submit" value="Signup" className='btn btn-primary' disabled={loading}/>
  {error && <p className="text-red-500">{error.message}</p>}
  </form>    
  <div className="flex flex-col w-full mt-10">
  <div >
  <Link to="/login" className='text-lg font-smibold text-white'> Already have an account? </Link>
  </div>
  <div className="divider"></div>
<div>
    <button className='btn  primary w-full'>Login with google</button>
    </div>
    </div>
  
  </div>
</div>
        
    </section>
  );
};

export default Registration
