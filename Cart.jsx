import React from 'react'
import { useCart } from 'react-use-cart'
import { useNavigate } from 'react-router-dom'

const Cart = () => {
    const navigate = useNavigate();
    const{
        isEmpty,
        totalUniqueItems,
        items,
        totalItems,
        cartTotal,
        updateItemQuantity,
        removeItem,
        emptyCart,
    } = useCart();
    if(isEmpty) return <h1 className='text-center text-4xl font-bold mt-20'>Your cart is empty</h1>
  return (
    <section className='px-12 h-full py-10'>
      <h1 className='text-4xl font-bold mb-8'>Shopping Cart</h1>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          {/* head */}
          <thead>
            <tr>
              <th>Image</th>
              <th>Item Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {/* rows */}
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="avatar">
                    <div className="mask mask-squircle h-16 w-16">
                      <img
                        src={item.img}
                        alt={item.title} />
                    </div>
                  </div>
                </td>
                <td className='font-semibold'>{item.title}</td>
                <td>${item.price}</td>
                <td>
                  <div className='flex items-center gap-2'>
                    <button 
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className='btn btn-sm btn-outline'
                    >
                      -
                    </button>
                    <span className='px-4'>{item.quantity}</span>
                    <button 
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      className='btn btn-sm btn-outline'
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className='btn btn-sm btn-error'
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cart Summary */}
      <div className='mt-10 flex justify-end'>
        <div className='w-full md:w-1/3 bg-base-100 p-6 rounded-lg shadow-lg'>
          <h2 className='text-2xl font-bold mb-6'>Order Summary</h2>
          <div className='space-y-3 mb-6'>
            <div className='flex justify-between'>
              <span>Total Items:</span>
              <span className='font-semibold'>{totalItems}</span>
            </div>
            <div className='flex justify-between'>
              <span>Unique Items:</span>
              <span className='font-semibold'>{totalUniqueItems}</span>
            </div>
            <div className='divider'></div>
            <div className='flex justify-between text-lg font-bold'>
              <span>Total:</span>
              <span className='text-primary'>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className='flex gap-3'>
            <button 
              onClick={() => emptyCart()}
              className='btn btn-outline flex-1'
            >
              Clear Cart
            </button>
            <button 
              onClick={() => navigate('/placeOrder')}
              className='btn btn-primary flex-1'
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Cart