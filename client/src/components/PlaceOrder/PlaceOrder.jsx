import React, { useEffect, useState } from 'react';
import { useCart } from 'react-use-cart';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import auth from '../firebase.init';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const {
    items,
    totalItems,
    cartTotal,
    emptyCart,
  } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) setFormData((current) => ({ ...current, email: user.email }));
  }, [user?.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const orderData = {
      userId: user?.uid,
      userInfo: {
        name: formData.name,
        email: String(formData.email || user?.email || '').toLowerCase(),
        phone: formData.phone,
        address: formData.address,
      },
      orderItems: items,
      totalItems: totalItems,
      cartTotal: cartTotal,
      orderDate: new Date().toISOString(),
      status: 'Pending'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Order submitted successfully:', result);
        alert('Order placed successfully!');
        emptyCart();
        setFormData({ name: '', email: '', phone: '', address: '' });
        navigate('/products');
      } else {
        alert('Failed to place order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="flex px-12 justify-evenly mt-10">
        <div
          className="card bg-base-300 shadow-2xl p-7"
          style={{ width: '500px' }}
        >
          <h1 className="text-4xl font-bold text-white py-2 text-center">
            Your information
          </h1>
          <hr />

          <form className="flex flex-col gap-5 w-full mt-5" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input input-bordered input-secondary w-full"
            />

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              readOnly={Boolean(user?.email)}
              required
              className="input input-bordered input-secondary w-full"
            />

            <input
              type="number"
              name="phone"
              placeholder="Enter your number"
              value={formData.phone}
              onChange={handleChange}
              required
              className="input input-bordered input-secondary w-full"
            />

            <textarea
              name="address"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              required
              className="textarea textarea-secondary w-full"
            />

            <input
              type="submit"
              value={loading ? 'Placing Order...' : 'order now'}
              disabled={loading}
              className="btn btn-primary"
            />
          </form>
        </div>
        <div className="">
          <p>Your card information</p>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              {/* head */}
              <thead>
                <tr>
                  <th></th>
                  <th>Product </th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
              
             {
    items?.map((item, index) => {
        return (
            <tr key={item.id || index}>
                <th> {index + 1} </th>
                <td>
                    <div className="avatar">
                        <div className="w-20 rounded">
                            <img src={item?.img} alt="Tailwind-CSS-Avatar-component" />
                        </div>
                    </div>
                </td>
                <td> {item?.title} </td>
                <td> {item?.quantity} </td>
                <td> ${item?.price} </td>
            </tr>
        )
    })
}



              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlaceOrder;
