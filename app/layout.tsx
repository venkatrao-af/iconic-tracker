export const metadata = {
  title: 'Iconic Intelligence · Acres Foundation',
  description: 'Professional Construction Portfolio Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif", backgroundColor: '#F4F3EF', fontSize: '13px', color: '#1A1814' }}>
        {children}
      </body>
    </html>
  )
}
