import React from "react"

export default function Head() {
  return (
    <>
      {/* version query param to bust cache when favicon changes */}
  <link rel="icon" href="/favicon.ico?v=2" />
  <link rel="icon" type="image/png" sizes="192x192" href="/elitfans-logo.png?v=2" />
  <link rel="shortcut icon" href="/favicon.ico?v=2" />
  <link rel="apple-touch-icon" href="/elitfans-logo.png?v=2" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />
    </>
  )
}
