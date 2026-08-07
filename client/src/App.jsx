import React, { lazy, Suspense } from 'react'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import { Route, Routes } from 'react-router'
import { Link } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import Home from './components/Home/home'
import { CartProvider } from 'react-use-cart'
import auth from './components/firebase.init'
import { isAdminEmail } from './components/Authentication/adminAccess'

// Load pages only when a visitor opens them, keeping the first screen light.
const Products = lazy(() => import('./components/Products/Products'));
const Product = lazy(() => import('./components/Product/Product'));
const Login = lazy(() => import('./components/Authentication/Login/Login'));
const Registration = lazy(() => import('./components/Authentication/Registration/Registration'));
const Cart = lazy(() => import('./components/Cart/Cart'));
const PlaceOrder = lazy(() => import('./components/PlaceOrder/PlaceOrder'));
const About = lazy(() => import('./components/About/About'));
const Contact = lazy(() => import('./components/Contact/Contact'));
const Messages = lazy(() => import('./components/Messages/Messages'));
const ProductDetails = lazy(() => import('./components/ProductDetails/ProductDetails'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const MyOrders = lazy(() => import('./components/MyOrders/MyOrders'));

const LoginRequired = () => (
  <section className="mx-auto max-w-xl px-6 py-24 text-center text-white">
    <h1 className="text-3xl font-bold">Login Required</h1>
    <p className="mt-4 text-lg">Please log in or sign up to view product details and place an order.</p>
    <Link to="/login" className="btn btn-primary mt-6">Login</Link>
  </section>
);

const CustomerOnly = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div className="p-10 text-white">Loading...</div>;
  return user ? children : <LoginRequired />;
};

const AdminLoginRequired = () => (
  <section className="mx-auto max-w-xl px-6 py-24 text-center text-white">
    <h1 className="text-3xl font-bold">Admin Login Required</h1>
    <p className="mt-4 text-gray-300">This area is available only to the authorized admin account.</p>
    <Link to="/login?mode=admin" className="btn btn-primary mt-6">Admin Login</Link>
  </section>
);

const AdminOnly = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div className="p-10 text-white">Loading...</div>;
  return isAdminEmail(user?.email) ? children : <AdminLoginRequired />;
};


const App = () => {
  return (
    <CartProvider>
    <div className="flex flex-col min-h-screen">
     <Navbar/>
     <main className="flex-grow">
     <Suspense fallback={<div className="p-10 text-white">Loading page...</div>}>
     <Routes>
      <Route path='/' element={<Home/>}></Route>
      <Route path='home' element={<Home/>}></Route>
      <Route path='products' element={<Products/>}></Route>
      <Route path='/product' element={<Product/>}></Route>
      <Route path='products/:productId' element={<CustomerOnly><ProductDetails/></CustomerOnly> }></Route>
      <Route path='placeOrder' element={<CustomerOnly><PlaceOrder/></CustomerOnly>}></Route>
      <Route path='/login' element={<Login/>}></Route>
      <Route path='/cart' element={<CustomerOnly><Cart/></CustomerOnly>}></Route>
      <Route path='/my-orders' element={<CustomerOnly><MyOrders/></CustomerOnly>}></Route>
      <Route path='/registration' element={<Registration/>}></Route>
      <Route path='/about' element={<About/>}></Route>
      <Route path='/contact' element={<Contact/>}></Route>
      <Route path='/messages' element={<AdminOnly><Messages/></AdminOnly>}></Route>
      <Route path='/admin' element={<AdminOnly><AdminDashboard/></AdminOnly>}></Route>
     </Routes>
     </Suspense>
     </main>
     <Footer/>
    </div>
    </CartProvider>
  )
}

export default App
