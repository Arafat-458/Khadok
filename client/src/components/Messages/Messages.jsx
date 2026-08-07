import React, { useEffect, useState } from 'react';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/contact');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        setError(null);
      } else {
        setError('Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Error fetching messages');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/contact/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMessages(messages.filter(msg => msg._id !== id));
        setSelectedMessage(null);
        alert('Message deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Error deleting message');
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:5000/contact/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedMessages = messages.map((msg) =>
          msg._id === id ? { ...msg, status } : msg
        );
        setMessages(updatedMessages);
        if (selectedMessage?._id === id) {
          setSelectedMessage({ ...selectedMessage, status });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Contact Messages</h1>
          <p className="text-gray-600">View and manage all customer messages</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <i className="fas fa-envelope text-4xl text-orange-500"></i>
              <div>
                <h3 className="text-gray-500 text-sm">Total Messages</h3>
                <p className="text-3xl font-bold text-gray-800">{messages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <i className="fas fa-users text-4xl text-blue-500"></i>
              <div>
                <h3 className="text-gray-500 text-sm">Unique Users</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {new Set(messages.map(m => m.email)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <i className="fas fa-redo text-4xl text-green-500"></i>
              <div>
                <h3 className="text-gray-500 text-sm">Last Updated</h3>
                <p className="text-sm font-bold text-gray-800">
                  {messages.length > 0 ? formatDate(messages[0].createdAt) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Display */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <span className="loading loading-spinner loading-lg text-orange-500"></span>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <i className="fas fa-exclamation-circle text-4xl mb-2"></i>
                  <p>{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-2"></i>
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition flex items-center gap-3 ${
                        selectedMessage?._id === message._id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {message.status === 'unread' ? (
                          <span className="inline-flex items-center justify-center h-3 w-3 rounded-full bg-orange-500"></span>
                        ) : (
                          <span className="inline-flex items-center justify-center h-3 w-3 rounded-full bg-gray-300"></span>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className={`font-bold ${message.status === 'unread' ? 'text-gray-900' : 'text-gray-600'}`}>
                              {message.name}
                            </h3>
                            <p className="text-sm text-gray-500">{message.email}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${message.status === 'unread' ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                          {message.subject}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message Details */}
          <div className="lg:col-span-1">
            {selectedMessage ? (
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedMessage.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedMessage.status === 'unread' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedMessage.status === 'unread' ? 'Unread' : 'Read'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">
                    <i className="fas fa-envelope text-orange-500 mr-2"></i>
                    {selectedMessage.email}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <i className="fas fa-phone text-orange-500 mr-2"></i>
                    {selectedMessage.phone}
                  </p>
                  <p className="text-xs text-gray-400">
                    <i className="fas fa-clock text-orange-500 mr-2"></i>
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>

                <hr className="my-4" />

                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 mb-2">Subject</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedMessage.subject}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-gray-800 mb-2">Message</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>

                <div className="flex gap-2 mb-3">
                  {selectedMessage.status === 'unread' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'read')}
                      className="flex-1 btn btn-sm btn-success"
                    >
                      <i className="fas fa-check mr-2"></i>
                      Mark as Read
                    </button>
                  )}
                  {selectedMessage.status === 'read' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage._id, 'unread')}
                      className="flex-1 btn btn-sm btn-warning"
                    >
                      <i className="fas fa-redo mr-2"></i>
                      Mark as Unread
                    </button>
                  )}
                </div>

                <button
                  onClick={() => deleteMessage(selectedMessage._id)}
                  className="w-full btn btn-outline btn-error"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete Message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                <i className="fas fa-comment-alt text-5xl mb-4 opacity-30"></i>
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
