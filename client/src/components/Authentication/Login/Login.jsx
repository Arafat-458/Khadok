import React, { useRef, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useSignInWithEmailAndPassword, useSignInWithGoogle, useSignInWithGithub } from 'react-firebase-hooks/auth';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import auth, { googleProvider, githubProvider } from '../../firebase.init'
import { isAdminEmail } from '../adminAccess'

const Login = () => {
  const [
  signInWithEmailAndPassword,
  user,
  loading,
  error,
  ] = useSignInWithEmailAndPassword(auth);
  const [signInWithGoogle, googleUser, googleLoading, googleError] = useSignInWithGoogle(auth);
  const [signInWithGithub, githubUser, githubLoading, githubError] = useSignInWithGithub(auth);
  const [customError, setCustomError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminLogin = searchParams.get('mode') === 'admin';
  
  useEffect(() => {
    const signedInUser = user || googleUser || githubUser;
    if (signedInUser) {
      navigate(isAdminEmail(signedInUser.email) ? '/admin' : '/home');
    }
  }, [user, googleUser, githubUser, navigate]);

  const emailRef = useRef('');
  const passwordRef = useRef('');
  
  const handleLogin = (e) => {
    e.preventDefault();
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    setCustomError('');
    if (isAdminLogin && !isAdminEmail(email)) {
      setCustomError('This login is for the authorized admin account only.');
      return;
    }
    signInWithEmailAndPassword(email, password);
  }

  const handleGoogleSignIn = async () => {
    try {
      setCustomError('');
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign In Error:', err);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setCustomError('');
      await signInWithGithub();
    } catch (err) {
      console.error('GitHub Sign In Error:', err);
    }
  };

  let errorElement;
  if(error || googleError || githubError || customError){
    let errorMessage = customError || error?.message || googleError?.message || githubError?.message;
    
    // Check if error is about account exists with different credential
    if (errorMessage?.includes('account-exists-with-different-credential') || 
        errorMessage?.includes('auth/popup-blocked')) {
      errorMessage = 'This email is already registered with another method. Please use your original sign-in method.';
    }
    
    errorElement = <div role="alert" className="alert alert-error shadow-lg">
      <span>{errorMessage}</span>
    </div>;
  } 

  let loadingElement;
  if(loading || googleLoading || githubLoading){
    loadingElement = <>
      <button className="btn btn-square loading">
        <span className="loading loading-spinner"></span>
      </button>
    </>;
  } 

  return (
    <section className="w-96 h-screen" style={{margin:'0 auto'}}>
      <div className="card bg-base-100 shadow-xl mt-20" >
        <div className="card-body">
          <h2 className="text-center text-4xl text-white font-bold mt-5">{isAdminLogin ? 'Admin Login' : 'Login'}</h2>
          {isAdminLogin && <p className="mt-3 text-center text-sm text-gray-300">You can't create an account here. Use the authorized admin email and password.</p>}

          <form onSubmit={handleLogin} className='flex flex-col gap-5 mt-10'>
            <input 
              ref={emailRef} 
              type="email" 
              name="email" 
              id="1" 
              placeholder='Enter your Email' 
              className='p-3 rounded-md text-lg font-semibold border-0 outline-none' 
              autoComplete="email"
            />
            <input 
              ref={passwordRef} 
              type="password" 
              name="password" 
              id="2" 
              placeholder='Enter your Password' 
              className='p-3 rounded-md text-lg font-semibold border-0 outline-none' 
              autoComplete="current-password"
            />
            {errorElement}
            {loadingElement}
            <input type="submit" value="Login" className='btn btn-primary' disabled={loading}/>
          </form>    

          {!isAdminLogin && <div className="flex flex-col w-full mt-10">
            <div>
              <Link to="/registration" className='text-lg font-semibold text-white'> Don't have an account? Sign up </Link>
            </div>
            <div className="divider"></div>

            <div className='flex flex-col gap-3'>
              <button 
                onClick={handleGoogleSignIn} 
                disabled={loading || googleLoading}
                className='btn btn-primary w-full flex items-center justify-center gap-2'
              >
                <svg className='w-5 h-5' viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              <button 
                onClick={handleGithubSignIn} 
                disabled={loading || githubLoading}
                className='btn btn-primary w-full flex items-center justify-center gap-2'
              >
                <svg className='w-5 h-5' viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Sign in with GitHub
              </button>
            </div>
          </div>}
        </div>
      </div>
    </section>
  );
};

export default Login
