import React from 'react'

const copy = {
  terms: [
    {
      heading: 'Use of the service',
      body: 'This starter provides a generic example application. Replace this text with terms that match your product, users, and operating model before launch.',
    },
    {
      heading: 'Accounts and content',
      body: 'You are responsible for the information you submit and for keeping your own credentials secure. Example data in this starter is not intended for production policy coverage.',
    },
    {
      heading: 'Changes',
      body: 'You may update these terms as your application evolves. Publish the current version in a place users can review.',
    },
  ],
  privacy: [
    {
      heading: 'Information collected',
      body: 'This starter includes example endpoints that can store a name and email address in D1, plus simple object data in R2. Adjust the policy for the data your application actually collects.',
    },
    {
      heading: 'How information is used',
      body: 'Use collected information only to operate the application, provide support, improve reliability, and meet legal requirements that apply to your service.',
    },
    {
      heading: 'Data choices',
      body: 'Provide users with a clear way to request access, correction, export, or deletion when those rights apply.',
    },
  ],
}

export function LegalPage({ kind, title }) {
  return (
    <section className="legal-page">
      <p className="eyebrow">Generic copy</p>
      <h1>{title}</h1>
      <p className="lede">
        This page is placeholder text for a starter application. Review it with counsel
        before using it in a real product.
      </p>

      <div className="legal-sections">
        {copy[kind].map((section) => (
          <article className="legal-section" key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
