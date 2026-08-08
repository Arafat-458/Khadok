
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import auth from '../firebase.init'
import { useCart } from 'react-use-cart';
import { isAdminEmail } from '../Authentication/adminAccess';

const Navbar = () => {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const isAdmin = isAdminEmail(user?.email);
  const showAccount = Boolean(user) && (!isAdmin || location.pathname === '/admin');
  //console.log(user);
  const handlelogout = () => {
  signOut(auth);
  }
  //cart item
  const{
    totalItems,
    cartTotal,
    
  }= useCart();
  const navItem = [
    <>
    <li><a className='text-white'><Link to='/home'>Home</Link></a></li>
    <li><a className='text-white'><Link to='/products'>Products</Link></a></li>
    <li><a className='text-white'><Link to='/about'>About</Link></a></li>
    <li><a className='text-white'><Link to='/contact'>Contact</Link></a></li>
    {user && !isAdmin && <li><a className='text-white'><Link to='/my-orders'>My Orders</Link></a></li>}
    {isAdmin && <li><a className='text-white'><Link to='/admin'>Admin</Link></a></li>}
    </>
  ]
  return (
   <section>
    <div className="navbar bg-secondary shadow-sm">
  <div className="navbar-start">
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
      </div>
      <ul
        tabIndex={-1}
        className="menu menu-sm dropdown-content bg-black rounded-box z-1 mt-3 w-52 p-2 shadow">
        {navItem}
      </ul>
    </div>
    <a className="btn btn-ghost text-xl text-white font-extrabold">Khadok</a>
  </div>
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      {navItem}
    </ul>
  </div>
  <div className="navbar-end px-12">
    
  <div className="flex-none">
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> </svg>
          <span className="badge badge-sm indicator-item">{totalItems}</span>
        </div>
      </div>
      <div
        tabIndex={0}
        className="card card-compact dropdown-content bg-base-100 z-1 mt-3 w-52 shadow">
        <div className="card-body">
          <span className="text-lg font-bold">{totalItems}</span>
          <span className="text-info">Subtotal: ${cartTotal}</span>
          <div className="card-actions">
            <Link to='/cart' className="btn btn-primary btn-block">View cart</Link>
          </div>
        </div>
      </div>
    </div>
  </div>
      <div className='ml-10'>
    {showAccount ? (
      <div className="flex items-center gap-3">
        <span className="max-w-48 truncate text-sm text-white">{user.email}</span>
        <button onClick={handlelogout} className="btn bg-pink-500 text-white">Logout</button>
      </div>
    ) : (
      <Link to="/login" className="btn bg-pink-500 text-white">Login</Link>
    )}
     </div>

  
  </div>
</div>
   </section>
  );
};

export default Navbar
