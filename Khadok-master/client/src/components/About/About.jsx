import React from 'react';

const About = () => {
  return (
    <section className="min-h-screen bg-base-200 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-base-300 bg-base-100/70 p-8 shadow-xl">
          <h1 className="text-4xl font-bold">About Foodie</h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-300">
            Foodie is a modern food commerce experience that combines healthy recommendations, budget-friendly meal suggestions, and fast delivery support in one place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-base-300 bg-base-100/70 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="mt-3 text-gray-300">
              We want every customer to discover tasty food that fits their health goals, budget, and schedule without compromising quality.
            </p>
          </div>
          <div className="rounded-3xl border border-base-300 bg-base-100/70 p-8 shadow-xl">
            <h2 className="text-2xl font-semibold">Our Vision</h2>
            <p className="mt-3 text-gray-300">
              To become the most trusted local food platform by blending smart recommendations, easy ordering, and excellent service.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-base-300 bg-base-100/70 p-8 shadow-xl">
          <h2 className="text-2xl font-semibold">Our Team</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {['Arafat Rahman', 'Shafin Mahmud', 'Turjo Chy'].map((member) => (
              <div key={member} className="rounded-2xl bg-base-200 p-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-semibold">{member.split(' ').map((word) => word[0]).join('')}</div>
                <h3 className="font-semibold">{member}</h3>
                <p className="text-sm text-gray-400">Foodie Operations</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
