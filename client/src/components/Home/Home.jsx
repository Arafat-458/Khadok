import React from 'react'
import Header from '../Header/Header'
import Products from '../Products/Products'
import Chatbot from '../Chatbot/Chatbot'


const Home = () => {
  return (
    <section>
        <Header/>
        <Chatbot/>
        <Products/>
    </section>
  )
}

export default Home