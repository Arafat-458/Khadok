import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      title: 'Delicious Pizza',
      description: 'Fresh and hot pizzas made with premium ingredients',
      image: './img/Pizza.jpg',
      color: 'from-orange-500'
    },
    {
      id: 2,
      title: 'Juicy Burgers',
      description: 'Mouth-watering burgers crafted to perfection',
      image: './img/Burger.jpg',
      color: 'from-red-500'
    },
    {
      id: 3,
      title: 'Creamy Pasta',
      description: 'Authentic Italian pasta dishes you\'ll love',
      image: './img/Pasta.jpg',
      color: 'from-amber-500'
    },
    {
      id: 4,
      title: 'Delicious Biryani',
      description: 'Aromatic and flavorful biryani cooked to perfection',
      image: './img/Biriyani.jpg',
      color: 'from-yellow-600'
    },
    {
      id: 5,
      title: 'Grilled Sandwich',
      description: 'Fresh ingredients in a perfectly grilled sandwich',
      image: './img/Sandwich.jpg',
      color: 'from-green-500'
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
   <section>
        <div className='relative w-full min-h-screen overflow-hidden rounded-lg'>
          {/* Slides */}
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className={`bg-linear-to-r ${banner.color} to-transparent w-full h-full flex items-center justify-between px-12`}>
                <div className='w-1/2 text-white z-10'>
                  <h1 className='text-6xl font-bold mb-4'>Welcome to Khadok</h1>
                  <p className='text-2xl mb-6'>Discover delicious food and great deals</p>
                  <p className='text-lg mb-10'>Explore our wide variety of products and enjoy a seamless shopping experience with fast delivery.</p>
                  <button
                    onClick={() => navigate('/products')}
                    className='btn btn-lg btn-primary hover:btn-secondary transition'
                  >
                    Get Started
                  </button>
                </div>
                <div className='w-1/2 h-full flex items-center justify-center'>
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className='h-full w-full object-cover'
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className='absolute left-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-4 rounded-full hover:bg-opacity-90 transition z-20 text-2xl'
          >
            ❮
          </button>
          <button
            onClick={nextSlide}
            className='absolute right-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white p-4 rounded-full hover:bg-opacity-90 transition z-20 text-2xl'
          >
            ❯
          </button>

          {/* Dots Indicator */}
          <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20'>
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'bg-white w-10 h-4'
                    : 'bg-gray-400 w-4 h-4 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
    </section>
  )
}

export default Header