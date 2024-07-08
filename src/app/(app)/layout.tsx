import React from 'react'

interface RootLayout {
  children: React.ReactNode
}

const RootLayout: React.FC<RootLayout> = ({ children }) => {
  return (
    <html>
      <head></head>
      <body>{children}</body>
    </html>
  )
}

export default RootLayout
